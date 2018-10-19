import './Gallery.scss';

/**
 * Структура конфига галереи
 *
 * Содержит:
 *   thumbnails - позиция превьюшек фотографий относительно экрана("left", "right", "top", "bottom"), так же может быть пусто,
 *                тогда они показываться не будут
 */
interface Config {
  thumbnailsPosition?: string;
}

class Gallery {
  // DOM элементы фотографий из которых надо составить галерею
  readonly nodes: HTMLElement[];

  // Конфиг с настройками
  readonly config: Config;

  constructor(nodes: HTMLElement[] | null, config: Partial<Config>) {
    if (!nodes) {
      throw new Error('Не заданы объекты галереи');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      thumbnailsPosition: undefined,
    };

    this.config = Object.assign(defaultConfig, config);
    this.nodes = nodes;

    // Проверка конфига
    this.checkConfig();

    // Вызов стандартных методов плагина
    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize() {
    this.nodes.forEach((node) => {
      node.classList.add('faze-gallery-item');
    });
  }

  /**
   * Навешивание событий
   */
  bind() {
    this.nodes.forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();

        console.log(1);
      });
    });
  }

  /**
   * Проверка конфиг файла на ошибки
   */
  checkConfig() {
    // Если задано значение положения превью и оно не равно нужным, выдаем ошибку
    if (this.config.thumbnailsPosition && !['left', 'right', 'top', 'bottom'].includes(this.config.thumbnailsPosition)) {
      throw new Error('Значение "thumbnailsPosition" некорректно, возможные значения: "left", "right", "top", "bottom".');
    }
  }
}

export default Gallery;
