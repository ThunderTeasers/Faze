import './Filter.scss';
import Faze from '../../Core/Faze';
import Logger from '../../Core/Logger';

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
 *   changeButton - нужно ли изменять кнопку(блокировать, писать "Обработка" и т.д.)
 *   updateQuery - нужно ли обновлять URL через HTML5 history, либо делать это скрыто
 *   submitAfterChange - обновляется ли сразу после изменения любого инпута
 *   needToRequest - нужно ли делать запрос к серверу
 *   resetPagination - нужно ли сбрасывать пагинацию при фильтрации
 *   modules
 *     get      - модуль show в plarson
 *   cookie
 *     params     - массив названий параметров для хранения в cookie
 *     delimiter  - разделитель значений параметров если их множество
 *     encode     - нужно ли кодировать значение в cookie(может пригодиться если используем например разделитель ';')
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
  changeButton: boolean;
  usePathnameFromQuery: boolean;
  useAPI: boolean;
  resetPagination: boolean;
  updateQuery: boolean;
  needToRequest: boolean;
  submitAfterChange: boolean;
  modules: {
    get?: number;
  };
  cookie: {
    delimiter: string;
    params: string[];
    encode: boolean;
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

  // Помощник для логирования
  readonly logger: Logger;

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

  // Заранее заданная поисковая строка(кейс для сокращенных ссылок)
  readonly presetQuery?: string;

  // Чистый URL, без данных фильтра, используется только с "useAPI"
  readonly cleanPath?: string;

  // Флаг отключающий работу по заданной строке поиска
  disablePresetQuery: boolean;

  // Параметры фильтра, должны совпадать с параметрами в поисковой строке
  params: URLSearchParams;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект фильтра');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Filter:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-filter-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      tableName: undefined,
      showTotal: true,
      changeButton: true,
      usePathnameFromQuery: true,
      updateQuery: true,
      useAPI: false,
      submitAfterChange: false,
      needToRequest: true,
      resetPagination: true,
      modules: {
        get: undefined,
      },
      cookie: {
        delimiter: '|',
        params: [],
        encode: true,
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
    this.disablePresetQuery = this.node.dataset.fazeFilterQueryDisable !== undefined;
    this.presetQuery = this.node.dataset.fazeFilterQuery;
    this.cleanPath = this.node.dataset.fazeFilterCleanPath;

    if (this.config.showTotal && this.formNode) {
      this.totalNode = this.node.querySelector(this.config.selectors.total);
    }

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.node.classList.add('faze-filter-initialized');

    // Инициализация конфига
    this.initializeConfig();

    // Обновляем хранимые параметры
    this.updateSearchParams();

    // Простановка общего числа элементов
    if (this.config.showTotal && this.totalNode) {
      this.totalNode.textContent = this.node.dataset.fazeFilterTotal || '';
    }

    // Посстанавливаем значения из cookie
    this.restoreStoredParams();

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
          total: parseInt(this.node.dataset.fazeFilterTotal || '0', 10),
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции "created"', error);
      }
    }
  }

  /**
   * Инициализация значений конфига или их переопределение
   */
  initializeConfig(): void {
    // Настройка хранимых параметров
    if (this.node.dataset.fazeFilterStored) {
      this.config.cookie.params = this.node.dataset.fazeFilterStored.split(',') || this.config.cookie.params;
    }
    if (this.node.dataset.fazeFilterStoredEncode) {
      this.config.cookie.encode = this.node.dataset.fazeFilterStoredEncode.toLowerCase() === 'true' || this.config.cookie.encode;
    }
    this.config.cookie.delimiter = this.node.dataset.fazeFilterStoredDelimiter || this.config.cookie.delimiter;
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (this.formNode) {
      this.formNode.addEventListener('submit', (event: Event) => {
        event.preventDefault();

        // Блокировка кнопки для предотвращения повторного нажатия во время отправки запроса
        this.lockButton();

        // Составление запроса для фильтрации
        const formData: FormData = new FormData(<HTMLFormElement>this.formNode);

        // Собираем вручную строку запроса из FormData т.к. Edge и другие отсталые браузеры, даже имея официалиьную поддержку
        // URLSearchParams не имеют возможности создать её через передачу параметра FormData в конструкторе.
        const formDataQuery: string = [...formData.entries()].map((entry) => `${encodeURIComponent(<any>entry[0])}=${encodeURIComponent(<any>entry[1])}`).join('&');

        // Парсим данные формы
        const formDataURLString: URLSearchParams = new URLSearchParams(formDataQuery);

        // Если есть заданное значение строки, то нужно взять базу оттуда, иначе запрос будет отдавать 404
        let basePath: string = '';
        if (this.presetQuery && !this.disablePresetQuery && (this.node.dataset.fazeFilterUsePathname || 'true') === 'true') {
          basePath = this.presetQuery.split('?')[0];
        }

        // URL для вставки в строку поиска в браузере(HTML5 history)
        const urlForHistory: string = `${basePath}?${formDataURLString.toString()}`;
        formDataURLString.append('mime', 'txt');

        const module = this.config.modules.get || this.node.dataset.fazeFilterModuleGet;
        if (module) {
          formDataURLString.append('show', module.toString());
        }

        // Если включено API то базовый путь всегда должен начинатся с чистого пути
        if (this.config.useAPI && this.cleanPath) {
          basePath = this.cleanPath;
        }

        // Если не нужна пагинация
        if (this.config.resetPagination) {
          if (basePath === '') {
            basePath = window.location.pathname.replace(/offset=\d+\//gi, '');
          } else {
            basePath = basePath.replace(/offset=\d+\//gi, '');
          }
        }

        // URL для запроса к серверу
        const urlForRequest: string = `${basePath}?${formDataURLString.toString()}`;

        // Отправка запрос на сервер, если это нужно
        if (this.config.needToRequest) {
          fetch(urlForRequest, { credentials: 'same-origin' })
            .then((response: Response) => response.text())
            .then((response: string) => {
              // Парсинг ответа от сервера
              const responseHTML: Document = new DOMParser().parseFromString(response, 'text/html');

              // Ищем в ответе от сервера DOM элемент с такими же классами как у элемента фильтра
              const responseNode: HTMLElement | null = responseHTML.querySelector(
                `.${Array.from(this.node.classList)
                  .filter((className) => className !== 'faze-filter-initialized')
                  .join('.')}`
              );
              if (responseNode) {
                if (this.itemsHolderNode) {
                  // Проверка, если отфильтрованных элементов больше 0, тогда происходит их вывод
                  // иначе сообщение об отсутствии элементов по данному запросу
                  const itemsHolderNode: HTMLElement | null = responseNode.querySelector(this.config.selectors.itemsHolder);
                  if (itemsHolderNode) {
                    this.itemsHolderNode.innerHTML = itemsHolderNode.innerHTML;
                  } else {
                    this.itemsHolderNode.innerHTML = '<p class="error">К сожалению, ничего не найдено...</p>';
                  }
                }

                // Обновление количества элементов
                const total: string = responseNode.dataset.fazeFilterTotal || '0';
                if (this.config.showTotal && this.totalNode) {
                  this.totalNode.textContent = total;
                }
                this.node.dataset.fazeFilterTotal = total;
              }

              // Если используем API то получаем ссылку из Plarson
              if (this.config.useAPI) {
                this.getURL(urlForHistory, this.cleanPath).then((data) => {
                  // Обновление строки в браузере
                  if (this.config.updateQuery) {
                    window.history.pushState({}, '', data.url);
                  }

                  // Действия выполняемые после фильтрации
                  this.afterFilterActions(response, responseHTML, data.query);
                });
              } else {
                // Обновление строки в браузере
                if (this.config.updateQuery) {
                  window.history.pushState({}, '', urlForHistory);
                }

                // Действия выполняемые после фильтрации
                this.afterFilterActions(response, responseHTML);
              }
            });
        } else {
          // Действия выполняемые после фильтрации
          this.afterFilterActions(undefined, undefined, urlForRequest);
        }
      });
    }

    // Навешивание событий на сабмит фильтра при изменении инпутов
    if (this.config.submitAfterChange) {
      this.bindSubmitAfterChange();
    }
  }

  /**
   * Навешивание событий на сабмит фильтра при изменении инпутов
   *
   * @private
   */
  private bindSubmitAfterChange(): void {
    this.formNode?.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])').forEach((inputNode: HTMLInputElement) => {
      if (['checkbox', 'radio'].includes(inputNode.type)) {
        inputNode.addEventListener('change', () => {
          this.updateFilter();
        });
      }
    });
  }

  /**
   * Получение ссылки для вставки в историю браузера
   *
   * @param queryForHistory - параметры фильтра
   * @param pathname        - базовый pathname
   */
  async getURL(queryForHistory: string, pathname: string = window.location.pathname): Promise<{ url: string; query: string }> {
    const params = new URLSearchParams(queryForHistory);
    params.append('mime', 'api');
    params.append('api', 'get_uri_scheme');

    // Если не нужна пагинация
    if (this.config.resetPagination) {
      pathname = pathname.replace(/offset=\d+\//gi, '');
    }

    const response = await fetch(`${pathname}?${params.toString()}`, { credentials: 'same-origin' });
    const data = await response.json();

    return { url: data.scheme_uri_path_query, query: data.query_string };
  }

  /**
   * Исполнение пользовательской функции
   *
   * @param response     - текст ответа
   * @param responseHTML - сконвертированная в HTML версия ответа
   * @param query        - параметры запроса
   */
  afterFilterActions(response?: string, responseHTML?: Document, query?: string) {
    // По заданной строке поиска поработали, теперь отключаем её
    this.disablePresetQuery = true;

    // Замена заголовка
    if (responseHTML) {
      this.changeHeading(responseHTML);
    }

    // Обновляем хранимые параметры
    this.updateSearchParams(query);

    // Сохраняем указанные значения в cookie
    this.saveStoredParams();

    // Разблокировка кнопки
    this.unlockButton();

    if (typeof this.config.callbacks.filtered === 'function') {
      try {
        this.config.callbacks.filtered({
          response,
          responseHTML,
          filterNode: this.node,
          formNode: this.formNode,
          itemsHolderNode: this.itemsHolderNode,
          params: this.params,
          total: parseInt(this.node.dataset.fazeFilterTotal || '0', 10),
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  /**
   * Замена заголовка после фильтрации
   *
   * @param responseHTML - сконвертированная в HTML версия ответа
   */
  changeHeading(responseHTML: Document): void {
    // DOM элемент текущего заголовка
    const currentHeadingNode: HTMLElement | null = this.node.querySelector('.faze-filter-heading');

    // DOM элемент нового заголовка
    const newHeadingNode: HTMLElement | null = responseHTML.querySelector('.faze-filter-heading');

    // Если оба заголовка присутствуют
    if (currentHeadingNode && newHeadingNode) {
      // Заменяем контент у текущего
      currentHeadingNode.innerHTML = newHeadingNode.innerHTML;
    }
  }

  /**
   * Нахождение DOM элемента для восстановление и передача его в колбек для кастомизации восстановления его значения
   *
   * @param type - тип инпута
   * @param callback - найденный DOM элемент
   */
  restoreFilteredInput(type: string, callback: (foundNode: HTMLInputElement, foundValue?: string) => void): void {
    if (this.formNode) {
      const inputFields = ['text', 'number', 'date', 'phone', 'email', 'datetime', 'textarea'];

      this.formNode.querySelectorAll<HTMLInputElement>(`input[type="${type}"], select`).forEach((foundNode: HTMLInputElement) => {
        const foundNodeName = foundNode.name;
        const foundNodeValue = foundNode.value;

        const values: string[] = this.params.getAll(foundNodeName);
        if (values.includes(foundNodeValue)) {
          if (typeof callback === 'function') {
            callback(foundNode);
          }
        } else if (inputFields.includes(type) && values.length > 0) {
          if (typeof callback === 'function') {
            callback(foundNode, values[0]);
          }
        }
      });
    }
  }

  /**
   * Восстановление текстовых значений после перезагрузки страницы
   *
   * @private
   */
  private restoreFilteredTextFields(): void {
    this.restoreFilteredInput('text', (textNode: HTMLInputElement, value?: string) => {
      textNode.value = value || textNode.value || '';
    });
  }

  /**
   * Восстановление текстовых значений после перезагрузки страницы
   *
   * @private
   */
  private restoreFilteredNumberFields(): void {
    this.restoreFilteredInput('number', (textNode: HTMLInputElement, value?: string) => {
      textNode.value = value || textNode.value || '';
    });
  }

  /**
   * Восстановление значений выбранных чекбоксов после перезагрузки страницы
   *
   * @private
   */
  private restoreFilteredCheckboxes(): void {
    this.restoreFilteredInput('checkbox', (checkboxNode: HTMLInputElement) => {
      checkboxNode.checked = true;
    });
  }

  /**
   * Восстановление значений выбранных радио кнопок после перезагрузки страницы
   *
   * @private
   */
  private restoreFilteredRadioButtons(): void {
    this.restoreFilteredInput('radio', (radioNode: HTMLInputElement) => {
      radioNode.checked = true;
    });
  }

  /**
   * Сохранение указанных параметров в cookie
   */
  saveStoredParams(): void {
    // Сначала удаляем все неиспользованные
    this.cleanStoredParams();

    // Далее добавляем/перезаписываем нужные
    this.config.cookie.params.forEach((storedParamName) => {
      let paramsValues: string[] = this.params.getAll(storedParamName);

      // Если необходимо кодировать значения, делаем это
      if (this.config.cookie.encode) {
        paramsValues = paramsValues.map((paramValue: string) => encodeURIComponent(paramValue));
      }

      // Составляем итоговое значение cookie
      const cookieValue: string = paramsValues.join(this.config.cookie.delimiter);
      if (cookieValue) {
        Faze.Helpers.setCookie(storedParamName, cookieValue);
      }
    });
  }

  /**
   * Восстановление хранимых в cookie параметров
   */
  restoreStoredParams(): void {
    this.config.cookie.params.forEach((storedParamName) => {
      const cookieValue: string = Faze.Helpers.getCookie(storedParamName);

      // Если такой параметр уже есть, то пропускаем его
      if (this.params.getAll(storedParamName).length > 0) {
        return;
      }

      if (cookieValue) {
        // Если в значении присутствует разделитель, то это сборная строка из чекбоксов, её надо разобрать
        if (cookieValue.includes(this.config.cookie.delimiter)) {
          cookieValue.split(this.config.cookie.delimiter).forEach((paramValue: string) => {
            this.params.append(storedParamName, decodeURIComponent(paramValue));
          });
        } else {
          // Иначе просто задаем нужное значение
          this.params.append(storedParamName, decodeURIComponent(cookieValue));
        }
      }
    });
  }

  /**
   * Удаление неиспользованных в текущей итерации фильтрации параметров
   */
  cleanStoredParams(): void {
    this.config.cookie.params.forEach((storedParamName) => {
      Faze.Helpers.setCookie(storedParamName, '', -1);
    });
  }

  /**
   * Восстановление значений выбранных инпутов после перезагрузки страницы
   */
  restoreFilteredInputs(): void {
    this.restoreFilteredTextFields();
    this.restoreFilteredNumberFields();
    this.restoreFilteredCheckboxes();
    this.restoreFilteredRadioButtons();
  }

  /**
   * Обновление внутненних параметров поиска, для того чтобы они совпадали с теми, что содержатся в поисковой строке
   */
  updateSearchParams(query?: string): void {
    let queryParams: string | undefined;
    if (this.node.dataset.fazeFilterQuery && !this.disablePresetQuery) {
      queryParams = this.node.dataset.fazeFilterQuery.split('?')[1];
    }

    this.params = new URLSearchParams(query || queryParams || window.location.search);
  }

  /**
   * Блокирует кнопку от нажатия, так же запоминает оригинальный тест
   */
  lockButton(): void {
    if (this.buttonSubmitNode && this.config.changeButton) {
      this.buttonSubmitNode.setAttribute('disabled', 'disabled');
      this.buttonSubmitNode.setAttribute('data-faze-initial-text', this.buttonSubmitNode.textContent || '');
      this.buttonSubmitNode.classList.add('faze-disabled');
      this.buttonSubmitNode.textContent = this.config.texts.buttonLoading;
    }
  }

  /**
   * Разблокирует кнопку, ставя ей обратно текст который был на ней изначально, до блокировки
   */
  unlockButton(): void {
    if (this.buttonSubmitNode && this.config.changeButton) {
      this.buttonSubmitNode.removeAttribute('disabled');
      this.buttonSubmitNode.classList.remove('faze-disabled');
      this.buttonSubmitNode.textContent = this.buttonSubmitNode.dataset.fazeInitialText || 'Готово!';
    }
  }

  /**
   * Обновление фильтра(эмуляция события сабмит)
   */
  updateFilter(): void {
    if (this.formNode) {
      this.formNode.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param filterNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(filterNode: HTMLElement): void {
    new Faze.Filter(filterNode, {
      tableName: filterNode.dataset.fazeFilterTableName,
      showTotal: filterNode.dataset.fazeFilterShowTotal === 'true',
      changeButton: filterNode.dataset.fazeFilterChangeButton === 'true',
      usePathnameFromQuery: filterNode.dataset.fazeFilterUsePathnameFromQuery === 'true',
      updateQuery: filterNode.dataset.fazeFilterUpdateQuery === 'true',
      submitAfterChange: (filterNode.dataset.fazeFilterSubmitAfterChange || 'false') === 'true',
      needToRequest: (filterNode.dataset.fazeFilterNeedToRequest || 'false') === 'true',
      resetPagination: (filterNode.dataset.fazeFilterResetPagination || 'true') === 'true',
      modules: {
        get: filterNode.dataset.fazeFilterModulesGet,
      },
      selectors: {
        form: filterNode.dataset.fazeFilterSelectorsForm || '.faze-filter-form',
        itemsHolder: filterNode.dataset.fazeFilterSelectorsItemsHolder || '.faze-filter-items',
        total: filterNode.dataset.fazeFilterSelectorsTotal || '.faze-filter-total',
      },
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="filter"]', (filterNode: HTMLElement) => {
      Filter.initializeByDataAttributes(filterNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="filter"]').forEach((filterNode: HTMLElement) => {
      Filter.initializeByDataAttributes(filterNode);
    });
  }
}

export default Filter;
