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
 * Структура конфига умного селекта
 *
 * Содержит:
 *   url - адрес для запросов к серверу
 *   tableName - имя таблицы в Plarson
 */
interface Config {
  url?: string;
  tableName?: string;
}

class SmartSelect extends Module {
  // DOM элемент выпадающего списка селекта
  private itemsNode: HTMLDivElement;

  // DOM элементы опций
  private itemsNodes: HTMLDivElement[];

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      url: undefined,
      tableName: undefined,
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

    this.itemsNodes = [];
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.handleInput();
  }

  /**
   * Навешивание событий на выбор опции из выпадающего списка
   *
   * @private
   */
  private bindSelectOption(): void {
    this.itemsNodes.forEach((itemNode: HTMLDivElement) => {
      itemNode.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        // Присваиваем выбранное значение
        (<HTMLInputElement>this.node).value = itemNode.textContent || '';

        // Закрываем выпадающий список
        this.close();
      });
    });
  }

  /**
   * Отслеживание ввода данных в инпут
   *
   * @private
   */
  private handleInput(): void {
    let inputTimer: number;
    this.node.addEventListener('keyup', () => {
      clearTimeout(inputTimer);

      inputTimer = window.setTimeout(() => {
        this.request()
          .then((rawItems: string) => {
            let items: any[] = [];
            try {
              items = JSON.parse(rawItems);
            } catch {
              this.logger.error('Ошибка парсинга JSON!');
            }

            this.clearItems();
            this.buildItems(items);
            this.bindSelectOption();
          });
      }, 500);
    });
  }

  /**
   * Отправка запроса на сервер
   *
   * @private
   */
  private async request(): Promise<string> {
    const request = await fetch(Faze.URL.addParamToURL(`${this.config.tableName}_chr_name`, (<HTMLInputElement>this.node).value, this.config.url));
    return request.text();
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void {
    this.buildWrapper();
  }

  /**
   * Создание обёртки для элементов
   *
   * @private
   */
  private buildWrapper(): void {
    this.itemsNode = document.createElement('div');
    this.itemsNode.className = 'faze-smartsearch-items';
    Faze.DOM.insertAfter(this.itemsNode, this.node);
  }

  /**
   * Очистка элементов
   *
   * @private
   */
  private clearItems(): void {
    // Очищаем все данные
    this.itemsNodes.forEach((itemNode: HTMLDivElement) => {
      itemNode.remove();
    });
    this.itemsNodes = [];

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
  private buildItems(items: any[]): void {
    items.forEach((item: any) => {
      const itemNode = document.createElement('div');
      itemNode.className = 'faze-smartsearch-item';
      itemNode.textContent = item[`${this.config.tableName}_chr_name`];
      this.itemsNodes.push(itemNode);

      this.itemsNode.appendChild(itemNode);
    });

    // Открытие выпадающего списка, если есть варианты
    if (items.length > 0) {
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
    new SmartSelect(node, {
      url: node.dataset.fazeSmartselectUrl,
      tableName: node.dataset.fazeSmartselectTableName,
    });
  }
}

export default SmartSelect;
