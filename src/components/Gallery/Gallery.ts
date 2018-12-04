import './Gallery.scss';

/**
 * Структура конфига галереи
 *
 * Содержит:
 *   thumbnails - позиция превьюшек фотографий относительно экрана("left", "right", "top", "bottom"), так же может быть пусто,
 *                тогда они показываться не будут
 *   event      - событие по которому происходит инициализация галереи
 *   group      - группа галереи, если на странице несколько галерей, то они связаны через это поле
 */
interface Config {
  thumbnailsPosition?: string;
  group: string;
  event: string;
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
      group: 'default',
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
    this.callerNodes.forEach((node, i) => {
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

    console.log(this.index);

    const source = this.activeNodes[this.index].getAttribute('data-faze-gallery-image');
    if (source) {
      this.imageNode.src = source;
    }
    this.imageWrapperNode.appendChild(this.imageNode);
    this.wrapperNode.appendChild(this.imageWrapperNode);

    this.wrapperNode.appendChild(this.closeButtonNode);

    this.wrapperNode.appendChild(this.arrowsNodes.next);

    document.body.appendChild(this.wrapperNode);
  }

  bindArrows() {
    // Кнопка перелистывания назад
    this.arrowsNodes.prev.addEventListener('click', (event) => {
      event.preventDefault();

      this.index -= 1;
      if (this.index < 0) {
        this.index = this.totalImages - 1;
      }

      const source = this.activeNodes[this.index].getAttribute('data-faze-gallery-image');
      if (source) {
        this.imageNode.src = source;
      }
    });

    // Кнопка перелистывания вперед
    this.arrowsNodes.next.addEventListener('click', (event) => {
      event.preventDefault();

      this.index += 1;
      if (this.index >= this.totalImages) {
        this.index = 0;
      }

      const source = this.activeNodes[this.index].getAttribute('data-faze-gallery-image');
      if (source) {
        this.imageNode.src = source;
      }
    });
  }

  /**
   * Навешивание события на кнопку закрытия
   */
  bindCloseButton() {
    this.closeButtonNode.addEventListener('click', (event) => {
      event.preventDefault();

      this.wrapperNode.remove();
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
