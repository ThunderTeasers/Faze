/**
 * Плагин просмотра изображений
 *
 * Модуль просмотра изображений представляет из себя простейший модуль для увеличения изображения при наведении на него.
 * Увеличенное изображение двигается вместе с курсором.
 *
 * Автор: Ерохин Максим
 * Дата: 19.09.2022
 */

import './Look.scss';
import Module from '../../Core/Module';

interface Config {
  width: number;
  height: number;
}

class Look extends Module {
  // DOM элемент просмотра изображения
  private lookNode: HTMLImageElement;

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент с которым работаем
   * @param config Настройки
   */
  constructor(node: HTMLElement, config?: Partial<Config>) {
    // Настройки по умолчанию
    const defaultConfig: Config = {
      width: 300,
      height: 300,
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Look',
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();

    this.lookNode = document.createElement('img');
    this.lookNode.src = (this.node as HTMLImageElement).src;
    this.lookNode.className = 'faze-look-image';
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    // При наведении курсора на область
    this.node.addEventListener('mouseenter', () => {
      this.open();
    });

    // При движении курсора
    this.node.addEventListener('mousemove', (event: MouseEvent) => {
      this.lookNode.style.top = `${event.clientY}px`;
      this.lookNode.style.left = `${event.clientX + 10}px`;
    });

    // При выведении курсора из области
    this.node.addEventListener('mouseleave', () => {
      this.close();
    });
  }

  /**
   * Открытие просмотра изображения
   */
  private open(): void {
    document.body.appendChild(this.lookNode);
  }

  /**
   * Закрытие просмотра изображения
   */
  private close(): void {
    this.lookNode.remove();
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Look(node, {
      width: parseInt(node.dataset.fazeLookWidth || '300', 10),
      height: parseInt(node.dataset.fazeLookWidth || '300', 10),
    });
  }
}

export default Look;
