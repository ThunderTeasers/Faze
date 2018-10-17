/**
 * Плагин бесконечной загрузки
 *
 * Сам модуль представляет из себя обертку, которая навешивается на DOM элемент содержащий элементы, снизу создается кнопка, при нажатии
 * на которую в него будут добавляться новые, динамически подгруженные, элементы.
 *
 * Автор: Ерохин Максим, plarson.ru
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
 *  node    - DOM элемент родителя
 *  button  - DOM элемент кнопки подгрузки
 *  items   - зашруженные элементы
 */
interface CallbackData {
  node: HTMLElement;
  button: HTMLButtonElement;
  items: NodeListOf<HTMLElement>;
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
  tableName?: string;
  modules: {
    get?: number;
  };
  selectors: {
    items: string;
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
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент кнопки загрузки
  readonly buttonLoadModeNode: HTMLButtonElement;

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
      modules: {
        get: undefined,
      },
      selectors: {
        items: '.item',
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

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Присвоение класса для обертки плагина
    this.node.classList.add('.faze-page');

    // Получение общего числа элементов
    this.updateTotal();

    // Присвоение текущего сдвига, для корректного счета при последующей загрузке
    this.resetOffset();

    // Создание кнопки
    this.createButton();

    // Проверка кнопки на необходимость скрытия
    this.checkButton();

    // Инициализация параметров
    this.params = new URLSearchParams(window.location.search);

    // Выполнение кастомной функции
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          node: this.node,
          button: this.buttonLoadModeNode,
          items: this.node.querySelectorAll(this.config.selectors.items),
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    const tableString = `first${this.config.tableName}`;

    // Сборка строки параметров
    this.params.append(tableString, this.offset.toString());
    if (this.config.modules.get) {
      this.params.append('show', this.config.modules.get.toString());
    } else {
      console.error('Не задан ID модуля для "show"!');
    }
    this.params.append('mime', 'txt');

    // Бинд клика на кнопку, при котором происходит подгрузка новых элементов
    this.buttonLoadModeNode.addEventListener('click', (event) => {
      event.preventDefault();

      // Обновление сдвига в строке параметров
      this.params.set(tableString, this.offset.toString());

      // Блокировка кнопки от повторного нажатия
      this.lockButton();

      // Получение новых элементов
      fetch(`${window.location.pathname}?${this.params.toString()}`)
        .then(response => response.text())
        .then((response) => {
          // Парсинг ответа
          const responseHTML = (new DOMParser()).parseFromString(response, 'text/html');

          // Фставка новых элементов
          responseHTML.querySelectorAll(this.config.selectors.items).forEach((item) => {
            this.node.append(item);
          });

          // Изменение сдвига
          this.offset += this.config.quantity;

          // Разблокировка кнопки
          this.unlockButton();

          // Проверка кнопки на необходимость скрытия
          this.checkButton();

          // Выполнение кастомной функции
          if (typeof this.config.callbacks.loaded === 'function') {
            try {
              this.config.callbacks.loaded({
                node: this.node,
                button: this.buttonLoadModeNode,
                items: this.node.querySelectorAll(this.config.selectors.items),
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
   * Создание кнопки и её вставка в родительский элемент содержащий все элементы, при нажатии на неё будет совершена подгрузка
   */
  createButton() {
    this.buttonLoadModeNode.textContent = this.config.texts.buttonIdle;
    this.buttonLoadModeNode.type = 'button';
    this.buttonLoadModeNode.className = 'btn btn-load_more';

    this.node.after(this.buttonLoadModeNode);
  }

  /**
   * Блокировка кнопки, от повторного нажатия до того как текущий контент был загружен
   */
  lockButton() {
    this.buttonLoadModeNode.setAttribute('disabled', 'disabled');
    this.buttonLoadModeNode.classList.add('faze-disabled');
    this.buttonLoadModeNode.textContent = this.config.texts.buttonLoading;
  }

  /**
   * Возвращение кнопки в нормальное состояние
   */
  unlockButton() {
    this.buttonLoadModeNode.removeAttribute('disabled');
    this.buttonLoadModeNode.classList.remove('faze-disabled');
    this.buttonLoadModeNode.textContent = this.config.texts.buttonIdle;
  }

  /**
   * Обновление значения общего количества элементов
   *
   * @param total - опциональное значение, если не задано, берется значение из атрибута "data-page-total"
   */
  updateTotal(total?: number) {
    this.total = total || parseInt(this.node.getAttribute('data-faze-page-total') || '9999', 10) || 9999;
  }

  /**
   * Сброс количества загруженных элементов
   */
  resetOffset() {
    this.offset = this.config.offset;
  }

  /**
   * Проверка, если загружены все элементы, то скрываем кнопку
   */
  checkButton() {
    if (this.offset >= this.total) {
      this.buttonLoadModeNode.style.display = 'none';
    } else {
      this.buttonLoadModeNode.style.display = 'block';
    }
  }

  /**
   * Изменение параметров загрузки новых элементов, может порадобиться например при фильтрации и последующей бесконечной прокрутке
   *
   * @param params - параметры поисковой строки
   */
  setParams(params: URLSearchParams) {
    this.params = params;
  }
}

export default Page;
