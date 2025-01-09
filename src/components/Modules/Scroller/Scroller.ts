/**
 * Плагин поиска
 *
 * Автор: Ерохин Максим
 * Дата: 01.12.2024
 */

import './Scroller.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   node - DOM элемент где происходит работа модуля
 *   btnNode - DOM элемент кнопки скрола
 */
interface CallbackData {
  node: HTMLElement;
  btnNode: HTMLButtonElement;
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   side - сторона где выводится кнопка
 *   offset - количество пикселей на которых показываем кнопку
 *   smooth - флаг плавности прокрутки
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после нажатия на кнопку скрола
 */
interface Config {
  side: 'left' | 'right';
  smooth: boolean;
  offset: number;
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс
 */
class Scroller extends Module {
  // DOM элемент кнопки
  btnNode: HTMLButtonElement;

  /**
   * Стандартный конструктор
   *
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Config} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      side: 'right',
      offset: 300,
      smooth: true,
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Scroller',
    });
  }

  /**
   * Инициализация
   *
   * @protected
   */
  protected initialize(): void {
    super.initialize();

    // Простановка стандартных классов
    this.node.classList.add(`${this.classPrefix}-${this.config.side}`);

    // Выполнение пользовательской функции "created"
    this.createdCallbackCall();
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindScroll();
    this.bindButton();
  }

  /**
   * Навешивание события на скролл для отслежки видимости кнопки
   *
   * @private
   */
  private bindScroll(): void {
    Faze.Events.listener('scroll', window, () => {
      this.checkVisibility();
    });
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void {
    super.build();

    this.buildButton();
  }

  /**
   * Создает кнопку прокрутки
   *
   * @private
   */
  private buildButton() {
    this.btnNode = document.createElement('button');
    this.btnNode.className = 'faze-scroller-btn';
    this.node.appendChild(this.btnNode);

    // Сразу проверяем должно ли быть видно кнопку
    this.checkVisibility();
  }

  /**
   * Проверяет видимость кнопки
   *
   * @private
   */
  private checkVisibility(): void {
    this.btnNode.classList.toggle(
      'faze-active',
      window.scrollY >= this.config.offset
    );
  }

  /**
   * Навешивание события на кнопку прокрутки
   *
   * @private
   */
  private bindButton(): void {
    Faze.Events.listener('click', this.btnNode, () => {
      window.scrollTo({
        top: 0,
        behavior: this.config.smooth ? 'smooth' : 'instant',
      });

      // Выполнение пользовательской функции "changed"
      this.changeCallbackCall();
    });
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
          btnNode: this.btnNode,
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
          btnNode: this.btnNode,
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
    new Scroller(node, {
      offset: parseInt(node.dataset.fazeScrollerOffset || '300', 10),
      side: node.dataset.fazeScrollerSide === 'left' ? 'left' : 'right',
      smooth: (node.dataset.fazeScrollerSmooth || 'true') === 'true',
    });
  }
}

export default Scroller;
