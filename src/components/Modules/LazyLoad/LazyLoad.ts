/**
 * Плагин отложенной загрузки блоков сайта
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 24.07.2019
 */

import './LazyLoad.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Структура конфига
 *
 * Содержит:
 *   url - ссылка для загрузки данных
 *   offset - сдвиг в пикселях когда нужно загружать изображения начиная от нижней границы вьюпорта
 */
interface Config {
  url?: string;
  offset: number;
  evented: boolean;
}

/**
 * Класс отложенного изображения
 */
class LazyLoad extends Module {
  // Загружен ли модуль
  isLoaded: boolean;

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент с которым работаем
   * @param config Настройки
   */
  constructor(node: HTMLElement, config: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      url: undefined,
      offset: 100,
      evented: true,
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'LazyLoad',
    });

    // Стандартные параметры
    this.isLoaded = false;
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.bindCheck();
  }

  /**
   * навешивание событий на проверку срабатывания загрузки
   */
  bindCheck(): void {
    Faze.Events.listener(['load', 'resize', 'scroll'], window, () => {
      this.check();
    });
  }

  /**
   * Проверяем, если изображение видимо на экране(с учетом отступа), то загружаем его и после загрузки ставим в источник
   */
  check(): void {
    if (!this.isLoaded && this.isVisible() && this.config.evented) {
      this.load();
    }
  }

  /**
   * Загрузка модуля
   */
  async load(): Promise<void> {
    this.isLoaded = true;

    const response = await fetch(this.config.url);
    this.node.innerHTML = await response.text();

    this.node.dataset.fazeLazyloadLoaded = 'true';
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
  static initializeByDataAttributes(lazyLoadNode: HTMLElement): void {
    new Faze.LazyLoad(lazyLoadNode, {
      url: lazyLoadNode.dataset.fazeLazyloadUrl,
      offset: parseInt(lazyLoadNode.dataset.fazeLazyloadOffset || '100', 10),
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="lazyload"]', (lazyLoadNode: HTMLElement) => {
      LazyLoad.initializeByDataAttributes(lazyLoadNode);
    });

    document.querySelectorAll('[data-faze~="lazyload"]').forEach((lazyLoadNode: any) => {
      LazyLoad.initializeByDataAttributes(lazyLoadNode);
    });
  }
}

export default LazyLoad;
