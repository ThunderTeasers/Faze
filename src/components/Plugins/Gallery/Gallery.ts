import './Gallery.scss';
import Faze from '../../Core/Faze';

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
 *   counter    - отображать ли счетчик
 */
interface Config {
  thumbnailsPosition?: string;
  group: string;
  index?: number;
  event: string;
  evented: boolean;
  counter: boolean;
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

  // DOM элемент счётчика
  counterNode: HTMLElement;

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
      counter: false,
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
  initialize(): void {
    // Проставляем класс всем элементам галереи
    this.callerNodes.forEach((callerNode: HTMLElement) => {
      callerNode.classList.add('faze-gallery-caller');

      // Присваиваем стандартную группу, если она не указана
      if (!callerNode.dataset.fazeGalleryGroup) {
        callerNode.dataset.fazeGalleryGroup = this.config.group;
      }
    });
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (this.config.evented) {
      this.callerNodes.forEach((callerNode: HTMLElement) => {
        // Вызываем галерею только на элементах у которых нет data атрибута "data-faze-gallery-passive"
        if (!callerNode.dataset.fazeGalleryPassive) {
          callerNode.addEventListener(this.config.event, () => {
            // Фильтруем только элементы у которых такая же группа, как и у элемента по которому инициализируем галерею
            this.activeNodes = Array.from(this.callerNodes)
              .filter(tmpCallerNode => tmpCallerNode.dataset.fazeGalleryGroup === callerNode.dataset.fazeGalleryGroup);

            // Обновляем общее количество элементов
            this.totalImages = this.activeNodes.length;

            // Присвоение корректного индекса
            this.index = this.activeNodes.indexOf(callerNode);

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
        .filter(callerNode => callerNode.dataset.fazeGalleryGroup === this.config.group);

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
  build(): void {
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

    const source: string | undefined = this.activeNodes[this.index].dataset.fazeGalleryImage;
    if (source) {
      this.imageNode.src = source;
    }
    this.imageWrapperNode.appendChild(this.imageNode);
    this.wrapperNode.appendChild(this.imageWrapperNode);

    this.wrapperNode.appendChild(this.closeButtonNode);

    this.wrapperNode.appendChild(this.arrowsNodes.next);

    document.body.appendChild(this.wrapperNode);
    document.body.classList.add('faze-gallery');

    // Строим пагинацию
    if (this.config.counter) {
      this.buildPagination();
    }
  }

  /**
   * Создание счётчика изображений
   */
  buildPagination(): void {
    // DOM элемент счётчика
    this.counterNode = document.createElement('div');
    this.counterNode.className = 'faze-gallery-counter';
    this.updateCounter();

    this.wrapperNode.appendChild(this.counterNode);
  }

  /**
   * Обновление счётчика
   */
  updateCounter(): void {
    this.counterNode.innerHTML = `<span class="faze-gallery-counter-current">${this.index + 1}</span> <span class="faze-gallery-counter-delimiter">/</span> <span class="faze-gallery-counter-total">${this.totalImages}</span>`;
  }

  /**
   * Навешивание событий на стрелки переключения фотографий
   */
  bindArrows(): void {
    // Кнопка перелистывания назад
    this.arrowsNodes.prev.addEventListener('click', (event: Event) => {
      event.preventDefault();

      this.prev();
    });

    // Кнопка перелистывания вперед
    this.arrowsNodes.next.addEventListener('click', (event: Event) => {
      event.preventDefault();

      this.next();
    });
  }

  /**
   * Навешивание событий переключения фотографий при нажатии на соответствующие клавиши
   */
  bindKeyboardButtons(): void {
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
  bindCloseButton(): void {
    this.closeButtonNode.addEventListener('click', (event: Event) => {
      event.preventDefault();

      this.close();
    });
  }

  /**
   * Закрытие галереи
   */
  close(): void {
    this.wrapperNode.remove();
    document.body.classList.remove('faze-gallery');
  }

  /**
   * Переключение галареи на одну фотографию вперед
   */
  next(): void {
    this.index += 1;
    if (this.index >= this.totalImages) {
      this.index = 0;
    }

    const source: string | undefined = this.activeNodes[this.index].dataset.fazeGalleryImage;
    if (source) {
      this.imageNode.src = source;
    }

    // Обновление счётчика
    if (this.config.counter) {
      this.updateCounter();
    }
  }

  /**
   * Переключение галареи на одну фотографию назад
   */
  prev(): void {
    this.index -= 1;
    if (this.index < 0) {
      this.index = this.totalImages - 1;
    }

    const source: string | undefined = this.activeNodes[this.index].dataset.fazeGalleryImage;
    if (source) {
      this.imageNode.src = source;
    }

    // Обновление счётчика
    if (this.config.counter) {
      this.updateCounter();
    }
  }

  /**
   * Проверка конфиг файла на ошибки
   */
  checkConfig(): void {
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
    document.querySelectorAll<HTMLElement>('[data-faze="gallery"]').forEach((callerNode: HTMLElement) => {
      callerNode.classList.add('faze-gallery-caller');

      if (!callerNode.dataset.fazeGalleryGroup) {
        callerNode.dataset.fazeGalleryGroup = 'default';
      }
    });

    Faze.on('click', '[data-faze="gallery"]:not([data-faze-gallery-passive])', (event: Event, callerNode: HTMLElement) => {
      const group: string | undefined = callerNode.dataset.fazeGalleryGroup;
      const callerNodes = document.querySelectorAll(`[data-faze-gallery-group="${group}"]`);

      new Faze.Gallery(callerNodes, {
        group,
        evented: false,
        index: Array.from(callerNodes).indexOf(callerNode),
        counter: (callerNode.dataset.fazeGalleryCounter || 'false') === 'true',
      });
    });
  }
}

export default Gallery;
