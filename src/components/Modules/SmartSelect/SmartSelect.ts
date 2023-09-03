/**
 * Плагин умного селекта
 *
 * Модуль умного селекта представляет собой инпут, при вводе в который снизу выводятся данные полученные через ajax с сервера.
 * Из них можно выбрать один или несколько значений, которые будут запомнены в инпут.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 10.06.2022
 */

import './SmartSelect.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';

/**
 * Список доступных API для работы
 */
enum API {
  Plarson = 'Plarson',
  DaData = 'DaData',
}

/**
 * Структура кэша
 *
 * Содержит:
 *   query - текст запроса
 *   data - данные от сервера
 */
interface QueryCache {
  query: string;
  data: any[];
}

/**
 * Структура элемента для выбора
 *
 * Содержит:
 *   node - DOM элемент себя
 *   data - данные
 */
interface Item {
  node: HTMLDivElement;
  data: object;
}

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   node - DOM элемент модуля
 *   body - данные
 */
interface CallbackData {
  node: HTMLInputElement;
  data: object;
}

/**
 * Структура конфига умного селекта
 *
 * Содержит:
 *   api - используемое API
 *   url - адрес для запросов к серверу
 *   fixed - закреплена ли выпадающая часть за инпутом
 *   field - искомое поле в ответе для вывода
 *   limit - количество выводимых опций
 *   minLength - минимальная длина для начала поиска
 */
interface Config {
  api: API;
  url: string;
  fixed: boolean;
  field: string;
  limit: number;
  minLength: number;
  class?: string;
  parts?: object;
  callbacks: {
    selected?: (activeTabData: CallbackData) => void;
    entered?: (activeTabData: CallbackData) => void;
    option?: (activeTabData: CallbackData) => void;
  };
}

class SmartSelect extends Module {
  // DOM элемент выпадающего списка селекта
  private itemsNode: HTMLDivElement;

  // DOM элементы опций
  private items: Item[];

  // Кэш запросов
  private cache: QueryCache[];

  // Индекс выбранного элемента
  private currentIndex: number;

  /**
   * Конструктор
   *
   * @param node Главный DOM элемент модуля
   * @param config Настройки модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      api: API.Plarson,
      url: '',
      fixed: false,
      field: 'field',
      limit: 10,
      minLength: 3,
      class: undefined,
      parts: undefined,
      callbacks: {
        selected: undefined,
        entered: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'SmartSelect',
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();

    // Корректировка переданного параметра API
    this.fixAPI();

    this.currentIndex = -1;
    this.items = [];
    this.cache = [];
    (<HTMLInputElement>this.node).autocomplete = 'off';
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.bindCloseOnClickOutside();
    this.handleInput();
    this.bindKeyboardControl();
  }

  /**
   * Закрытие при клике вне области выбора
   *
   * @private
   */
  private bindCloseOnClickOutside(): void {
    document.addEventListener('click', (event) => {
      if (!Faze.Helpers.isMouseOverlapsNodes(event, [this.node, this.itemsNode])) {
        this.close();
      }
    });
  }

  /**
   * Навешивание событий на выбор опции из выпадающего списка
   *
   * @private
   */
  private bindSelectOption(): void {
    this.items.forEach((item: Item) => {
      item.node.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        // Присваиваем выбранное значение
        (<HTMLInputElement>this.node).value = item.node.textContent || '';

        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.selected === 'function') {
          try {
            this.config.callbacks.selected({
              node: this.node,
              data: item.data,
            });
          } catch (error) {
            this.logger.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
          }
        }

        // Закрываем выпадающий список
        this.close();
      });
    });
  }

  /**
   * Навешивание событий на выделение опции из выпадающего списка
   *
   * @private
   */
  private bindEnterOption(): void {
    this.items.forEach((item: Item) => {
      item.node.addEventListener('mouseenter', () => {
        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.entered === 'function') {
          try {
            this.config.callbacks.entered({
              node: this.node,
              data: item.data,
            });
          } catch (error) {
            this.logger.error(`Ошибка исполнения пользовательского метода "entered": ${error}`);
          }
        }
      });
    });
  }

  /**
   * Навешивание событий управления выбором через клавиатуру
   */
  private bindKeyboardControl(): void {
    this.node.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.code === 'Enter') {
        event.preventDefault();
      }
    });

    this.node.addEventListener('keyup', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
          event.preventDefault();

          this.currentIndex--;
          if (this.currentIndex < 0) {
            this.currentIndex = this.items.length - 1;
          }

          this.updateActiveItem();

          break;
        case 'ArrowDown':
          event.preventDefault();

          this.currentIndex++;
          if (this.currentIndex > this.items.length - 1) {
            this.currentIndex = 0;
          }

          this.updateActiveItem();

          break;
        case 'Enter':
          event.preventDefault();

          // Ищем элемент по текущему индексу, если находим то выбираем его
          const foundItem = this.items[this.currentIndex];
          if (foundItem) {
            (<HTMLInputElement>this.node).value = foundItem.node.textContent || '';
            this.close();
          }

          // Вызываем пользовательский метод
          if (typeof this.config.callbacks.selected === 'function') {
            try {
              this.config.callbacks.selected({
                node: this.node,
                data: foundItem.data,
              });
            } catch (error) {
              this.logger.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
            }
          }

          break;
        case 'Escape':
          event.preventDefault();

          this.close();
          break;
      }
    });
  }

  /**
   * Обновление выбранного элемента
   */
  private updateActiveItem(): void {
    this.items.forEach((item, index) => {
      if (index === this.currentIndex) {
        item.node.classList.add('faze-active');

        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.entered === 'function') {
          try {
            this.config.callbacks.entered({
              node: this.node,
              data: item.data,
            });
          } catch (error) {
            this.logger.error(`Ошибка исполнения пользовательского метода "entered": ${error}`);
          }
        }
      } else {
        item.node.classList.remove('faze-active');
      }
    });
  }

  /**
   * Рассчёт позиции, если нужно фиксировать блок с подсказками
   *
   * @private
   */
  private calculateFixed(): void {
    const rect = this.node.getBoundingClientRect();

    this.itemsNode.style.position = 'absolute';
    this.itemsNode.style.top = `${rect.bottom + window.scrollY}px`;
    this.itemsNode.style.left = `${rect.left + window.scrollX}px`;
    this.itemsNode.style.minWidth = `${rect.width}px`;
  }

  /**
   * Отслеживание ввода данных в инпут
   *
   * @private
   */
  private handleInput(): void {
    let inputTimer: number;
    Faze.Helpers.addEventListeners(this.node, ['keyup', 'focus'], (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.code)) {
        return;
      }

      clearTimeout(inputTimer);

      inputTimer = window.setTimeout(async () => {
        if ((<HTMLInputElement>this.node).value.length < this.config.minLength) {
          return;
        }

        // Текст запроса
        const query: string = (<HTMLInputElement>this.node).value;

        // Проверяем есть ли такой запрос в кэше
        const cache: QueryCache | undefined = this.cache.find((c) => c.query === query);

        // Данные
        let data: any[];

        // Если есть, то берём его данные из кэша, если нет, то отправляем на сервер
        if (cache) {
          data = cache.data;
        } else {
          data = await this.request(query);

          // Добавляем новую запись в кэш
          this.cache.push({
            query,
            data,
          });
        }

        // Если есть данные, то выводим их
        if (data.length > 0) {
          this.close();

          this.buildWrapper();
          this.buildItems(data);
          this.bindSelectOption();
          this.bindEnterOption();

          // Пересчитываем позицию
          if (this.config.fixed) {
            this.calculateFixed();
          }

          // Теперь открываем
          this.open();
        }
      }, 500);
    });
  }

  /**
   * Отправка запроса на сервер
   *
   * @param {string} query Текст запроса
   *
   * @private
   */
  private async request(query: string): Promise<object[]> {
    let data: object[];

    switch (this.config.api) {
      case API.DaData:
        data = await this.requestDaData(query);
        break;
      case API.Plarson:
        data = await this.requestPlarson(query);
        break;
      default:
        data = [];
        break;
    }

    return data;
  }

  /**
   *
   * @param {string} query Текст запроса
   */
  private async requestPlarson(query: string): Promise<object[]> {
    const response = await fetch(`${this.config.url}${query}`);
    return response.json();
  }

  /**
   * Получаем данные DaData, они изначально находятся в удобном для нас формате
   *
   * @param {string} query Текст запроса
   *
   * @returns Данные с сервера DaData
   *
   * @private
   */
  private async requestDaData(query: string): Promise<object[]> {
    let body = {
      query,
    };

    if (this.config.parts) {
      body = Object.assign(body, this.config.parts);
    }

    const response = await fetch(`https://suggestions.dadata.ru/suggestions/api/4_1/rs/${this.config.url}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Token 510641ac81338d1f60e41e59c787e6df689d4553',
      },
      body: JSON.stringify(body),
    });

    // Получаем данные
    const data = await response.json();
    if ('suggestions' in data) {
      return data.suggestions;
    }

    return [];
  }

  /**
   * Создание обёртки для элементов
   *
   * @private
   */
  private buildWrapper(): void {
    this.itemsNode = document.createElement('div');
    this.itemsNode.className = `faze-smartsearch-items ${this.config.class || ''}`;

    // Ставим атрибут если он есть на инпуте
    if ('fazeStyles' in this.node.dataset) {
      this.itemsNode.dataset.fazeStyles = '';
    }

    if (this.config.fixed) {
      document.body.appendChild(this.itemsNode);
    } else {
      Faze.DOM.insertAfter(this.itemsNode, this.node);
    }
  }

  /**
   * Очистка элементов
   *
   */
  clearItems(): void {
    // Очищаем все данные
    this.items.forEach((item: Item) => {
      item.node.remove();
    });
    this.items = [];

    // Закрываем выпадающий список
    this.close();
  }

  /**
   * Создание DOM элементов опций для выбора
   *
   * @param items{any[]} Опции в JSON формате
   *
   * @private
   */
  private buildItems(data: any[]): void {
    data.slice(0, this.config.limit).forEach((row: any) => {
      let value = Faze.Helpers.resolvePath(row, this.config.field);

      // Если задана пользовательская функция смены текста в <option> то выполняем её
      if (typeof this.config.callbacks.option === 'function') {
        value = this.config.callbacks.option(row);
      } else if (!value) {
        return;
      }

      // Собираем элемент
      const itemNode = document.createElement('div');
      itemNode.className = 'faze-smartsearch-item';
      itemNode.innerHTML = value;
      this.items.push({
        node: itemNode,
        data: row,
      });

      this.itemsNode.appendChild(itemNode);
    });
  }

  /**
   * Открытие выпадающего списка вариантов
   */
  public open(): void {
    this.itemsNode.classList.add('faze-active');
  }

  /**
   * Закрытие выпадающего списка вариантов
   */
  public close(): void {
    if (this.itemsNode) {
      this.itemsNode.remove();
    }

    // Сбрасываем индекс выбранного элемента
    this.currentIndex = -1;
    this.items = [];
  }

  /**
   * Заменяем значение ссылки
   *
   * @param url{string} Значение которое меняем
   */
  public setUrl(url: string): void {
    // Сбрасываем кеш
    this.cache = [];

    this.config.url = url;
  }

  /**
   * Заменяем значение параметров
   *
   * @param parts{object} Значение которое меняем
   */
  public setParts(parts: object): void {
    // Сбрасываем кеш
    this.cache = [];

    this.config.parts = parts;
  }

  /**
   * Очищаем кеш
   */
  public clearCache(): void {
    this.cache = [];
  }

  /**
   * Корректировка переданного параметра API
   */
  private fixAPI(): void {
    switch (this.config.api.toLowerCase()) {
      case 'dadata':
        this.config.api = API.DaData;
        break;
      default:
        this.config.api = API.Plarson;
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    // Получаем API
    let api = API.Plarson;
    switch (node.dataset.fazeSmartselectApi?.toLowerCase()) {
      case 'dadata':
        api = API.DaData;
        break;
      default:
        api = API.Plarson;
    }

    // Получаем доп. параметры
    let parts: object | undefined;
    if (node.dataset.fazeSmartselectParts) {
      parts = Faze.Helpers.parseJSON(node.dataset.fazeSmartselectParts);
    }

    new SmartSelect(node, {
      api,
      parts,
      url: node.dataset.fazeSmartselectUrl || '',
      field: node.dataset.fazeSmartselectField || 'field',
      fixed: (node.dataset.fazeSmartselectFixed || 'false') === 'true',
      class: node.dataset.fazeSmartselectClass,
      limit: parseInt(node.dataset.fazeSmartselectLimit || '10', 10),
      minLength: parseInt(node.dataset.fazeSmartselectMinLength || '3', 10),
    });
  }
}

export default SmartSelect;
