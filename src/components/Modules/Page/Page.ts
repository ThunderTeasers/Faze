/**
 * Плагин бесконечной загрузки
 *
 * Сам модуль представляет из себя обертку, которая навешивается на DOM элемент содержащий элементы, снизу создается кнопка, при нажатии
 * на которую в него будут добавляться новые, динамически подгруженные, элементы.
 *
 * Автор: Ерохин Максим
 * Дата: 01.10.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'NewsList',
 *     plugins: ['Page'],
 *     condition: document.querySelectorAll('.news .items').length,
 *     callback: () => {
 *       new Faze.Page(document.querySelector('.news .items'), {
 *         offset: 10,
 *         quantity: 10,
 *         tableName: 'list',
 *         modules: {
 *           get: 111222,
 *         },
 *       });
 *     }
 *   });
 *
 * В HTML:
 *   <div class="news">
 *     <div class="items">
 *       <div class="item">Новость 1</div>
 *       <div class="item">Новость 2</div>
 *       <div class="item">Новость 3</div>
 *     </div>
 *   </div>
 */

import './Page.scss';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *  node        - DOM элемент родителя
 *  button      - DOM элемент кнопки подгрузки
 *  items       - все DOM элементы объектов
 *  loadedItems - новые DOM элементы объектов
 */
interface CallbackData {
  node: HTMLElement;
  button: HTMLButtonElement;
  items: NodeListOf<HTMLElement>;
  loadedItems?: NodeListOf<HTMLElement>;
}

/**
 * Структура конфига
 *
 * Содержит:
 * offset       - изначальный сдвиг
 * quantity     - количество подгружаемых элементов
 * tableName    - префикс таблицы в системе Plarson
 * modules
 *   get        - ID модуля в системе Plarson, который содержит элементы для подгрузки
 * selectors
 *   items      - CSS селектор элементов списка
 * callbacks
 *   created    - кастомный метод, выполняется после инициализации
 *   loaded     - кастомный метод, выполняется после загрузки и вставки новых элементов
 */
interface Config {
  offset: number;
  quantity: number;
  modifyPath: boolean;
  tableName?: string;
  updatePagination: boolean;
  modules: {
    get?: number;
  };
  selectors: {
    items: string;
    pagination: string;
  };
  callbacks: {
    created?: (data: CallbackData) => void;
    loaded?: (data: CallbackData) => void;
  };
  texts: {
    buttonIdle: string;
    buttonLoading: string;
  };
}

/**
 * Класс бесконечной подгрузки
 */
class Page {
  // DOM элемент бесконечной загрузки
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент кнопки загрузки
  readonly buttonLoadModeNode: HTMLButtonElement;

  // GET параметр сдвига(offset) при выборке элементов
  readonly offsetString: string;

  // Текущий сдвиг для получения запроса с сервера, работает так же как и в OFFSET в SQL
  offset: number;

  // Параметры строки поиска
  params: URLSearchParams;

  // Общее количество элементов
  total: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект бесконечной загрузки');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      offset: 10,
      quantity: 10,
      tableName: undefined,
      modifyPath: false,
      updatePagination: false,
      modules: {
        get: undefined,
      },
      selectors: {
        items: '.item',
        pagination: '.pagination',
      },
      callbacks: {
        created: undefined,
        loaded: undefined,
      },
      texts: {
        buttonIdle: 'Показать ещё',
        buttonLoading: 'Загрузка...',
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    this.buttonLoadModeNode = document.createElement('button');

    // Сдвиг для выборки
    this.offsetString = `first${this.config.tableName}`;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Присвоение класса для обертки плагина
    this.node.classList.add('faze-page');

    // Получение общего числа элементов
    this.updateTotal();

    // Присвоение текущего сдвига, для корректного счета при последующей загрузке
    this.resetOffset();

    // Создание кнопки
    this.createButton();

    // Инициализация параметров
    this.params = new URLSearchParams(window.location.search);

    const initialOffset: number = parseInt(this.params.get(this.offsetString) || '0', 10);
    if (initialOffset > 0) {
      this.offset = initialOffset + this.config.quantity;
    }

    // Проверка кнопки на необходимость скрытия
    this.checkButton();

    // Выполнение кастомной функции
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          node: this.node,
          button: this.buttonLoadModeNode,
          items: this.node.querySelectorAll(this.config.selectors.items),
          loadedItems: undefined,
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции "created": ', error);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    // Бинд клика на кнопку, при котором происходит подгрузка новых элементов
    this.buttonLoadModeNode.addEventListener('click', () => {
      // Переинициализация параметров
      this.params = new URLSearchParams(window.location.search);

      // Обновление сдвига в строке параметров
      this.params.set(this.offsetString, this.offset.toString());

      // Строка для изменения пути по сайту
      const historyURL: string = `?${this.params.toString()}`;

      if (this.config.modules.get) {
        this.params.append('show', this.config.modules.get.toString());
      } else {
        console.error('Не задан ID модуля для "show"!');
      }
      this.params.append('mime', 'txt');

      // Блокировка кнопки от повторного нажатия
      this.lockButton();

      // Собираем URL для запроса на сервер
      const basePath = this.node.dataset.fazePagePath || window.location.pathname;

      // Путь для запроса новых элементов
      const url: string = `${basePath}${basePath.includes('?') ? '&' : '?'}${this.params.toString()}`;

      // Получение новых элементов
      fetch(url, { credentials: 'same-origin' })
        .then((response: Response) => response.text())
        .then((response: string) => {
          // Парсинг ответа
          const responseHTML: Document = new DOMParser().parseFromString(response, 'text/html');

          // DOM элементы загруженных объектов
          const loadedItemNodes: NodeListOf<HTMLElement> = responseHTML.querySelectorAll(this.config.selectors.items);

          // Фставка новых элементов
          loadedItemNodes.forEach((loadedItemNode: HTMLElement) => {
            this.node.append(loadedItemNode);
          });

          // Обновляем пагинацию, если это нужно
          if (this.config.updatePagination) {
            this.updatePagination(responseHTML);
          }

          // Изменение сдвига
          this.offset += this.config.quantity;

          // Разблокировка кнопки
          this.unlockButton();

          // Проверка кнопки на необходимость скрытия
          this.checkButton();

          // Изменение пути
          if (this.config.modifyPath) {
            // Обновление строки в браузере
            window.history.pushState({}, '', historyURL);
          }

          // Выполнение кастомной функции
          if (typeof this.config.callbacks.loaded === 'function') {
            try {
              this.config.callbacks.loaded({
                node: this.node,
                button: this.buttonLoadModeNode,
                items: this.node.querySelectorAll(this.config.selectors.items),
                loadedItems: <any>loadedItemNodes,
              });
            } catch (error) {
              console.error('Ошибка исполнения пользовательского метода "loaded"', error);
            }
          }
        })
        .catch((error) => {
          console.error('Ошибка получения новых элементов для бесконечной подгрузки', error);
        });
    });
  }

  /**
   * Обновление пагинации
   *
   * @param responseHTML{Document} DOM элемент ответа от сервера
   *
   * @private
   */
  private updatePagination(responseHTML: Document) {
    // DOM элемент пагинации
    const newPaginationNode = responseHTML.querySelector(this.config.selectors.pagination);

    // DOM элемент пагинации
    const oldPaginationNode = this.node.querySelector(this.config.selectors.pagination);

    // Если присутствуют и старая и новая пагинация, то удаляем текущую
    if (newPaginationNode && oldPaginationNode) {
      oldPaginationNode.innerHTML = newPaginationNode.innerHTML;

      // Перемещаем его в самый низ
      oldPaginationNode.parentNode?.appendChild(oldPaginationNode);
    }
  }

  /**
   * Создание кнопки и её вставка в родительский элемент содержащий все элементы, при нажатии на неё будет совершена подгрузка
   */
  createButton(): void {
    this.buttonLoadModeNode.textContent = this.config.texts.buttonIdle;
    this.buttonLoadModeNode.type = 'button';
    this.buttonLoadModeNode.className = 'btn btn-load_more';

    this.node.after(this.buttonLoadModeNode);
  }

  /**
   * Блокировка кнопки, от повторного нажатия до того как текущий контент был загружен
   */
  lockButton(): void {
    this.buttonLoadModeNode.setAttribute('disabled', 'disabled');
    this.buttonLoadModeNode.classList.add('faze-disabled');
    this.buttonLoadModeNode.textContent = this.config.texts.buttonLoading;
  }

  /**
   * Возвращение кнопки в нормальное состояние
   */
  unlockButton(): void {
    this.buttonLoadModeNode.removeAttribute('disabled');
    this.buttonLoadModeNode.classList.remove('faze-disabled');
    this.buttonLoadModeNode.textContent = this.config.texts.buttonIdle;
  }

  /**
   * Обновление значения общего количества элементов
   *
   * @param total - опциональное значение, если не задано, берется значение из атрибута "data-page-total"
   */
  updateTotal(total?: number): void {
    if (total === undefined || total === null) {
      this.total = parseInt(this.node.getAttribute('data-faze-page-total') || '9999', 10) || 9999;
    } else {
      this.total = total;
    }
  }

  /**
   * Сброс количества загруженных элементов
   */
  resetOffset(): void {
    this.offset = this.config.offset;
  }

  /**
   * Проверка, если загружены все элементы, то скрываем кнопку
   */
  checkButton(): void {
    if (this.offset >= this.total) {
      this.buttonLoadModeNode.classList.add('faze-hide');
    } else {
      this.buttonLoadModeNode.classList.remove('faze-hide');
    }
  }

  /**
   * Изменение параметров загрузки новых элементов, может порадобиться например при фильтрации и последующей бесконечной прокрутке
   *
   * @param params - параметры поисковой строки
   */
  setParams(params: URLSearchParams): void {
    this.params = params;
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    const pageInitializers: NodeListOf<HTMLElement> = document.querySelectorAll('[data-faze~="page"]');
    pageInitializers.forEach((pageInitializer: any) => {
      new Page(pageInitializer, {
        offset: parseInt(pageInitializer.dataset.fazePageOffset || '10', 10),
        quantity: parseInt(pageInitializer.dataset.fazePageQuantity || '10', 10),
        tableName: pageInitializer.getAttribute('data-faze-page-table_name'),
        modifyPath: pageInitializer.getAttribute('data-faze-page-modify_path'),
        updatePagination: (pageInitializer.dataset.fazePageUpdatePagination || 'false') === 'true',
        modules: {
          get: pageInitializer.dataset.fazePageModulesGet,
        },
        selectors: {
          items: pageInitializer.dataset.fazePageSelectorsItems || '.item',
          pagination: pageInitializer.dataset.fazePageSelectorsPagination || '.pagination',
        },
      });
    });
  }
}

export default Page;
