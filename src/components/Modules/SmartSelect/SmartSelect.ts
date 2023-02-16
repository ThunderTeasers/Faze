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
  Plarson,
  DaData,
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
 * Структура конфига умного селекта
 *
 * Содержит:
 *   url - адрес для запросов к серверу
 *   tableName - имя таблицы в Plarson
 */
interface Config {
  api: API;
  url: string;
  fixed: boolean;
  minLength: number;
  headers?: object;
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
      minLength: 3,
      headers: undefined,
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

        // Закрываем выпадающий список
        this.close();
      });
    });
  }

  /**
   * Навешивание событий управления выбором через клавиатуру
   */
  private bindKeyboardControl(): void {
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

          break;
      }
    });
  }

  /**
   * Обновление выбранного элемента
   */
  private updateActiveItem(): void {
    this.items.forEach((item, index) => {
      item.node.classList.toggle('faze-active', index === this.currentIndex);
    });
  }

  /**
   * Рассчёт позиции, если нужно фиксировать блок с подсказками
   *
   * @private
   */
  private calculateFixed(): void {
    const rect = this.node.getBoundingClientRect();

    this.itemsNode.style.position = 'fixed';
    this.itemsNode.style.top = `${rect.top + rect.height}px`;
    this.itemsNode.style.left = `${rect.left}px`;
    this.itemsNode.style.width = `${rect.width}px`;
  }

  /**
   * Отслеживание ввода данных в инпут
   *
   * @private
   */
  private handleInput(): void {
    let inputTimer: number;
    Faze.Helpers.addEventListeners(this.node, ['keyup', 'focus'], (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.code)) {
        return;
      }

      console.log(123);

      clearTimeout(inputTimer);

      inputTimer = window.setTimeout(async () => {
        if ((<HTMLInputElement>this.node).value.length < this.config.minLength) {
          this.clearItems();
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

        this.clearItems();
        this.buildItems(data);
        this.bindSelectOption();
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
      default:
        data = [];
        break;
    }

    return data;
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
    const request = await fetch(`https://suggestions.dadata.ru/suggestions/api/4_1/rs/${this.config.url}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Token 510641ac81338d1f60e41e59c787e6df689d4553',
      },
      body: JSON.stringify({
        query,
      }),
    });

    // Получаем данные
    const data = await request.json();
    if ('suggestions' in data) {
      return data.suggestions;
    }

    return [];
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void {
    this.buildWrapper();

    if (this.config.fixed) {
      this.calculateFixed();
    }
  }

  /**
   * Создание обёртки для элементов
   *
   * @private
   */
  private buildWrapper(): void {
    this.itemsNode = document.createElement('div');
    this.itemsNode.className = 'faze-smartsearch-items';

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
   * @private
   */
  private clearItems(): void {
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
    let canOpen = false;

    // Временно ставим, что у всех API поле "value", т.к. сейчас только одно DaData
    let field = 'value';

    data.forEach((row: any) => {
      // Не добавляем элемент если он такой же, как и введенное значение или нет такого поля в ответе
      if (!(field in row) || (<HTMLInputElement>this.node).value === row.value) {
        return;
      }

      const itemNode = document.createElement('div');
      itemNode.className = 'faze-smartsearch-item';
      itemNode.textContent = row[field];
      this.items.push({
        node: itemNode,
        data: row,
      });

      this.itemsNode.appendChild(itemNode);

      // Ставим на открытие, если добавили хоть один элемент
      canOpen = true;
    });

    // Открытие выпадающего списка, если есть варианты
    if (canOpen) {
      this.open();
    }
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
    this.itemsNode.classList.remove('faze-active');
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    // Получаем API
    let api = API.Plarson;
    switch (node.dataset.fazeSmartselectApi) {
      case 'DaData':
        api = API.DaData;
        break;
      default:
        api = API.Plarson;
    }

    new SmartSelect(node, {
      api,
      url: node.dataset.fazeSmartselectUrl || '',
      fixed: (node.dataset.fazeSmartselectFixed || 'false') === 'true',
      minLength: parseInt(node.dataset.fazeSmartselectMinLength || '3', 10),
    });
  }
}

export default SmartSelect;
