import './Gallery.scss';
import Faze from '../Core/Faze';

/**
 * Структура конфига галереи
 *
 * Содержит:
 *   thumbnails - позиция превьюшек фотографий относительно экрана("left", "right", "top", "bottom"), так же может быть пусто,
 *                тогда они показываться не будут
 *   index      - индекс картики в группе при нажатии на которую была инициализированна галерея
 *   group      - группа галереи, если на странице несколько галерей, то они связаны через это поле
 *   event      - событие по которому происходит инициализация галереи
 *   evented    - инициализировать по событию или сразу
 */
interface Config {
  thumbnailsPosition?: string;
  group: string;
  index?: number;
  event: string;
  evented: boolean;
}

class Gallery {
  // DOM элементы фотографий из которых надо составить галерею
  readonly callerNodes: HTMLElement[];

  // DOM элементы которые относятся к текущей активной группе
  activeNodes: HTMLElement[];

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент содержащий все элементы галереи
  wrapperNode: HTMLDivElement;

  // DOM элементы стрелок переключения
  arrowsNodes: {
    prev: HTMLDivElement,
    next: HTMLDivElement,
  };

  // DOM элемент крестика для закрытия галереи
  closeButtonNode: HTMLDivElement;

  // DOM элемент враммера картинки
  imageWrapperNode: HTMLDivElement;

  // DOM элемент картинки
  imageNode: HTMLImageElement;

  // Общее количество картинок в галерее
  totalImages: number;

  // Индекс текущей картинки в галереи
  index: number;

  constructor(nodes: HTMLElement[] | null, config: Partial<Config>) {
    if (!nodes) {
      throw new Error('Не заданы объекты галереи');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      thumbnailsPosition: undefined,
      event: 'click',
      index: undefined,
      group: 'default',
      evented: true,
    };

    this.config = Object.assign(defaultConfig, config);
    this.callerNodes = nodes;

    // Проверка конфига
    this.checkConfig();

    // Инициализирование переменных
    this.totalImages = this.callerNodes.length;
    this.activeNodes = [];

    // Вызов стандартных методов плагина
    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize() {
    // Проставляем класс всем элементам галереи
    this.callerNodes.forEach((node) => {
      node.classList.add('faze-gallery-caller');

      // Присваиваем стандартную группу, если она не указана
      if (!node.hasAttribute('data-faze-gallery-group')) {
        node.setAttribute('data-faze-gallery-group', this.config.group);
      }
    });
  }

  /**
   * Навешивание событий
   */
  bind() {
    if (this.config.evented) {
      this.callerNodes.forEach((node) => {
        // Вызываем галерею только на элементах у которых нет data атрибута "data-faze-gallery-passive"
        if (!node.hasAttribute('data-faze-gallery-passive')) {
          node.addEventListener(this.config.event, () => {
            // Фильтруем только элементы у которых такая же группа, как и у элемента по которому инициализируем галерею
            this.activeNodes = Array.from(this.callerNodes)
              .filter(callerNode => callerNode.getAttribute('data-faze-gallery-group') === node.getAttribute('data-faze-gallery-group'));

            // Обновляем общее количество элементов
            this.totalImages = this.activeNodes.length;

            // Присвоение корректного индекса
            this.index = this.activeNodes.indexOf(node);

            // Построение галереи
            this.build();

            // Навешивание событий на созданные выше элементы
            this.bindArrows();
            this.bindCloseButton();
          });
        }
      });
    } else {
      // Фильтруем только элементы у которых такая же группа, как и у элемента по которому инициализируем галерею
      this.activeNodes = Array.from(this.callerNodes)
        .filter(callerNode => callerNode.getAttribute('data-faze-gallery-group') === this.config.group);

      // Обновляем общее количество элементов
      this.totalImages = this.activeNodes.length;

      // Присвоение корректного индекса
      this.index = this.config.index || 0;

      // Построение галереи
      this.build();

      // Навешивание событий на созданные выше элементы
      this.bindArrows();
      this.bindKeyboardButtons();
      this.bindCloseButton();
    }
  }

  /**
   * Создание галереи
   */
  build() {
    // Создание элементов
    this.wrapperNode = document.createElement('div');
    this.arrowsNodes = {
      prev: document.createElement('div'),
      next: document.createElement('div'),
    };
    this.closeButtonNode = document.createElement('div');
    this.imageWrapperNode = document.createElement('div');
    this.imageNode = document.createElement('img');

    // Присваиваем необходимые классы
    this.wrapperNode.className = 'faze-gallery-wrapper';

    this.arrowsNodes.prev.className = 'faze-gallery-arrow faze-gallery-arrow-prev';
    this.arrowsNodes.next.className = 'faze-gallery-arrow faze-gallery-arrow-next';

    this.closeButtonNode.className = 'faze-gallery-close';

    this.imageWrapperNode.className = 'faze-gallery-wrapper-image';
    this.imageNode.className = 'faze-gallery-image';

    // Сборка элементов друг с другом
    this.wrapperNode.appendChild(this.arrowsNodes.prev);

    const source = this.activeNodes[this.index].getAttribute('data-faze-gallery-image');
    if (source) {
      this.imageNode.src = source;
    }
    this.imageWrapperNode.appendChild(this.imageNode);
    this.wrapperNode.appendChild(this.imageWrapperNode);

    this.wrapperNode.appendChild(this.closeButtonNode);

    this.wrapperNode.appendChild(this.arrowsNodes.next);

    document.body.appendChild(this.wrapperNode);
    document.body.classList.add('faze-gallery');
  }

  /**
   * Навешивание событий на стрелки переключения фотографий
   */
  bindArrows() {
    // Кнопка перелистывания назад
    this.arrowsNodes.prev.addEventListener('click', (event) => {
      event.preventDefault();

      this.prev();
    });

    // Кнопка перелистывания вперед
    this.arrowsNodes.next.addEventListener('click', (event) => {
      event.preventDefault();

      this.next();
    });
  }

  /**
   * Навешивание событий переключения фотографий при нажатии на соответствующие клавиши
   */
  bindKeyboardButtons() {
    const callbackFn = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowRight':
        case 'ArrowUp':
          this.next();
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          this.prev();
          break;
        case 'Escape':
          this.close();
          break;
        default:
          break;
      }
    };

    document.removeEventListener('keyup', callbackFn);
    document.addEventListener('keyup', callbackFn);
  }

  /**
   * Навешивание события на кнопку закрытия
   */
  bindCloseButton() {
    this.closeButtonNode.addEventListener('click', (event) => {
      event.preventDefault();

      this.close();
    });
  }

  /**
   * Закрытие галереи
   */
  close() {
    this.wrapperNode.remove();
    document.body.classList.remove('faze-gallery');
  }

  /**
   * Переключение галареи на одну фотографию вперед
   */
  next() {
    this.index += 1;
    if (this.index >= this.totalImages) {
      this.index = 0;
    }

    const source = this.activeNodes[this.index].getAttribute('data-faze-gallery-image');
    if (source) {
      this.imageNode.src = source;
    }
  }

  /**
   * Переключение галареи на одну фотографию назад
   */
  prev() {
    this.index -= 1;
    if (this.index < 0) {
      this.index = this.totalImages - 1;
    }

    const source = this.activeNodes[this.index].getAttribute('data-faze-gallery-image');
    if (source) {
      this.imageNode.src = source;
    }
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

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    // Задаем всем элементам без группы стандартную
    document.querySelectorAll('[data-faze="gallery"]').forEach((callerNode) => {
      callerNode.classList.add('faze-gallery-caller');

      if (!callerNode.hasAttribute('data-faze-gallery-group')) {
        callerNode.setAttribute('data-faze-gallery-group', 'default');
      }
    });

    Faze.on('click', '[data-faze="gallery"]:not([data-faze-gallery-passive])', (event, callerNode) => {
      const group: string | null = callerNode.getAttribute('data-faze-gallery-group');
      const callerNodes = document.querySelectorAll(`[data-faze-gallery-group=${group}]`);

      new Faze.Gallery(callerNodes, {
        group,
        evented: false,
        index: Array.from(callerNodes).indexOf(callerNode),
      });
    });
  }
}

export default Gallery;
