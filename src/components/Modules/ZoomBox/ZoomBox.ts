/**
 * Плагин зумбокса
 *
 * Зумбокс предоставляющий возможность увеличения картинки по подобию известного плагина LightBox
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 11.01.2020
 */

import './ZoomBox.scss';
import Faze from '../../Core/Faze';
import '../../Core/Interfaces';

/**
 * Структура конфига
 *
 * Содержит:
 *   group - группа для разделения зумбоксов пользователем
 *   align - выравнивание увеличенного изображение
 *   showClose - показывать ли крестик закрытия
 *   showCaption - показывать ли подпись
 *   showArrow - показывать ли стрелки переключения
 *   callbacks
 *     beforeOpened - пользовательская функция, выполняющаяся до открытия
 *     afterOpened - пользовательская функция, выполняющаяся после открытия
 *     beforeChanged - пользовательская функция, выполняющаяся до переключения
 *     afterChanged - пользовательская функция, выполняющаяся после переключения
 */
interface Config {
  group: string;
  align: string;
  showClose: boolean;
  showCaption: boolean;
  showArrows: boolean;
  size?: FazeSize;
  callbacks: {
    beforeOpened?: () => void;
    afterOpened?: () => void;
    beforeChanged?: () => void;
    afterChanged?: () => void;
  };
}

/**
 * Структура основного объекта модуля, враппера содержащего все необходимые DOM элементы
 *
 * Содержит:
 *   node - DOM элемент самого враппера
 *   imageNode - DOM элемент изображения
 *   controlsNodes
 *     close - DOM элемент кнопки закрытия
 *     arrows
 *       next - DOM элемент стрелки переключения вперед
 *       prev - DOM элемент стрелки переключения назад
 */
interface WrapperData {
  node?: HTMLDivElement;
  imageNode?: HTMLImageElement;
  captionNode?: HTMLDivElement;
  controlsNodes: {
    close?: HTMLDivElement;
    arrows?: {
      prev?: HTMLDivElement;
      next?: HTMLDivElement;
    };
  };
}

class ZoomBox {
  // DOM элемент на который кликнули для вызова зумбокса
  callerNode: HTMLImageElement;

  // DOM элементы фотографий из которых надо составить галерею
  readonly callerNodes: HTMLImageElement[];

  // Конфиг с настройками
  readonly config: Config;

  // Время анимации открытия/закрытия/переключения
  readonly ANIMATION_TIME: number;

  // Паддинг и граница враппера
  readonly OFFSET: FazeSize;

  // Текущай размер вьюпорта
  readonly viewport: FazeSize;

  // Текущее положение и размер элемента
  currentPositionAndSize: FazePositionAndSize;

  // Текущее положение и размер миниатюры
  currentThumbnailPositionAndSize: FazePositionAndSize;

  // Текущай индекс
  currentIndex: number;

  // Массив с данными о вызванных инстансах
  wrapperData: WrapperData;

  constructor(node: HTMLImageElement, nodes: HTMLImageElement[] | null, config: Partial<Config>) {
    if (!nodes) {
      throw new Error('Не заданы объекты галереи');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      group: 'default',
      align: 'center',
      showClose: true,
      showArrows: true,
      showCaption: false,
      size: undefined,
      callbacks: {
        beforeOpened: undefined,
        afterOpened: undefined,
        beforeChanged: undefined,
        afterChanged: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.callerNode = node;
    this.callerNodes = nodes;
    this.wrapperData = {
      controlsNodes: {},
    };
    this.ANIMATION_TIME = 400;
    this.OFFSET = {width: 12, height: 12};
    this.currentIndex = Array.from(this.callerNodes).indexOf(this.callerNode);
    this.viewport = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    };

    // Вызов стандартных методов плагина
    this.initialize();
  }

  /**
   * Инициализация
   */
  async initialize(): Promise<void> {
    // Загружаем полное изображение
    const {imageNode, size} = await this.getFullImageSize(this.callerNode.dataset.fazeZoomboxImage || '');

    // Т.к. изображение уже получено, сразу добавляем его в общий объект с данными
    this.wrapperData.imageNode = imageNode;

    // Вызываем пользовательскую функцию
    if (typeof this.config.callbacks.beforeOpened === 'function') {
      try {
        this.config.callbacks.beforeOpened();
      } catch (error) {
        console.error('Ошибка исполнения пользовательского метода "beforeOpened":', error);
      }
    }

    // Открываем зумбокс
    this.open(size);

    // Навешивание событий происходит только после октрытия зумбокса
    this.bind();
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    // Навешиваем событие закрытия по нажатию на крестик
    if (this.config.showClose) {
      this.bindCloseButton();
    }

    // Навешиваем события стрелок
    if (this.config.showArrows && this.callerNodes.length > 1) {
      this.bindArrowsButtons();
    }

    // Навешиваем перетаскивание
    Faze.Helpers.bindDrag({
      node: this.wrapperData.node,
      callbacks: {
        beforeDrag: () => {
          // Убираем стили плавного смещения
          if (this.wrapperData.node) {
            this.wrapperData.node.style.transition = 'none';
          }
        },
        afterDrag: (data: any) => {
          if (this.wrapperData.node) {
            // Обновляем позицию
            this.currentPositionAndSize.position = {
              x: parseInt(this.wrapperData.node.style.left, 10),
              y: parseInt(this.wrapperData.node.style.top, 10),
            };

            // Проверяем, если позиция старта и конца равны, закрываем зумбокс
            if (Faze.Helpers.comparePositions(data.startPosition, this.currentPositionAndSize.position) && data.event.target === this.wrapperData.imageNode) {
              this.close();
            }

            // Возвращаем стили плавного смещения назад
            this.wrapperData.node.style.transition = 'width 0.5s, height 0.5s, left 0.5s, top 0.5s';
          }
        },
      },
    });
  }

  /**
   * Навешивание событий на кнопку закрытия
   */
  private bindCloseButton(): void {
    this.wrapperData.controlsNodes.close?.addEventListener('click', (event: Event) => {
      event.preventDefault();

      this.close();
    });
  }

  /**
   * Навешивание событий на кнопки стрелок для переключения изображений в галерее
   */
  private bindArrowsButtons(): void {
    // Следующая
    this.wrapperData.controlsNodes.arrows?.next?.addEventListener('click', () => {
      // Вызываем пользовательскую функцию
      if (typeof this.config.callbacks.beforeChanged === 'function') {
        try {
          this.config.callbacks.beforeChanged();
        } catch (error) {
          console.error('Ошибка исполнения пользовательского метода "beforeChanged":', error);
        }
      }

      // Инкрементируем индекс, и, если мы листаем последний слайд, то переключаемся на первый
      this.currentIndex += 1;
      if (this.currentIndex > this.callerNodes.length - 1) {
        this.currentIndex = 0;
      }

      // Изменяем текущую активную миниатюру, для возвращения в неё после закрытия
      this.change(this.currentIndex)
        .then(() => {
          // Вызываем пользовательскую функцию
          if (typeof this.config.callbacks.afterChanged === 'function') {
            try {
              this.config.callbacks.afterChanged();
            } catch (error) {
              console.error('Ошибка исполнения пользовательского метода "afterChanged":', error);
            }
          }
        });
    });

    // Предыдущая
    this.wrapperData.controlsNodes.arrows?.prev?.addEventListener('click', () => {
      // Вызываем пользовательскую функцию
      if (typeof this.config.callbacks.beforeChanged === 'function') {
        try {
          this.config.callbacks.beforeChanged();
        } catch (error) {
          console.error('Ошибка исполнения пользовательского метода "beforeChanged":', error);
        }
      }

      // Декрементируем индекс, и, если мы листаем первый слайд, то переключаем на последний
      this.currentIndex -= 1;
      if (this.currentIndex < 0) {
        this.currentIndex = this.callerNodes.length - 1;
      }

      // Изменяем текущую активную миниатюру, для возвращения в неё после закрытия
      this.change(this.currentIndex)
        .then(() => {
          // Вызываем пользовательскую функцию
          if (typeof this.config.callbacks.afterChanged === 'function') {
            try {
              this.config.callbacks.afterChanged();
            } catch (error) {
              console.error('Ошибка исполнения пользовательского метода "afterChanged":', error);
            }
          }
        });
    });
  }

  /**
   * Изменение текущего изображения
   * @param index - Индекс изображения на которое надо поменять
   */
  async change(index: number): Promise<void> {
    // Изминяем активную миниатюру
    this.changeActiveThumbnail(index);

    // Получаем новое изображение
    const {imageNode, size} = await this.getFullImageSize(this.callerNode.dataset.fazeZoomboxImage || '');

    // Изменяем изображение
    if (this.wrapperData.imageNode) {
      this.wrapperData.imageNode.src = imageNode.src;
    }

    // Включаем анимацию изменения
    if (this.wrapperData.node) {
      Faze.Animations.animatePositionAndSize({
        node: this.wrapperData.node,
        from: this.currentPositionAndSize,
        to: this.getFullImagePositionAndSize(size),
        time: this.ANIMATION_TIME + 200,
      }).then((positionAndSize: FazePositionAndSize) => {
        // Обновляем текущие данные
        this.currentPositionAndSize = positionAndSize;
      });
    }
  }

  /**
   * Изменение активной миниатюры, для возвращения в неё в случае закрытия зумбокса
   * @param index - Индекс миниатюры в массиве
   */
  private changeActiveThumbnail(index: number): void {
    // Отображаем текущай
    this.callerNode.style.visibility = 'visible';

    // Заменяем его на новый
    this.callerNode = this.callerNodes[index];

    // Скрываем новый
    // Отображаем текущай
    this.callerNode.style.visibility = 'hidden';

    // Записываем текущее положение и размеры миниатюры
    this.currentThumbnailPositionAndSize = Faze.Helpers.getElementPositionAndSize(this.callerNode);
  }

  /**
   * Создание галереи
   */
  open(size: FazeSize): void {
    this.build(size);
  }

  /**
   * Построение DOM элементов для работы
   */
  build(size: FazeSize): void {
    // DOM элемент основного враппера, содержащего изображение и элементы управления
    const wrapperNode = document.createElement('div');
    wrapperNode.className = 'faze-zoombox-wrapper';
    this.wrapperData.node = wrapperNode;

    // Если необходимо, создаём кнопку закрытия
    if (this.config.showClose) {
      this.buildCloseButton();
    }

    // Если необходимо создаем кнопки переключения
    if (this.config.showArrows && this.callerNodes.length > 1) {
      this.buildArrows();
    }

    // Скрываем миниатюру
    this.callerNode.style.visibility = 'hidden';

    // Добавляем DOM элемент изображения в враппер
    if (this.wrapperData.imageNode) {
      wrapperNode.appendChild(this.wrapperData.imageNode);
    }

    // Построение подписи
    this.buildCaption();

    // Записываем текущее положение и размеры миниатюры
    this.currentThumbnailPositionAndSize = Faze.Helpers.getElementPositionAndSize(this.callerNode, {width: 12, height: 12}, {x: 6, y: 6});

    // Добавляем враппер на страницу
    document.body.appendChild(wrapperNode);

    // Финальные размеры и позиция картинки
    const fullImagePositionAndSize = this.getFullImagePositionAndSize(size);

    Faze.Animations.animatePositionAndSize({
      node: this.wrapperData.node,
      from: this.currentThumbnailPositionAndSize,
      to: fullImagePositionAndSize,
      time: this.ANIMATION_TIME + 200,
    }).then((positionAndSize: FazePositionAndSize) => {
      // Обновляем текущие данные
      this.currentPositionAndSize = positionAndSize;
    });
  }

  /**
   * Построение DOM для подписи
   */
  private buildCaption(): void {
    this.wrapperData.captionNode = document.createElement('div');
    this.wrapperData.captionNode.className = 'faze-zoombox-caption';
    this.wrapperData.captionNode.innerHTML = this.callerNode.dataset.fazeZoomboxCaption || '';
    this.wrapperData.node?.appendChild(this.wrapperData.captionNode);
  }

  /**
   * Определения позиции и размера изображения для нормального показа во вьюпорте
   *
   * @param size{FazeSize} - исходный размер изображения
   *
   * @return{FazePositionAndSize} - позиция и размер изображения
   */
  private getFullImagePositionAndSize(size: FazeSize): FazePositionAndSize {
    // Если по какой то причине враппер не создан до этого момента, возвращаем пустой результат
    if (!this.wrapperData.node) {
      return {
        position: {x: 0, y: 0},
        size: {width: 0, height: 0},
      };
    }

    // Финальные размеры картинки
    const finalSize: FazeSize = {width: 0, height: 0};

    // Финальное положение картинки
    const finalPosition: FazePosition = {x: 0, y: 0};

    // Отступы у body страницы
    const bodyPadding: FazeSize = {
      width: parseInt(window.getComputedStyle(document.body).paddingLeft, 10),
      height: parseInt(window.getComputedStyle(document.body).paddingRight, 10),
    };

    // Высота подписи
    const captionHeight = this.getCaptionHeight();

    // Проставляем паддинг снизу у враппера, чтобы подпись оказалась внутри
    this.wrapperData.node.style.paddingBottom = `${parseInt(window.getComputedStyle(this.wrapperData.node).paddingBottom, 10) + captionHeight}px`;

    // Если пользователь указал размер, используем его, иначе делаем рассчёт
    if (this.config.size) {
      finalSize.width = this.config.size.width;
      finalSize.height = this.config.size.height;
    } else {
      // Картинка сплюснута по высоте относительно вьюпорта, т.е. картинка вытянута в длинну сильнее страницы значит ограничиваем ширину
      // картинки, высота точно влезет
      if (size.width / size.height > this.viewport.width / this.viewport.height) {
        finalSize.width = Math.min(this.viewport.width, size.width);
        finalSize.height = finalSize.width * size.height / size.width;
      } else {
        // Картинка сплюснута по ширине относительно вьюпорта, т.е. страница вытянута в длину сильнее картинки значит ограничиваем высоту
        // картинки, ширина точно влезет
        finalSize.height = Math.min(this.viewport.height, size.height);
        finalSize.width = finalSize.height * size.width / size.height;
      }
    }

    // Варианты конечной позиции увеличенного изображения, в зависимости от выравнивания используются соответствующие значения
    const positionVariations = {
      x: {
        center: bodyPadding.width + this.viewport.width / 2 - finalSize.width / 2,
        self: this.currentThumbnailPositionAndSize.position.x - (finalSize.width - this.currentThumbnailPositionAndSize.size.width) / 2,
        left: bodyPadding.width,
        right: this.viewport.width - finalSize.width,
      },
      y: {
        center: window.pageYOffset + this.viewport.height / 2 - finalSize.height / 2,
        self: this.currentThumbnailPositionAndSize.position.y - (finalSize.height - this.currentThumbnailPositionAndSize.size.height) / 2,
        top: window.pageYOffset,
        bottom: window.pageYOffset + this.viewport.height - finalSize.height,
      },
    };

    // Выбор нужной позиции относительно выбранного выравнивания
    switch (this.config.align) {
      case 'center':
        finalPosition.x = positionVariations.x.center;
        finalPosition.y = positionVariations.y.center;
        break;
      case 'left top':
        finalPosition.x = positionVariations.x.left;
        finalPosition.y = positionVariations.y.top;
        break;
      case 'center top':
        finalPosition.x = positionVariations.x.center;
        finalPosition.y = positionVariations.y.top;
        break;
      case 'right top':
        finalPosition.x = positionVariations.x.right;
        finalPosition.y = positionVariations.y.top;
        break;
      case 'right center':
        finalPosition.x = positionVariations.x.right;
        finalPosition.y = positionVariations.y.center;
        break;
      case 'right bottom':
        finalPosition.x = positionVariations.x.right;
        finalPosition.y = positionVariations.y.bottom;
        break;
      case 'center bottom':
        finalPosition.x = positionVariations.x.center;
        finalPosition.y = positionVariations.y.bottom;
        break;
      case 'left bottom':
        finalPosition.x = positionVariations.x.left;
        finalPosition.y = positionVariations.y.bottom;
        break;
      case 'left center':
        finalPosition.x = positionVariations.x.left;
        finalPosition.y = positionVariations.y.center;
        break;
      case 'self':
      default:
        finalPosition.x = positionVariations.x.self;
        finalPosition.y = positionVariations.y.self;
    }

    // Коррекция значений, для предотвращения выхода за границы вьюпорта
    if (finalPosition.x <= 0) {
      finalPosition.x = positionVariations.x.left;
    } else if (finalPosition.x > positionVariations.x.right) {
      finalPosition.x = positionVariations.x.right;
    }
    if (finalPosition.y <= 0) {
      finalPosition.y = positionVariations.y.top;
    } else if (finalPosition.y > positionVariations.y.bottom) {
      finalPosition.y = positionVariations.y.bottom;
    }

    return {
      size: finalSize,
      position: finalPosition,
    };
  }

  /**
   * Получение полной высоты DOM элемента подписи
   */
  private getCaptionHeight(): number {
    // Изначально высота равна нулю, т.к. DOM Элемента может в принципе не существовать
    let height = 0;

    // Если есть DOM элемент подписи, вычисляем её полную высоту
    if (this.wrapperData.captionNode) {
      const calculatedStyles: CSSStyleDeclaration = window.getComputedStyle(this.wrapperData.captionNode);

      height = parseInt(calculatedStyles.marginTop, 10) + parseInt(calculatedStyles.marginBottom, 10) + this.wrapperData.captionNode.offsetHeight;
    }

    return height;
  }

  /**
   * Создание стрелок переключения изображений
   */
  private buildArrows(): void {
    // Создаём объект для хранения стрелок
    this.wrapperData.controlsNodes.arrows = {};

    // Стрелка "Следующая"
    this.wrapperData.controlsNodes.arrows.next = document.createElement('div');
    this.wrapperData.controlsNodes.arrows.next.className = 'faze-zoombox-arrow faze-zoombox-arrow-next';
    this.wrapperData.node?.appendChild(this.wrapperData.controlsNodes.arrows.next);

    // Стрелка "Предыдущая"
    this.wrapperData.controlsNodes.arrows.prev = document.createElement('div');
    this.wrapperData.controlsNodes.arrows.prev.className = 'faze-zoombox-arrow faze-zoombox-arrow-prev';
    this.wrapperData.node?.appendChild(this.wrapperData.controlsNodes.arrows.prev);
  }

  /**
   * Создание кнопки закрытия
   */
  private buildCloseButton(): void {
    this.wrapperData.controlsNodes.close = document.createElement('div');
    this.wrapperData.controlsNodes.close.className = 'faze-zoombox-close';

    this.wrapperData.node?.appendChild(this.wrapperData.controlsNodes.close);
  }

  /**
   * Закрытие зумбокса, анимация возвращения картинки в миниатюру
   */
  private close(): void {
    if (this.wrapperData.node) {
      Faze.Animations.animatePositionAndSize({
        node: this.wrapperData.node,
        from: this.currentPositionAndSize,
        to: this.currentThumbnailPositionAndSize,
        time: this.ANIMATION_TIME + 200,
      }).then((positionAndSize: FazePositionAndSize) => {
        // Обновляем данные текущие данные
        this.currentPositionAndSize = positionAndSize;

        // Очищаем данные врамера и удаляем его
        this.clearWrapperData();

        // Возвращаем видимость миниатюры
        this.callerNode.style.visibility = 'visible';
      });
    }
  }

  /**
   * Очистка данных враппера. Удаление всех DOM элементов и обнуление значений
   */
  private clearWrapperData(): void {
    this.wrapperData.node?.remove();
    this.wrapperData = {
      controlsNodes: {},
    };
  }

  /**
   * Определяет размеры изображения, предварительно загружая его
   * @param source - Путь до изображения
   * @returns{Promise<FazeSize>} - Промис возвращающий размеры изображения(ширина, высота)
   */
  private getFullImageSize(source: string): Promise<{ imageNode: HTMLImageElement, size: FazeSize }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = source;
      image.className = 'faze-zoombox-image';
      image.onload = () => resolve({imageNode: image, size: {width: image.width, height: image.height}});
      image.onerror = reject;
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    // Задаем всем элементам без группы стандартную
    document.querySelectorAll<HTMLElement>('[data-faze~="zoombox"]').forEach((callerNode: HTMLElement) => {
      callerNode.classList.add('faze-zoombox-caller');
    });

    Faze.on('click', '[data-faze~="zoombox"]', (event: Event, callerNode: HTMLElement) => {
      const group: string | undefined = callerNode.dataset.fazeZoomboxGroup;
      const align: string = callerNode.dataset.fazeZoomboxAlign || 'self';
      let size: FazeSize | undefined = undefined;
      if (callerNode.dataset.fazeZoomboxWidth && callerNode.dataset.fazeZoomboxHeight) {
        size = {
          width: parseInt(callerNode.dataset.fazeZoomboxWidth || '0', 10),
          height: parseInt(callerNode.dataset.fazeZoomboxHeight || '0', 10),
        };
      }

      // DOM элементы той же группы
      const callerNodes = group ? document.querySelectorAll(`[data-faze-zoombox-group="${group}"]`) : [];

      new Faze.ZoomBox(callerNode, callerNodes, {
        group,
        align,
        size,
      });
    });
  }
}

export default ZoomBox;
