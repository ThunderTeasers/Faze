/**
 * Плагин селекта
 *
 * Зумбокс предоставляющий возможность увеличения картинки по подобию известного плагина LightBox
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 11.01.2020
 */

import './ZoomBox.scss';
import Faze from '../Core/Faze';
import '../Core/Interfaces';

/**
 * Структура конфига
 *
 * Содержит:
 *   group - группа для разделения зумбоксов пользователем
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
  showClose: boolean;
  showCaption: boolean;
  showArrows: boolean;
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
      showClose: true,
      showArrows: true,
      showCaption: false,
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
    this.ANIMATION_TIME = 500;
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
    if (this.config.showClose) {
      this.bindCloseButton();
    }

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
        afterDrag: () => {
          if (this.wrapperData.node) {
            // Обновляем позицию
            this.currentPositionAndSize.position = {
              x: parseInt(this.wrapperData.node.style.left, 10),
              y: parseInt(this.wrapperData.node.style.top, 10),
            };

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
      this.animate(this.wrapperData.node, this.currentPositionAndSize, this.getFullImagePositionAndSize(size));
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

    // Записываем текущее положение и размеры миниатюры
    this.currentThumbnailPositionAndSize = Faze.Helpers.getElementPositionAndSize(this.callerNode);

    // Финальные размеры и позиция картинки
    const fullImagePositionAndSize = this.getFullImagePositionAndSize(size);

    // Добавляем враппер на страницу
    document.body.appendChild(wrapperNode);

    // Анимируем открытие
    this.animate(this.wrapperData.node, this.currentThumbnailPositionAndSize, fullImagePositionAndSize);
  }

  /**
   * Определения позиции и размера изображения для нормального показа во вьюпорте
   *
   * @param size{FazeSize} - Исходный размер изображения
   * @param align{string} - Выравнивание
   *
   * @return{FazePositionAndSize} - Позиция и размер изображения
   */
  private getFullImagePositionAndSize(size: FazeSize, align: string = 'center'): FazePositionAndSize {
    // Финальные размеры картинки
    const finalSize: FazeSize = {width: 0, height: 0};

    // Финальное положение картинки
    const finalPosition: FazePosition = {x: 0, y: 0};

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

    const positionVariations = {
      x: {
        center: this.viewport.width / 2 - finalSize.width / 2,
        self: this.currentThumbnailPositionAndSize.position.x - (finalSize.width - this.currentThumbnailPositionAndSize.size.width) / 2,
        left: 0,
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
    switch (align) {
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
      this.animate(this.wrapperData.node, this.currentPositionAndSize, this.currentThumbnailPositionAndSize, () => {
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
   * Анимация изменения позиции и размеров элемента, с возможность последующего вызова пользовательской функции
   * @param node{HTMLElement} - DOM элемент который изменяем
   * @param from{FazePositionAndSize} - позиция и размеры с которых начинается анимация
   * @param to{FazePositionAndSize} - позиция и размеры до которых должна происходить анимация
   * @param afterAnimationCollback{() => void | undefined} - коллбек вызываемый после анимации
   */
  private animate(node: HTMLElement, from: FazePositionAndSize, to: FazePositionAndSize, afterAnimationCollback?: () => void): void {
    // Задаём первичные данные от которых идет анимация
    Faze.Helpers.setElementStyle(node, {
      top: `${from.position.y}px`,
      left: `${from.position.x}px`,
      width: `${from.size.width}px`,
      height: `${from.size.height}px`,
    });

    // Ставим в стек увеличение враппера до номрального состояния
    setTimeout(() => {
      // Задаём первичные данные от которых идет анимация
      Faze.Helpers.setElementStyle(node, {
        top: `${to.position.y}px`,
        left: `${to.position.x}px`,
        width: `${to.size.width}px`,
        height: `${to.size.height}px`,
      });
    }, 100);

    // Если пользовательская функция существует, исполняем её, но с небольшой задержкой в 200 миллисекунд
    if (typeof afterAnimationCollback === 'function') {
      setTimeout(() => {
        afterAnimationCollback();
      }, this.ANIMATION_TIME + 200);
    }

    // Записываем текущую позицию враппера, как ту к которой должны прийти
    this.currentPositionAndSize = to;
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

      if (!callerNode.dataset.fazeZoomboxGroup) {
        callerNode.dataset.fazeZoomboxGroup = 'default';
      }
    });

    Faze.on('click', '[data-faze~="zoombox"]', (event: Event, callerNode: HTMLElement) => {
      const group: string | undefined = callerNode.dataset.fazeZoomboxGroup;
      const callerNodes = document.querySelectorAll(`[data-faze-zoombox-group="${group}"]`);

      new Faze.ZoomBox(callerNode, callerNodes, {
        group,
      });
    });
  }
}

export default ZoomBox;
