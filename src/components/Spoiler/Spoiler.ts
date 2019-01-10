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
 * Класс дропдауна
 */
class Spoiler {
  // DOM элемент при наведении на который появляется
  readonly node: HTMLElement;

  // DOM элемент заголовка спойлера
  readonly titleNode: HTMLElement | null;

  // DOM элемент тела спойлера
  readonly bodyNode: HTMLElement | null;

  constructor(node: HTMLElement | null) {
    if (!node) {
      throw new Error('Не задан объект спойлера');
    }

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
  }

  /**
   * Навешивание событий
   */
  bind() {
    if (this.titleNode) {
      this.titleNode.addEventListener('click', () => {
        this.node.classList.toggle('faze-active');
      });
    }
  }

  /**
   * Инициализация спойлеров по data атрибутам
   */
  static hotInitialize(): void {
    document.querySelectorAll('[data-faze="spoiler"]').forEach((spoilerNode) => {
      new Faze.Spoiler(spoilerNode);
    });
  }
}

export default Spoiler;
