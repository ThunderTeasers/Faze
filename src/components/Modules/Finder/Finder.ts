/**
 * Плагин поиска любых вещей в листинге
 *
 * Автор: Ерохин Максим
 * Дата: 29.11.2024
 */

import './Finder.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';

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
  showClass: string;
  caseSensitive: boolean;
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
      showClass: 'block',
      caseSensitive: false,
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
   *
   * @private
   */
  private bindInput(): void {
    Faze.Events.listener('input', this.inputNode, () => {
      this.update();
    });
  }

  /**
   * Обновление результата поиска
   *
   * @private
   */
  public update(): void {
    // Получаем значение
    const value = this.config.caseSensitive
      ? this.inputNode?.value
      : this.inputNode?.value.toLowerCase();

    // Проходимся по всем элементам и скрываем ненужные
    this.itemsNodes?.forEach((itemNode: HTMLElement) => {
      const itemValue = this.config.caseSensitive
        ? itemNode.dataset.fazeFinderItemValue
        : itemNode.dataset.fazeFinderItemValue?.toLowerCase();

      console.log(this.config.hideMode);

      if (itemValue?.includes(value || '')) {
        this.showItem(itemNode);
      } else {
        this.hideItem(itemNode);
      }
    });
  }

  private hideItem(node: HTMLElement): void {
    if (this.config.hideMode === 'display') {
      node.style.display = 'none';
    } else {
      node.style.visibility = 'hidden';
    }
  }

  /**
   * Показывает DOM элемент
   *
   * @param {HTMLElement} node DOM элемент, который нужно показать
   * @private
   */
  private showItem(node: HTMLElement): void {
    if (this.config.hideMode === 'display') {
      node.style.display = this.config.showClass;
    } else {
      node.style.visibility = 'visible';
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param {HTMLElement} node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Finder(node, {
      showClass: node.dataset.fazeFinderShowClass || 'block',
      caseSensitive:
        (node.dataset.fazeFinderCaseSensitive || 'false') === 'true',
      hideMode:
        node.dataset.fazeFinderHideMode === 'display'
          ? 'visibility'
          : 'display',
    });
  }
}

export default Finder;
