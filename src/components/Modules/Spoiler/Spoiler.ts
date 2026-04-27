/**
 * Плагин спойлера
 *
 * Спойлер представляет из себя заголовок и тело, тело раскрывается и закрывается при нажатии на заголовок
 *
 * Автор: Ерохин Максим
 * Дата: 17.10.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Spoiler
 */

import './Spoiler.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок спойлера
 *   body   - тело спойлера
 */
interface CallbackData {
  title: HTMLElement | null;
  body: HTMLElement | null;
}

/**
 * Структура конфига спойлера
 *
 * Содержит:
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся при успешном создании спойлера
 *     opened   - пользовательская функция, исполняющаяся при открытии спойлера
 *     changed  - пользовательская функция, исполняющаяся при изменении видимости спойлера
 *     closed   - пользовательская функция, исполняющаяся при закрытии спойлера
 */
interface Config {
  callbacks: {
    created?: (data: CallbackData) => void;
    opened?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    closed?: (data: CallbackData) => void;
  };
}

/**
 * Класс дропдауна
 */
class Spoiler extends Module {
  // DOM элемент заголовка спойлера
  titleNode: HTMLElement | null;

  // DOM элемент тела спойлера
  bodyNode: HTMLElement | null;

  // Состояние спойлера (открыт/закрыт)
  isOpen: boolean;

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      callbacks: {
        created: undefined,
        opened: undefined,
        changed: undefined,
        closed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Spoiler',
    });
  }

  /**
   * Инициализация
   */
  initialize() {
    super.initialize();

    // Инициализация переменных
    this.isOpen = false;
    this.titleNode = this.node.querySelector('.title, .faze-title, [data-faze-spoiler="title"]');
    this.bodyNode = this.node.querySelector('.body, .faze-body, [data-faze-spoiler="body"]');

    // Простановка стандартных классов
    this.titleNode?.classList.add('faze-title');
    this.bodyNode?.classList.add('faze-body');

    // Вызываем пользовательский метод
    super.call(this.config.callbacks.created, { title: this.titleNode, body: this.bodyNode }, 'created');
  }

  /**
   * Навешивание событий
   */
  bind() {
    super.bind();

    Faze.Events.click(this.titleNode, () => {
      this.isOpen ? this.close() : this.open();

      // Вызываем пользовательский метод
      super.call(this.config.callbacks.changed, { title: this.titleNode, body: this.bodyNode }, 'changed');
    });
  }

  /**
   * Открытие спойлера
   */
  open(): void {
    this.isOpen = true;
    this.node.classList.add('faze-active');

    // Вызываем пользовательский метод
    super.call(this.config.callbacks.opened, { title: this.titleNode, body: this.bodyNode }, 'opened');
  }

  /**
   * Закрытие спойлера
   */
  close(): void {
    this.isOpen = false;
    this.node.classList.remove('faze-active');

    // Вызываем пользовательский метод
    super.call(this.config.callbacks.closed, { title: this.titleNode, body: this.bodyNode }, 'closed');
  }

  static initializeByDataAttributes(spoilerNode: HTMLElement): void {
    new Faze.Spoiler(spoilerNode);
  }
}

export default Spoiler;
