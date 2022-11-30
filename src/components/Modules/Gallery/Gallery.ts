import './Gallery.scss';
import Faze from '../../Core/Faze';

interface ImageData {
  thumbnail: string;
  full: string;
}

/**
 * Структура конфига галереи
 *
 * Содержит:
 *   thumbnails - позиция превью фотографий относительно экрана("left", "right", "top", "bottom"), так же может быть пусто,
 *                тогда они показываться не будут
 *   index - индекс картинки в группе при нажатии на которую была инициализирована галерея
 *   group - группа галереи, если на странице несколько галерей, то они связаны через это поле
 *   event - событие по которому происходит инициализация галереи
 *   evented - инициализировать по событию или сразу
 *   zoomable - можно ли приближать фотографию
 *   counter - отображать ли счетчик
 *   disableResolution - разрешение ниже которого не показывать галерею
 */
interface Config {
  thumbnailsPosition?: string;
  group: string;
  index?: number;
  event: string;
  evented: boolean;
  counter: boolean;
  zoomable: boolean;
  disableResolution: number;
}

class Gallery {
  // DOM элементы фотографий из которых надо составить галерею
  private readonly callerNodes: HTMLElement[];

  // Изображения галереи
  private imagesData: ImageData[];

  // Конфиг с настройками
  private readonly config: Config;

  // DOM элемент содержащий все элементы галереи
  private wrapperNode: HTMLDivElement;

  // DOM элементы стрелок переключения
  private arrowsNodes: {
    prev: HTMLDivElement,
    next: HTMLDivElement,
  };

  // DOM элемент крестика для закрытия галереи
  private closeButtonNode: HTMLDivElement;

  // DOM элемент враппера картинки
  private imageWrapperNode: HTMLDivElement;

  // DOM элемент списка превью
  private thumbnailsNode: HTMLDivElement;

  // DOM элементы превью
  private readonly thumbnailsNodes: HTMLDivElement[];

  // DOM элемент картинки
  private imageNode: HTMLImageElement;

  // Общее количество картинок в галерее
  private totalImages: number;

  // Индекс текущей картинки в галереи
  private index: number;

  // DOM элемент счётчика
  private counterNode: HTMLElement;

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
      zoomable: false,
      counter: false,
      disableResolution: 0,
    };

    this.config = Object.assign(defaultConfig, config);
    this.callerNodes = nodes;

    // Если достигли разрешения при котором не показывать галерею, то сразу выходим из модуля
    if (this.config.disableResolution > window.innerWidth) {
      return;
    }

    // Проверка конфига
    this.checkConfig();

    // Инициализирование переменных
    this.totalImages = this.callerNodes.length;
    this.imagesData = [];
    this.thumbnailsNodes = [];

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
            // Фильтруем только элементы у которых такая же группа, как и у элемента инициализировавшего галерею
            this.imagesData = Array.from(this.callerNodes)
              .filter(tmpCallerNode => tmpCallerNode.dataset.fazeGalleryGroup === callerNode.dataset.fazeGalleryGroup)
              .map(tmpCallerNode => ({
                thumbnail: (tmpCallerNode as HTMLImageElement).src,
                full: tmpCallerNode.dataset.fazeGalleryImage || (tmpCallerNode as HTMLImageElement).src,
              }));

            // Обновляем общее количество элементов
            this.totalImages = this.imagesData.length;

            // Присвоение корректного индекса
            this.index = Array.from(this.callerNodes)
              .indexOf(callerNode);

            // Построение галереи
            this.build();

            // Навешивание событий на созданные выше элементы
            this.bindArrows();
            this.bindCloseButton();
          });
        }
      });
    } else {
      // Фильтруем только элементы у которых такая же группа, как и у элемента инициализирующего галерею
      this.imagesData = Array.from(this.callerNodes)
        .filter(callerNode => callerNode.dataset.fazeGalleryGroup === this.config.group)
        .map(callerNode => ({
          thumbnail: (callerNode as HTMLImageElement).src,
          full: callerNode.dataset.fazeGalleryImage || (callerNode as HTMLImageElement).src,
        }));

      // Обновляем общее количество элементов
      this.totalImages = this.imagesData.length;

      // Присвоение корректного индекса
      this.index = this.config.index || 0;

      // Построение галереи
      this.build();

      // Навешивание событий на созданные выше элементы
      this.bindArrows();
      this.bindKeyboardButtons();
      this.bindCloseButton();

      // Если есть увеличение, навешиваем его
      if (this.config.zoomable) {
        this.bindZoom();
      }
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
    this.wrapperNode.className = `faze-gallery-wrapper ${this.config.zoomable ? 'faze-gallery-wrapper-zoomable' : ''}`;

    this.arrowsNodes.prev.className = 'faze-gallery-arrow faze-gallery-arrow-prev';
    this.arrowsNodes.next.className = 'faze-gallery-arrow faze-gallery-arrow-next';

    this.closeButtonNode.className = 'faze-gallery-close';

    this.imageWrapperNode.className = 'faze-gallery-wrapper-image';
    this.imageNode.className = 'faze-gallery-image';

    // Сборка элементов друг с другом
    this.wrapperNode.appendChild(this.arrowsNodes.prev);

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

    // Строим превью
    if (!!this.config.thumbnailsPosition) {
      this.buildThumbnails();
    }

    // Загрузка нового изображения
    this.change(this.index);
  }

  /**
   * Построение превью
   *
   * @private
   */
  private buildThumbnails(): void {
    // Создаём список превью
    this.thumbnailsNode = document.createElement('div');
    this.thumbnailsNode.className = 'faze-gallery-thumbnails';
    this.wrapperNode.classList.add(`faze-gallery-wrapper-thumbnails-${this.config.thumbnailsPosition}`);

    // Проходимся по всем данным изображений и создаём превью
    this.imagesData.forEach((imageData: ImageData, imageIndex: number) => {
      // Создаём превью
      const thumbnailNode = document.createElement('img');
      thumbnailNode.src = imageData.thumbnail;
      thumbnailNode.className = 'faze-gallery-thumbnail';
      thumbnailNode.dataset.index = imageIndex.toString();

      // Добавляем превью везде
      this.thumbnailsNodes.push(thumbnailNode);
      this.bindThumbnail(thumbnailNode, imageIndex);
      this.thumbnailsNode.appendChild(thumbnailNode);
    });

    // Добавляем список превью в галерею
    this.wrapperNode.appendChild(this.thumbnailsNode);
  }

  /**
   * Навешивание событий на увеличения изображения по нажатию на него
   *
   * @private
   */
  private bindZoom() {
    let isZoomed = false;

    this.imageNode.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();

      isZoomed = !isZoomed;

      this.wrapperNode.classList.add('faze-gallery-wrapper-zoomable-active');

      if (isZoomed) {
        Faze.Helpers.bindDrag({
          node: this.imageNode,
          callbacks: {
            drag: () => {
              console.log(this.imageNode.getBoundingClientRect());
            },
          },
        });
      }
    });
  }

  /**
   * Навешивание событий на нажатия по превью, для показа изображения
   *
   * @param thumbnailNode DOM элемент превью
   * @param index Индекс превью
   *
   * @private
   */
  private bindThumbnail(thumbnailNode: HTMLImageElement, index: number): void {
    thumbnailNode.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();

      // Изменяем текущее изображение
      this.change(index);
    });
  }

  /**
   * Создание счётчика изображений
   */
  private buildPagination(): void {
    // DOM элемент счётчика
    this.counterNode = document.createElement('div');
    this.counterNode.className = 'faze-gallery-counter';
    this.updateCounter();

    this.wrapperNode.appendChild(this.counterNode);
  }

  /**
   * Обновление счётчика
   */
  private updateCounter(): void {
    this.counterNode.innerHTML =
      `<span class="faze-gallery-counter-current">${this.index + 1}</span> <span class="faze-gallery-counter-delimiter">/</span> <span class="faze-gallery-counter-total">${this.totalImages}</span>`;
  }

  /**
   * Навешивание событий на стрелки переключения фотографий
   */
  private bindArrows(): void {
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
  private bindKeyboardButtons(): void {
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
  private bindCloseButton(): void {
    this.closeButtonNode.addEventListener('click', (event: Event) => {
      event.preventDefault();

      this.close();
    });
  }

  /**
   * Закрытие галереи
   */
  private close(): void {
    this.wrapperNode.remove();
    document.body.classList.remove('faze-gallery');
    this.imagesData = [];
  }

  /**
   * Переключение галереи на одну фотографию вперед
   */
  private next(): void {
    this.index += 1;

    // Загрузка нового изображения
    this.change(this.index);

    // Обновление счётчика
    if (this.config.counter) {
      this.updateCounter();
    }
  }

  /**
   * Переключение галереи на одну фотографию назад
   */
  private prev(): void {
    this.index -= 1;

    // Загрузка нового изображения
    this.change(this.index);

    // Обновление счётчика
    if (this.config.counter) {
      this.updateCounter();
    }
  }

  /**
   * Изменение текущего изображения
   *
   * @param index Индекс нового изображения
   */
  public change(index: number) {
    this.index = index;

    // Проверка границ
    this.checkIndexBounds();

    // Загружаем изображение
    this.loadImage();

    // Проставляем класс нужному элементу
    Faze.Helpers.activateItem(this.thumbnailsNodes, this.index, 'faze-active');
  }

  /**
   * Проверка на выход за границы массива доступных изображений для галереи
   *
   * @private
   */
  private checkIndexBounds(): void {
    if (this.index < 0) {
      this.index = this.totalImages - 1;
    } else if (this.index >= this.totalImages) {
      this.index = 0;
    }
  }

  /**
   * Загрузка нового изображения
   *
   * @private
   */
  private loadImage(): void {
    const source: string | undefined = this.imagesData[this.index].full;
    if (source) {
      const image = new Image();
      image.src = source;
      image.onload = () => {
        this.imageNode.src = source;
      };
    }
  }

  /**
   * Проверка конфиг файла на ошибки
   */
  private checkConfig(): void {
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
    document.querySelectorAll<HTMLElement>('[data-faze="gallery"]')
      .forEach((callerNode: HTMLElement) => {
        callerNode.classList.add('faze-gallery-caller');

        if (!callerNode.dataset.fazeGalleryGroup) {
          callerNode.dataset.fazeGalleryGroup = 'default';
        }
      });

    Faze.on('click', '[data-faze="gallery"]:not([data-faze-gallery-passive])', (event: Event, callerNode: HTMLElement) => {
      const group: string | undefined = callerNode.dataset.fazeGalleryGroup;
      const callerNodes = document.querySelectorAll(`[data-faze-gallery-group="${group}"]`);

      if (parseInt(callerNode.dataset.fazeGalleryDisableResolution || '0', 10) < window.innerWidth) {
        new Faze.Gallery(callerNodes, {
          group,
          evented: false,
          index: Array.from(callerNodes)
            .indexOf(callerNode),
          counter: (callerNode.dataset.fazeGalleryCounter || 'false') === 'true',
          zoomable: (callerNode.dataset.fazeGalleryZoomable || 'false') === 'true',
          thumbnailsPosition: callerNode.dataset.fazeGalleryThumbnailsPosition,
        });
      }
    });
  }
}

export default Gallery;
