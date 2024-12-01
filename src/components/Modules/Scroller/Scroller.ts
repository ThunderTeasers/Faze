/**
 * Плагин поиска
 *
 * Автор: Ерохин Максим
 * Дата: 01.12.2024
 */

import './Scroller.scss';
import Module from '../../Core/Module';
// import Faze from '../../Core/Faze';

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
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после нажатия на кнопку скрола
 */
interface Config {
  side: 'left' | 'right';
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
      offset: 100,
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
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindButton();
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

  private buildButton() {
    this.btnNode = document.createElement('button');
    this.btnNode.className = 'faze-scroller-btn';
    this.node.appendChild(this.btnNode);
  }

  private bindButton(): void {}

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param {HTMLElement} node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Scroller(node, {
      offset: parseInt(node.dataset.fazeScrollerOffset || '100', 10),
      side: node.dataset.fazeScrollerSide === 'left' ? 'left' : 'right',
    });
  }
}

export default Scroller;
