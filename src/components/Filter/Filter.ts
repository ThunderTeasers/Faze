import './Filter.scss';

/**
 * Структура возвращаемого объекта в пользовательских функциях
 *
 * Содержит:
 *   filterNode - DOM элемент всего фильтра
 *   formNode   - DOM элемент формы фильтра
 *   itemsHolderNode - DOM элемент родителя содержащего элементы которые фильтруются
 *   params     - текущие параметры фильтра
 *   total      - общее количество отфильтрованных элементов
 *   response   - ответ от сервера в тексте
 *   responseHTML - ответ от сервера в формате HTML документа
 */
interface CallbackData {
  filterNode: HTMLElement;
  formNode: HTMLFormElement | null;
  itemsHolderNode: HTMLElement | null;
  params: URLSearchParams;
  total: number;
  response?: string;
  responseHTML?: Document;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   tableName  - префикс таблицы в plarson
 *   showTotal  - показывать и обновлять общее количество отфильтрованных элементов
 *   modules
 *     get      - модуль show в plarson
 *   selectors
 *     form         - CSS селектор формы фильтра
 *     itemsHolder  - CSS селектор родителя содержащего элементы которые фильтруются
 *     total        - CSS селектор ноды где отображается общее количество отфильтрованых элементов
 *   texts
 *     buttonLoading - текст кнопки при фильтрации
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся после инициализации фильтра
 *     filtered - пользовательская функция, исполняющаяся после фильтрации
 */
interface Config {
  tableName?: string;
  showTotal: boolean;
  modules: {
    get?: number;
  };
  selectors: {
    form: string;
    itemsHolder: string;
    total: string;
  };
  texts: {
    buttonLoading: string;
  };
  callbacks: {
    created?: (data: CallbackData) => void;
    filtered?: (data: CallbackData) => void;
  };
}

/**
 * Класс фильтра
 */
class Filter {
  // DOM элемент фильтра
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент кнопки сабмита формы фильтра
  readonly buttonSubmitNode: HTMLElement | null;

  // DOM элемент формы фильтра
  readonly formNode: HTMLFormElement | null;

  // DOM элемент родителя элементов фильтрации
  readonly itemsHolderNode: HTMLElement | null;

  // DOM элемент содержащий текст об общем количестве отфильтрованных элементов
  readonly totalNode: HTMLElement | null;

  // Параметры фильтра, должны совпадать с параметрами в поисковой строке
  params: URLSearchParams;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект фильтра');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      tableName: undefined,
      showTotal: true,
      modules: {
        get: undefined,
      },
      selectors: {
        form: '.faze-filter-form',
        itemsHolder: '.faze-filter-items',
        total: '.faze-filter-total',
      },
      texts: {
        buttonLoading: 'Обработка...',
      },
      callbacks: {
        created: undefined,
        filtered: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Проверка на ошибки
    if (!this.config.tableName) {
      throw new Error('Не задан префикс таблицы для фильтрации');
    }

    // Инициализация переменных
    this.buttonSubmitNode = this.node.querySelector(`${this.config.selectors.form} [type="submit"]`);
    this.formNode = document.querySelector(this.config.selectors.form);
    this.itemsHolderNode = document.querySelector(this.config.selectors.itemsHolder);

    if (this.config.showTotal && this.formNode) {
      this.totalNode = this.formNode.querySelector(this.config.selectors.total);
    }

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Обновляем хранимые параметры
    this.updateSearchParams();

    // Простановка общего числа элементов
    if (this.config.showTotal && this.totalNode) {
      this.totalNode.textContent = this.node.getAttribute('data-faze-filter-total');
    }

    // Восстанавливаем заданые значения
    this.restoreFilteredInputs();

    // Выполняем пользовательскую фукнции
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          filterNode: this.node,
          formNode: this.formNode,
          itemsHolderNode: this.itemsHolderNode,
          params: this.params,
          total: parseInt(this.node.getAttribute('data-faze-filter-total') || '0', 10),
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции "created"', error);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (this.formNode) {
      this.formNode.addEventListener('submit', (event) => {
        event.preventDefault();

        // Блокировка кнопки для предотвращения повторного нажатия во время отправки запроса
        this.lockButton();

        // Составление запроса для фильтрации
        const formData = new FormData(<HTMLFormElement>this.formNode);
        const formDataURLString = new URLSearchParams(<any>formData);

        // URL для вставки в строку поиска в браузере(HTML5 history)
        const urlForHistory = `?${formDataURLString.toString()}`;
        formDataURLString.append('mime', 'txt');
        if (this.config.modules.get) {
          formDataURLString.append('show', this.config.modules.get.toString());
        }

        // URL для запроса к серверу
        const urlForRequest = `?${formDataURLString.toString()}`;

        // Отправка запрос на сервер
        fetch(urlForRequest)
          .then(response => response.text())
          .then((response) => {
            // Парсинг ответа от сервера
            const responseHTML = (new DOMParser()).parseFromString(response, 'text/html');

            const responseNode = responseHTML.querySelector(`.${this.node.className.replace(' ', '.')}`);
            if (responseNode) {
              if (this.itemsHolderNode) {
                // Проверка, если отфильтрованных элементов больше 0, тогда происходит их вывод
                // иначе сообщение об отсутствии элементов по данному запросу
                const itemsHolderNode = responseNode.querySelector(this.config.selectors.itemsHolder);
                if (itemsHolderNode) {
                  this.itemsHolderNode.innerHTML = itemsHolderNode.innerHTML;
                } else {
                  this.itemsHolderNode.innerHTML = '<p class="error">К сожалению, ничего не найдено...</p>';
                }
              }

              // Обновление количества элементов
              const total = responseNode.getAttribute('data-faze-filter-total') || '0';
              if (this.config.showTotal && this.totalNode) {
                this.totalNode.textContent = total;
              }
              this.node.setAttribute('data-faze-filter-total', total);
            }

            // Обновление строки в браузере
            window.history.pushState({}, '', urlForHistory);

            // Обновляем хранимые параметры
            this.updateSearchParams();

            // Выполняем пользовательскую функцию
            if (typeof this.config.callbacks.filtered === 'function') {
              try {
                this.config.callbacks.filtered({
                  response,
                  responseHTML,
                  filterNode: this.node,
                  formNode: this.formNode,
                  itemsHolderNode: this.itemsHolderNode,
                  params: this.params,
                  total: parseInt(this.node.getAttribute('data-faze-filter-total') || '0', 10),
                });
              } catch (e) {
                console.error(e);
              }
            }

            // Разблокировка кнопки
            this.unlockButton();
          });
      });
    }
  }

  /**
   * Восстановление значений выбранных инпутов после перезагрузки страницы
   */
  restoreFilteredInputs() {
    // Для чекбоксов
    this.restoreFilteredCheckboxes();
  }

  /**
   * Восстановление значений выбранных чекбоксов после перезагрузки страницы
   */
  restoreFilteredCheckboxes() {
    if (this.formNode) {
      this.formNode.querySelectorAll('input[type="checkbox"]').forEach((checkboxNode: any) => {
        const checkboxName = checkboxNode.name;
        const checkboxValue = checkboxNode.value;

        const values = this.params.getAll(checkboxName);
        if (values.includes(checkboxValue)) {
          checkboxNode.checked = true;
        }
      });
    }
  }

  /**
   * Обновление внутненних параметров поиска, для того чтобы они совпадали с теми, что содержатся в поисковой строке
   */
  updateSearchParams() {
    this.params = new URLSearchParams(window.location.search);
  }

  /**
   * Блокирует кнопку от нажатия, так же запоминает оригинальный тест
   */
  lockButton() {
    if (this.buttonSubmitNode) {
      this.buttonSubmitNode.setAttribute('disabled', 'disabled');
      this.buttonSubmitNode.setAttribute('data-faze-initial-text', this.buttonSubmitNode.textContent || '');
      this.buttonSubmitNode.classList.add('faze-disabled');
      this.buttonSubmitNode.textContent = this.config.texts.buttonLoading;
    }
  }

  /**
   * Разблокирует кнопку, ставя ей обратно текст который был на ней изначально, до блокировки
   */
  unlockButton() {
    if (this.buttonSubmitNode) {
      this.buttonSubmitNode.removeAttribute('disabled');
      this.buttonSubmitNode.classList.remove('faze-disabled');
      this.buttonSubmitNode.textContent = this.buttonSubmitNode.getAttribute('data-faze-initial-text') || 'Готово!';
    }
  }
}

export default Filter;
