/**
 * Плагин поиска любых вещей в листинге
 *
 * Автор: Ерохин Максим
 * Дата: 29.11.2024
 */

import './Finder.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   node - DOM элемент где происходит работа модуля
 *   inputNode - DOM элемент холдера элементов
 *   itemsNode - DOM элементы элементов
 *   itemsNodes - DOM элемент инпута поиска
 */
interface CallbackData {
  node: HTMLElement;
  inputNode: HTMLInputElement;
  itemsNode: HTMLElement;
  itemsNodes: HTMLElement[];
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   changeOnHover - изменять ли цвет при наведении(по умолчанию смена идёт при клике)
 *   perRow - количество цветов в строке
 *   direction - направление строк(колонок)
 *   showIfOne - показывать если один цвет
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  hideMode: 'display' | 'visibility';
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс
 */
class Finder extends Module {
  // DOM элемент инпута
  inputNode: HTMLInputElement | null;

  // DOM элемент элементов
  itemsNode: HTMLElement | null;

  // DOM элементы элементов
  itemsNodes?: NodeListOf<HTMLElement>;

  /**
   * Стандартный конструктор
   *
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Config} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      hideMode: 'display',
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Finder',
    });
  }

  /**
   * Инициализация
   *
   * @protected
   */
  protected initialize(): void {
    super.initialize();

    // Инициализация переменных
    this.inputNode = this.node.querySelector<HTMLInputElement>(
      `[${this.dataPrefix}="input"]`
    );

    this.itemsNode = this.node.querySelector<HTMLElement>(
      `[${this.dataPrefix}="items"]`
    );

    this.itemsNodes = this.itemsNode?.querySelectorAll<HTMLElement>(
      `[${this.dataPrefix}="item"]`
    );
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindInput();
  }

  /**
   * Навешивание событий поиска
   */
  private bindInput(): void {}

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param {HTMLElement} node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Finder(node, {
      hideMode:
        node.dataset.fazeColorchangerDirection === 'display'
          ? 'display'
          : 'visibility',
    });
  }
}

export default Finder;
