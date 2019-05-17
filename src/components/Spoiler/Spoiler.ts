/**
 * Плагин спойлера
 *
 * Спойлер представляет из себя заголовок и тело, тело раскрывается и закрывается при нажатии на заголовок
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 17.10.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Spoiler
 */

import './Spoiler.scss';
import Faze from '../Core/Faze';

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
 */
interface Config {
  callbacks: {
    created?: (data: CallbackData) => void;
    opened?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс дропдауна
 */
class Spoiler {
  // DOM элемент при наведении на который появляется
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент заголовка спойлера
  readonly titleNode: HTMLElement | null;

  // DOM элемент тела спойлера
  readonly bodyNode: HTMLElement | null;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект спойлера');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      callbacks: {
        created: undefined,
        opened: undefined,
        changed: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    // Инициализация переменных
    this.node = node;

    this.titleNode = node.querySelector('.title');
    this.bodyNode = node.querySelector('.body');

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize() {
    this.node.classList.add('faze-spoiler');
    if (this.titleNode) {
      this.titleNode.classList.add('faze-title');
    }
    if (this.bodyNode) {
      this.bodyNode.classList.add('faze-body');
    }

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          title: this.titleNode,
          body: this.bodyNode,
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательского метода "created":', error);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind() {
    if (this.titleNode) {
      this.titleNode.addEventListener('click', () => {
        this.node.classList.toggle('faze-active');

        if (this.node.classList.contains('faze-active')) {
          // Вызываем пользовательский метод
          if (typeof this.config.callbacks.opened === 'function') {
            try {
              this.config.callbacks.opened({
                title: this.titleNode,
                body: this.bodyNode,
              });
            } catch (error) {
              console.error('Ошибка исполнения пользовательского метода "opened":', error);
            }
          }
        }

        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.changed === 'function') {
          try {
            this.config.callbacks.changed({
              title: this.titleNode,
              body: this.bodyNode,
            });
          } catch (error) {
            console.error('Ошибка исполнения пользовательского метода "changed":', error);
          }
        }
      });
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="spoiler"]', (spoilerNode: HTMLElement) => {
      new Faze.Spoiler(spoilerNode);
    });

    document.querySelectorAll('[data-faze~="spoiler"]').forEach((spoilerNode) => {
      new Faze.Spoiler(spoilerNode);
    });
  }
}

export default Spoiler;
