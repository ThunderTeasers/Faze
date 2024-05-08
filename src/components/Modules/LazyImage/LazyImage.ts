/**
 * Плагин отложенной загрузки изображений
 *
 * Описывает абстрактный объект с ссылкой на изображение, которое будет подгружено после того как заданный DOM элемент будет виден на
 * экране(с учетом значения сдвига он может быть и не виден).
 * Сам по себе класс не работает, т.к. были бы слишком большие проблемы с оптимизацией при навешивании для каждого изображения эвента на
 * скролл окна, для этого создан класс помощник, а именно LazyImageController, который выполняет организационную работу.
 *
 * Автор: Ерохин Максим
 * Дата: 24.07.2019
 */

import './LazyImage.scss';
import './img/lazy_image-placeholder.svg';
import Faze from '../../Core/Faze';

/**
 * Структура конфига
 *
 * Содержит:
 *   offset - сдвиг в пикселях когда нужно загружать изображения начиная от нижней границы вьюпорта
 *   width  - предполагаемая ширина изображения
 *   height - предполагаемая высота изображения
 */
interface Config {
  offset: number;
  width?: number;
  height?: number;
}

/**
 * Класс отложенного изображения
 */
class LazyImage {
  // DOM элементы изображения, которое должно быть подгружено
  readonly node: HTMLImageElement;

  // Конфиг с настройками
  readonly config: Config;

  constructor(node: HTMLImageElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект изображения для отложенной загрузки');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      offset: 100,
      width: undefined,
      height: undefined,
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.initialize();
  }

  /**
   * Инициализация
   */
  initialize() {
    // Простановка стандартных классов
    this.node.classList.add('faze-lazy_image');
    this.node.classList.add('faze-lazy_image-initialized');

    // Проставляем размеры
    if (this.config.width) {
      this.node.style.width = `${this.config.width}px`;
    }

    if (this.config.height) {
      this.node.style.height = `${this.config.height}px`;
    }
  }

  /**
   * Проверяем, если изображение видимо на экране(с учетом отступа), то загружаем его и после загрузки ставим в источник
   */
  check(): boolean {
    if (this.isVisible()) {
      const image = new Image();
      image.src = this.node.dataset.fazeLazy_imageImage || '';
      image.addEventListener('load', () => {
        this.node.src = image.src;
        this.node.style.width = '';
        this.node.style.height = '';
      });

      return true;
    }

    return false;
  }

  /**
   * Проверка видимо ли изображение на экране
   */
  isVisible(): boolean {
    return window.scrollY + window.innerHeight + this.config.offset > this.node.offsetTop && this.node.offsetParent !== null;
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param lazyImageNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(lazyImageNode: HTMLElement): void {
    Faze.LazyImageController.add(
      new Faze.LazyImage(lazyImageNode, {
        offset: parseInt(lazyImageNode.dataset.fazeLazy_imageOffset || '0', 10),
        width: lazyImageNode.dataset.fazeLazy_imageWidth ? parseInt(lazyImageNode.dataset.fazeLazy_imageWidth || '0', 10) : null,
        height: lazyImageNode.dataset.fazeLazy_imageHeight ? parseInt(lazyImageNode.dataset.fazeLazy_imageHeight || '0', 10) : null,
      })
    );
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="lazy_image"]', (lazyImageNode: HTMLElement) => {
      LazyImage.initializeByDataAttributes(lazyImageNode);
    });

    document.querySelectorAll('[data-faze~="lazy_image"]').forEach((lazyImageNode: any) => {
      LazyImage.initializeByDataAttributes(lazyImageNode);
    });
  }
}

export default LazyImage;
