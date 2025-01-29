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
 *   itemsNodes - DOM элемент инпута поиска
 */
interface CallbackData {
  node: HTMLElement;
  inputNode: HTMLInputElement;
  itemsNodes: HTMLElement[];
}

/**
 * Структура конфига
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
  mode: 'display' | 'visibility';
  caseSensitive: boolean;
  minLength: number;
  clearButton: boolean;
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
  private inputNode: HTMLInputElement | null;

  // DOM элементы элементов
  private itemsNodes?: NodeListOf<HTMLElement>;

  // DOM элемент кнопки очистки
  private btnClearNode?: HTMLButtonElement;

  // DOM элемент холдера инпута
  private inputHolderNode?: HTMLElement;

  /**
   * Стандартный конструктор
   *
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Config} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      mode: 'display',
      minLength: 0,
      caseSensitive: false,
      clearButton: false,
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

    this.itemsNodes = this.node?.querySelectorAll<HTMLElement>(
      `[${this.dataPrefix}="item"]`
    );

    // Вызываем пользовательскую функцию
    this.createdCallbackCall();
  }

  protected build(): void {
    super.build();

    this.buildInputHolder();
    this.buildClearButton();
  }

  /**
   * Создает контейнер для input, если clearButton включен.
   *
   * @private
   */
  private buildInputHolder(): void {
    if (this.config.clearButton && this.inputNode) {
      this.inputHolderNode = document.createElement('div');
      this.inputHolderNode.className = 'faze-finder-input-holder';
      Faze.DOM.insertBefore(this.inputNode, this.inputHolderNode);
      this.inputHolderNode.appendChild(this.inputNode);
    }
  }

  /**
   * Создает и добавляет кнопку очистки рядом с инпутом поиска.
   *
   * @private
   */
  private buildClearButton(): void {
    if (this.config.clearButton && this.inputHolderNode) {
      this.btnClearNode = document.createElement('button');
      this.btnClearNode.type = 'button';
      this.btnClearNode.className = 'faze-finder-clear-button faze-hide';
      this.inputHolderNode.appendChild(this.btnClearNode);
    }
  }

  /**
   * Менеджер видимости кнопки очистки
   *
   * @private
   */
  private manageClearButtonVisibility(): void {
    if (this.config.clearButton && this.inputNode) {
      this.btnClearNode?.classList.toggle(
        'faze-hide',
        this.inputNode.value.length === 0
      );
    }
  }

  /**
   * Навешивание события на кнопку очистки.
   *
   * @private
   */
  private bindClearButton(): void {
    Faze.Events.listener('click', this.btnClearNode, () => {
      if (this.inputNode) {
        this.inputNode.value = '';
      }

      this.update();
    });
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindInput();
    this.bindClearButton();
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
    // Класс для скрытия
    const hideClass =
      this.config.mode === 'visibility' ? 'faze-hidden' : 'faze-hide';

    // Получаем значение
    const value = this.config.caseSensitive
      ? this.inputNode?.value
      : this.inputNode?.value.toLowerCase();

    // Проходимся по всем элементам и скрываем ненужные
    this.itemsNodes?.forEach((itemNode: HTMLElement) => {
      const itemValue = this.config.caseSensitive
        ? itemNode.dataset.fazeFinderItemValue
        : itemNode.dataset.fazeFinderItemValue?.toLowerCase();

      // Управляем видимостью элементов
      itemNode.classList.toggle(
        hideClass,
        !(
          (this.inputNode?.value.length || 0) < this.config.minLength ||
          itemValue?.includes(value || '')
        )
      );
    });

    this.manageClearButtonVisibility();

    // Вызываем пользовательскую функцию
    this.changeCallbackCall();
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
      minLength: parseInt(node.dataset.fazeFinderMinLength || '0', 10),
      caseSensitive:
        (node.dataset.fazeFinderCaseSensitive || 'false') === 'true',
      clearButton: (node.dataset.fazeFinderClearButton || 'false') === 'true',
      mode:
        node.dataset.fazeFinderMode === 'visibility' ? 'visibility' : 'display',
    });
  }
}

export default Finder;
