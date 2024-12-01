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
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после изменения в поиске
 */
interface Config {
  hideMode: 'display' | 'visibility';
  showClass: string;
  caseSensitive: boolean;
  minLength: number;
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
      minLength: 3,
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

    // Вызываем пользовательскую функцию
    this.createdCallbackCall();
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
      if ((this.inputNode?.value.length || 0) >= this.config.minLength) {
        this.update();
      }
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

      if (itemValue?.includes(value || '')) {
        this.showItem(itemNode);
      } else {
        this.hideItem(itemNode);
      }
    });

    // Вызываем пользовательскую функцию
    this.changeCallbackCall();
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
   * Выполнение пользовательской функции "created"
   *
   * @private
   */
  private createdCallbackCall(): void {
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          node: this.node,
          inputNode: this.inputNode,
          itemsNode: this.itemsNode,
          itemsNodes: this.itemsNodes,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "created": ${error}`
        );
      }
    }
  }

  /**
   * Выполнение пользовательской функции "changed"
   *
   * @private
   */
  private changeCallbackCall(): void {
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          node: this.node,
          inputNode: this.inputNode,
          itemsNode: this.itemsNode,
          itemsNodes: this.itemsNodes,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "changed": ${error}`
        );
      }
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
      minLength: parseInt(node.dataset.fazeFinderMinLength || '3', 10),
      caseSensitive:
        (node.dataset.fazeFinderCaseSensitive || 'false') === 'true',
      hideMode:
        node.dataset.fazeFinderHideMode === 'visibility'
          ? 'visibility'
          : 'display',
    });
  }
}

export default Finder;
