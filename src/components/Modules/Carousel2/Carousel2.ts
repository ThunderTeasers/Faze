/**
 * Плагин карусели
 *
 * Автор: Ерохин Максим
 * Дата: 29.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Carousel
 */

import './Carousel2.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Направление движения
 */
enum FazeCarouselMoveDirection {
  Forward,
  Backward,
}

/**
 * Структура возвращаемого объекта в пользовательских функциях
 *
 * Содержит:
 *   holderNode   - DOM элемент содержащий слайды
 *   carouselNode - DOM элемент в котором находится всё, что относится карусели
 *   slidesNodes  - DOM элементы слайдов
 *   controlsNode - DOM элемент родителя всех управляющих элементов карусели
 *   pagesNode    - DOM элемент пагинации слайдов
 *   arrowsNode   - DOM элемент родителя стрелок
 *   arrowsNodes  - DOM элементы стрелок, не путать с arrowsNode
 *   counterNode  - DOM элемент счетчика слайдов
 *   totalSlides  - общее число слайдов
 *   index        - индекс активного слайда
 *   direction    - направление карусели(может быть "vertical" и "horizontal")
 *   currentSlideNode - DOM элемент активного слайда
 */
interface CallbackData {
  holderNode: HTMLElement;
  carouselNode: HTMLElement;
  slidesNodes: HTMLElement[];
  controlsNode?: HTMLElement;
  pagesNode?: HTMLElement;
  arrowsNode?: HTMLElement;
  arrowsNodes?: {
    left: HTMLElement;
    right: HTMLElement;
  };
  counterNode?: HTMLElement;
  totalSlides: number;
  index: number;
  direction?: string;
  currentSlideNode: HTMLElement | null;
}

/**
 * Структура конфига карусели
 *
 * Содержит:
 *   autoplay   - флаг автовоспроизведения карусели
 *   counter    - отображать ли счетчик слайдов
 *   pages      - отображать ли пагинацию слайдов
 *   arrows     - отображать ли стрелки переключения
 *   duration   - время смены слайдов, в мс.
 *   infinite   - флаг бесконечной прокрутки
 *   useSlideFullSize - учитывать ли при измерении размера слайда его margin
 *   stopOnHover - флаг остановки ли при наведении
 *   amountPerSlide - количества слайдов перелистываемых за один раз
 *   mouseMove - можно ли двигать слайды курсором
 *   offsetChange - % ширины слайда который нужно передвинуть пальцем/мышкой, чтобы произошло изменение
 *   animation
 *     type     - тип анимации, может быть: 'slide', 'fade'
 *     time     - длительность анимации в миллисекундах
 *     direction - направление смены слайдов, может быть: 'vertical', 'horizontal'. Используется только для анимации 'slide'
 *   selectors     - CSS селекторы для переопределения элементов управления
 *     arrowLeft   - CSS селектор кнопки пролистывания влево
 *     arrowRight  - CSS селектор кнопки пролистывания вправо
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся при создании карусели
 *     beforeChanged - пользовательская функция, исполняющаяся перед началом изменения слайда
 *     changed  - пользовательская функция, исполняющаяся при изменении слайда
 */
interface Config {
  autoplay: boolean;
  counter: boolean;
  pages: boolean;
  arrows: boolean;
  duration: number;
  infinite: boolean;
  useSlideFullSize: boolean;
  stopOnHover: boolean;
  amountPerSlide: number;
  mouseMove: boolean;
  touchMove: boolean;
  offsetChange: number;
  disallowRanges: FazeDisallowRange[];
  minAmount: number;
  templates: {
    page: string;
  };
  animation: {
    type: string;
    time: number;
    direction: string;
    function: string;
  };
  selectors: {
    arrowLeft?: string;
    arrowRight?: string;
    counter?: string;
  };
  callbacks: {
    created?: (data: CallbackData) => void;
    beforeChanged?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    afterChanged?: (data: CallbackData) => void;
  };
}

/**
 * Структура возвращаемого объекта в пользовательских функциях
 *
 * Содержит:
 *   holderNode   - DOM элемент содержащий слайды
 *   carouselNode - DOM элемент в котором находится всё, что относится карусели
 *   slidesNodes  - DOM элементы слайдов
 *   controlsNode - DOM элемент родителя всех управляющих элементов карусели
 *   pagesNode    - DOM элемент пагинации слайдов
 *   arrowsNode   - DOM элемент родителя стрелок
 *   arrowsNodes  - DOM элементы стрелок, не путать с arrowsNode
 *   counterNode  - DOM элемент счетчика слайдов
 *   totalSlides  - общее число слайдов
 *   index        - индекс активного слайда
 *   direction    - направление карусели(может быть "vertical" и "horizontal")
 *   currentSlideNode - DOM элемент активного слайда
 */
// interface CallbackData {
//   holderNode: HTMLElement;
//   carouselNode: HTMLElement;
//   slidesNodes: HTMLElement[];
//   controlsNode?: HTMLElement;
//   pagesNode?: HTMLElement;
//   arrowsNode?: HTMLElement;
//   arrowsNodes?: {
//     left: HTMLElement;
//     right: HTMLElement;
//   };
//   counterNode?: HTMLElement;
//   totalSlides: number;
//   index: number;
//   direction?: string;
//   currentSlideNode: HTMLElement | null;
// }

class Carousel2 extends Module {
  // DOM элменты слайдов
  private slidesNodes: HTMLElement[];

  // DOM элемент который содержит все
  private itemsHolderNode: HTMLElement;

  // DOM элемент который содержит все дополнительные части карусели(пагинацию, стрелки, счетчик)
  private controlsNode: HTMLElement;

  // DOM элемент содержащий стрелки переключения слайдов
  private arrowsNode: HTMLElement;

  // DOM элемент содержащий пагинацию по слайдам
  private pagesNode: HTMLElement;

  // DOM элементы содержащие страницы пагинации
  private pagesNodes: HTMLElement[];

  // DOM элемент счетчика слайдов
  private counterNode: HTMLElement;

  // DOM Элемент текущего слайда
  private currentSlide: HTMLElement;

  // DOM элементы стрелок переключения слайдов
  private arrowsNodes: {
    left: HTMLElement;
    right: HTMLElement;
  };

  // Текущий индекс слайда
  private index: number;

  // Счётчик для сдвига слайдов
  private counter: number;

  // Сдвиг карусели при прокрутке
  private offset: number;

  // Простаивает ли слайдер, взаимодействие возможно только если стоит "true"
  private isIdle: boolean;

  // Общее количество слайдов
  private totalSlides: number;

  // Начало касания пальца
  private touchStart: FazePosition;

  // Конец касания пальца
  private touchEnd: FazePosition;

  // CSS стиль для плавности
  private transition: string;

  // Общая ширина слайдера
  private totalWidth: number;

  // Ширина слайда
  private slideWidth: number;

  // Высота слайда
  // private slideHeight: number;

  // Нужно ли инициализировать модуль
  private isNeedToInitialize: boolean;

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      autoplay: false,
      counter: false,
      pages: false,
      arrows: true,
      duration: 3000,
      infinite: true,
      useSlideFullSize: false,
      stopOnHover: false,
      mouseMove: false,
      touchMove: false,
      offsetChange: 50,
      amountPerSlide: 1,
      minAmount: 2,
      disallowRanges: [],
      templates: {
        page: '',
      },
      animation: {
        type: 'fade',
        time: 1000,
        direction: 'horizontal',
        function: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      selectors: {
        arrowLeft: undefined,
        arrowRight: undefined,
        counter: undefined,
      },
      callbacks: {
        created: undefined,
        beforeChanged: undefined,
        changed: undefined,
        afterChanged: undefined,
      },
    };

    // Инициализация модуля
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Carousel2',
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // ===========================================
    // Инициализация переменных
    // ===========================================
    this.slidesNodes = <HTMLElement[]>Array.from(this.node.children);
    this.totalSlides = this.slidesNodes.length;
    this.itemsHolderNode = document.createElement('div');
    this.controlsNode = document.createElement('div');
    this.index = 0;
    this.offset = 0;
    this.counter = 0;
    this.isIdle = true;
    this.transition = `transform ${this.config.animation.time / 1000}s ${this.config.animation.function}`;
    this.isNeedToInitialize = !(this.totalSlides < this.config.minAmount);

    // Проверка на минимальное количество
    if (!this.isNeedToInitialize) {
      return;
    }

    super.initialize();

    // Инициализируем стрелки
    this.initializeArrows();

    this.touchStart = {
      x: 0,
      y: 0,
    };

    this.touchEnd = {
      x: 0,
      y: 0,
    };

    // Для пагинации
    this.initializePagination();

    // Для счётчика
    this.initializeCounter();

    // ===========================================
    // Инициализация работы модуля
    // ===========================================
    // Проставляем необходимые классы
    this.node.classList.add(
      `faze-animation-${this.config.animation.type}`,
      `faze-direction-${this.config.animation.direction}`
    );
    this.itemsHolderNode.className = 'faze-carousel-holder';
    this.itemsHolderNode.style.transition = this.transition;

    // Инициализируем слайды
    this.initializeSlides();

    // Добавляем враппер слайдов в карусель
    this.node.appendChild(this.itemsHolderNode);

    // Обновляем размеры текущего слайда
    this.updateCurrentSlideSizes();

    // Обновляем позиции слайдов
    this.updateSlidesOffset();

    // ===========================================
    // Выполнение пользовательской функции
    // ===========================================
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          holderNode: this.itemsHolderNode,
          carouselNode: this.node,
          slidesNodes: this.slidesNodes,
          totalSlides: this.totalSlides,
          index: this.index,
          controlsNode: this.controlsNode,
          counterNode: this.counterNode,
          arrowsNode: this.arrowsNode,
          arrowsNodes: this.arrowsNodes,
          pagesNode: this.pagesNode,
          currentSlideNode: this.slidesNodes[this.index],
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "created": ${error}`
        );
      }
    }
  }

  /**
   * Инициализация пагинации
   *
   * @private
   */
  private initializePagination(): void {
    if (this.config.pages) {
      this.pagesNode = document.createElement('div');
    }
  }

  /**
   * Инициализация слайдов и добавления их в враппер
   *
   * @private
   */
  private initializeSlides(): void {
    this.slidesNodes.forEach((slideNode: HTMLElement, slideIndex: number) => {
      // Необходимо для соединения между "пагинацией" и самими слайдами
      slideNode.dataset.fazeIndex = slideIndex.toString();

      // Проставляем класс
      slideNode.classList.add('faze-item');

      // Первому слайду ставим класс активного
      if (slideIndex === 0) {
        this.currentSlide = slideNode;
        slideNode.classList.add('faze-active');
      }

      // Перевещаем слайд в родителя
      this.itemsHolderNode.appendChild(slideNode);
    });
  }

  /**
   * Инициализация счётчика
   *
   * @private
   */
  private initializeCounter(): void {
    // Для счетчика
    if (this.config.counter) {
      if (this.config.selectors.counter) {
        const counterNode = document.querySelector<HTMLElement>(
          this.config.selectors.counter
        );
        if (counterNode) {
          this.counterNode = counterNode;
        }
      } else {
        this.counterNode = document.createElement('div');
      }
    }
  }

  /**
   * Инициализация стрелок
   *
   * @private
   */
  private initializeArrows(): void {
    // Для стрелок
    if (this.config.arrows) {
      // DOM элемент содержащий кнопки переключения
      this.arrowsNode = document.createElement('div');

      // Проверка на присутствие кастомных стрелок
      if (this.config.selectors.arrowLeft && this.config.selectors.arrowRight) {
        // DOM элементы стрелок управления
        const arrowLeftNode = document.querySelector<HTMLElement>(
          this.config.selectors.arrowLeft
        );
        const arrowRightNode = document.querySelector<HTMLElement>(
          this.config.selectors.arrowRight
        );

        // Если нашли кастомные стрелки, то задаём их
        if (arrowLeftNode && arrowRightNode) {
          if (!this.isNeedToInitialize) {
            arrowLeftNode.style.display = 'none';
            arrowRightNode.style.display = 'none';
          }

          this.arrowsNodes = {
            left: arrowLeftNode,
            right: arrowRightNode,
          };
        } else {
          this.config.arrows = false;
        }
      } else {
        this.arrowsNodes = {
          left: document.createElement('div'),
          right: document.createElement('div'),
        };
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    // Проверка на минимальное количество
    if (!this.isNeedToInitialize) {
      return;
    }

    super.bind();

    // Навешиваем события на ресайз браузера
    this.bindResize();

    // Навешиваем события на переключения слайдов по нажатии на элементы пагинации
    if (this.config.pages) {
      this.bindPagination();
    }

    // Навешиваем события на переключение слайдов при нажатии на стрелки
    if (this.config.arrows) {
      this.bindArrows();
    }

    // Если анимация слайдов и разрешены движения мышью, то навешиваем
    if (this.config.animation.type === 'slide') {
      this.bindGestures();
    }

    // Если есть автоматическое воспроизведение, включаем его
    if (this.config.autoplay) {
      this.bindAutoplay();
    }
  }

  /**
   * Навешиваем события на ресайз браузера
   *
   * @private
   */
  private bindResize() {
    Faze.Events.listener('resize', window, () => {
      this.updateCurrentSlideSizes();
      this.updateSlidesOffset();
    });
  }

  /**
   * Навешивание событий на автоматическую смену слайдов
   *
   * @private
   */
  private bindAutoplay() {
    window.setInterval(() => {
      this.next();
    }, this.config.duration);
  }

  /**
   * Навешивание событий на нажитие по страницам пагинации слайдов для их переключения
   *
   * @private
   */
  private bindPagination(): void {
    Faze.Events.forEach(
      'click',
      this.pagesNodes,
      (event: MouseEvent, pageNode: HTMLElement) => {
        const index: string | undefined = pageNode.dataset.fazeIndex;
        if (index) {
          this.change(parseInt(index, 10));
        }
      }
    );
  }

  /**
   * Навешивание событий на нажатие стрелок для переключения слайдов
   *
   * @private
   */
  private bindArrows(): void {
    // Стрелка влево
    Faze.Events.click(this.arrowsNodes.left, () => {
      if (!this.arrowsNodes.left.classList.contains('faze-disabled')) {
        this.prev();
      }
    });

    // Стрелка вправо
    Faze.Events.click(this.arrowsNodes.right, () => {
      if (!this.arrowsNodes.right.classList.contains('faze-disabled')) {
        this.next();
      }
    });
  }

  /**
   * Отслеживание события нажатия пальцем или мышью на область карусели
   *
   * @param event{MouseEvent | TouchEvent} Событие нажатия мышью или пальцем
   * @param isDown{boolean} Было ли события нажатия до этого момента, если нет, то метод не выполняется
   *
   * @private
   */
  private mouseOrTouchDown(
    event: MouseEvent | TouchEvent,
    isDown: boolean
  ): boolean {
    // Если мы выводили мышку из окна браузера, то "isDown" останется в положении "true"
    // и мы должны вернуть его в таком же виде, чтобы сработали эвенты на отпускание мыши
    if (isDown) {
      return true;
    }

    if (
      Faze.Helpers.isMouseOver(event, this.node).contains &&
      !Faze.Helpers.isMouseOverlapsNode(event, this.controlsNode) &&
      event
        .composedPath()
        .some(
          (node: any) =>
            'classList' in node && node.classList.contains('faze-item')
        ) &&
      this.isIdle
    ) {
      // Отключаем стандартное перетаскивание
      event.preventDefault();

      this.itemsHolderNode.style.transition = '';

      // Получаем координаты касания/нажатия
      this.touchStart = Faze.Helpers.getMouseOrTouchPosition(event);

      // Ставим флаг, что карусель не бездействует
      this.isIdle = false;

      return true;
    }

    return false;
  }

  /**
   * Передвижение мыши или движение пальцем
   *
   * @param event{MouseEvent | TouchEvent} Событие мыши или пальца
   * @param isDown{boolean} Было ли события нажатия до этого момента, если нет, то метод не выполняется
   *
   * @private
   */
  private mouseOrTouchMove(
    event: MouseEvent | TouchEvent,
    isDown: boolean
  ): void {
    // Если не было нажатия, то не выполняем метод
    if (!isDown) {
      return;
    }

    // Получаем координаты касания/нажатия
    this.touchEnd = Faze.Helpers.getMouseOrTouchPosition(event);

    // Вычисляем сдвиг и двигаем весь враппер на это число вбок
    const offset = -(this.touchStart.x - this.touchEnd.x) + this.offset;
    this.itemsHolderNode.style.transform = `translate(${offset}px, 0)`;

    // Проверяем выход за границы
    if (offset > this.offset + this.slideWidth) {
      this.itemsHolderNode.style.transform = `translate(${this.offset + this.slideWidth
        }px, 0)`;
    } else if (offset < this.offset - this.slideWidth) {
      this.itemsHolderNode.style.transform = `translate(${this.offset - this.slideWidth
        }px, 0)`;
    }
  }

  /**
   * Отпускание мыши или пальца, в данном методе происходит вся основная работа по переключению слайда, т.к. необходимо определить,
   * преодолел ли слайд половину своей ширины/высоты для переключения. Если да, то изменяем его на следующий/предыдущий, если нет, то
   * необходимо вернуть всё как было до начала движения
   *
   * @param event{MouseEvent | TouchEvent} Событие мыши или пальца
   * @param isDown{boolean} Было ли события нажатия до этого момента, если нет, то метод не выполняется
   *
   * @private
   */
  private async mouseOrTouchUp(
    event: MouseEvent | TouchEvent,
    isDown: boolean
  ): Promise<void> {
    if (!isDown) {
      return;
    }

    // Возвращаем CSS анимацию
    this.itemsHolderNode.style.transition = this.transition;

    // Получаем координаты касания/нажатия
    this.touchEnd = Faze.Helpers.getMouseOrTouchPosition(event);

    // Вычисляем сдвиг и двигаем весь враппер на это число вбок
    const offset = -(this.touchStart.x - this.touchEnd.x);

    // Нужно ли замораживать сдвиг
    let isFreeze = false;

    // На какое количество достаточно сдвинуть слайд для изменения
    const offsetChange = this.slideWidth * (this.config.offsetChange / 100);

    // Производим работу с перетаскиванием
    // Если сдвинуто влево больше чем на пол слайда, то активируем следующий слайд
    if (offset < -offsetChange) {
      // Обновляем индекс
      this.index += 1;
      this.counter += 1;
      this.checkIndex();
      this.checkCounter();

      // Если это крайние слайды с переходом
      if (this.counter === 0) {
        isFreeze = true;
        this.offset = offset;
      }

      // Меняем слайд
      this.updateSlides(FazeCarouselMoveDirection.Forward, 1, isFreeze);
    } else if (offset > offsetChange) {
      // Обновляем индекс
      this.index -= 1;
      this.counter -= 1;
      this.checkIndex();
      this.checkCounter();

      // Если это крайние слайды с переходом
      if (this.counter === 0 || this.counter === -1) {
        isFreeze = true;
        this.offset = offset;
      }

      // Меняем слайд
      this.updateSlides(FazeCarouselMoveDirection.Backward, 1, isFreeze);
    } else {
      // Возвращаем слайд в исходное состояние и после этого разрешаем дальнейшее взаимодействие
      await this.moveSlide();

      this.isIdle = true;
    }
  }

  /**
   * Возвращает действия разрешенные для взаимодействия при помощи жестов
   *
   * @returns [actionsStart, actionsMove, actionsEnd], где "actionsStart" - начальные действия, "actionsMove" - действия при движении, "actionsEnd" - конечные действия
   */
  private getGesturesActions() {
    // Действия
    const actionsStart = [];
    const actionsMove = [];
    const actionsEnd = [];

    // Если разрешено двигать мышкой
    if (this.config.mouseMove) {
      actionsStart.push('mousedown');
      actionsMove.push('mousemove');
      actionsEnd.push('mouseup');
    }

    // Если разрешено двигать пальцем
    if (this.config.touchMove) {
      actionsStart.push('touchstart');
      actionsMove.push('touchmove');
      actionsEnd.push('touchend');
    }

    return [actionsStart, actionsMove, actionsEnd];
  }

  /**
   * Навешивание событий для отслеживания жестов
   *
   * @private
   */
  private bindGestures(): void {
    // Флаг показывающий нажатие, для отслеживания движения внутри
    let isDown = false;

    // Получаем разрешенные действия
    const [actionsStart, actionsMove, actionsEnd] = this.getGesturesActions();

    // При нажатии на враппер для слайдов ставим флаг, что можно отслеживать движение
    Faze.Events.listener(
      actionsStart,
      document.body,
      (event: MouseEvent) => {
        isDown = this.mouseOrTouchDown(event, isDown);
      },
      false
    );

    // Отслеживаем движение, если находимся внутри враппера слайдов
    Faze.Events.listener(
      actionsMove,
      document.body,
      (event: MouseEvent) => {
        this.mouseOrTouchMove(event, isDown);
      },
      false
    );

    // Убираем флаг нажатия в любом случае при отпускании мыши
    Faze.Events.listener(
      actionsEnd,
      document.body,
      (event: MouseEvent) => {
        this.mouseOrTouchUp(event, isDown);
        isDown = false;
      },
      false
    );
  }

  /**
   * Построение необходимых DOM элементов
   */
  build(): void {
    // Проверка на минимальное количество
    if (!this.isNeedToInitialize) {
      return;
    }

    super.build();

    this.buildControls();
  }

  /**
   * Создание дополнительных элементов карусели, таких как: пагинация, стрелки, счетчик
   */
  private buildControls(): void {
    if (this.config.arrows || this.config.pages || this.config.counter) {
      this.controlsNode.className = 'faze-carousel-controls';
      this.node.appendChild(this.controlsNode);

      // Создание стрелок переключения, если это указано в конфиге
      if (this.config.arrows) {
        this.buildArrows();
      }

      // Создание пагинации, если это указанов конфиге
      if (this.config.pages) {
        this.buildPagination();
      }

      // Создание счетчика, если это указано в конфиге
      if (this.config.counter) {
        this.buildCounter();
      }
    }
  }

  /**
   * Создание счетчика слайдов
   *
   * @private
   */
  private buildCounter(): void {
    this.counterNode.className = 'faze-carousel-counter';
    this.changeCounter();

    // Если у карусели есть стрелки, то вставляем между них
    if (
      this.config.arrows &&
      !(this.config.selectors.arrowLeft && this.config.selectors.arrowRight)
    ) {
      this.arrowsNode.insertBefore(this.counterNode, this.arrowsNodes.right);
    } else {
      this.controlsNode.appendChild(this.counterNode);
    }
  }

  /**
   * Создание пагинации по слайдам
   *
   * @private
   */
  private buildPagination(): void {
    if (!this.pagesNode) {
      this.logger.error('Родительский элемент пагинации не найден');
    }

    this.pagesNode.className = 'faze-carousel-pages';
    this.node.appendChild(this.pagesNode);

    let pagesHTML: string = '';
    for (let i = 0; i < this.totalSlides; i += 1) {
      pagesHTML += `<div class="faze-page" data-faze-index="${i}"></div>`;
    }
    this.pagesNode.innerHTML = pagesHTML;
    this.pagesNodes = <HTMLElement[]>(
      Array.from(this.pagesNode.querySelectorAll('.faze-page'))
    );
    this.controlsNode.appendChild(this.pagesNode);

    // Активируем первую по умолчанию
    this.pagesNodes[0].classList.add('faze-active');
  }

  /**
   * Создание стрелок переключения слайдов вперед/назад(либо вверх вниз в вертикальном виде)
   */
  private buildArrows(): void {
    this.arrowsNode.className = 'faze-carousel-arrows';
    this.controlsNode.appendChild(this.arrowsNode);

    if (
      !(this.config.selectors.arrowLeft && this.config.selectors.arrowRight)
    ) {
      this.arrowsNodes.left.className =
        'faze-carousel-arrow faze-carousel-arrow-prev';
      this.arrowsNode.appendChild(this.arrowsNodes.left);

      this.arrowsNodes.right.className =
        'faze-carousel-arrow faze-carousel-arrow-next';
      this.arrowsNode.appendChild(this.arrowsNodes.right);
    }
  }

  /**
   * Переключение на следующий слайд
   */
  next(): void {
    if (this.isIdle) {
      this.index += 1;
      this.counter += 1;
      this.checkIndex();
      this.checkCounter();

      // Меняем слайд
      this.updateSlides(FazeCarouselMoveDirection.Forward);
    }
  }

  /**
   * Переключение на предыдущий слайд
   */
  prev(): void {
    if (this.isIdle) {
      this.index -= 1;
      this.counter -= 1;
      this.checkIndex();
      this.checkCounter();

      // Меняем слайд
      this.updateSlides(FazeCarouselMoveDirection.Backward);
    }
  }

  /**
   * Изменение текущего слайда на указанный индекс
   *
   * @param index{number} Индекс нужного слайда
   */
  change(index: number): void {
    if (!this.isIdle) {
      return;
    }

    // Определяем направление и количество слайдов
    let direction: FazeCarouselMoveDirection;
    if (this.index > index) {
      // Текущий индекс больше, значит надо листать влево(вниз)
      direction = FazeCarouselMoveDirection.Backward;
    } else if (this.index < index) {
      // Текущий индекс меньше, значит надо листать вправо(вверх)
      direction = FazeCarouselMoveDirection.Forward;
    } else {
      // Индексы равны или иной случай, просто выходим из метода
      return;
    }

    // Рассчёт на сколько слайдов нужно сдвинуть карусель
    let amount;
    if (index > this.index) {
      amount = index - this.index;
      this.counter += amount;
    } else {
      amount = Math.abs(this.index - index);
      this.counter -= amount;
    }

    // Присваиваем текущий индекс
    this.index = index;

    // Применяем изменения
    this.updateSlides(direction, amount);
  }

  /**
   * Проверка счётчика
   */
  private checkCounter(): void {
    if (this.counter > this.totalSlides - 1) {
      this.counter = 0;
    } else if (this.counter <= -this.totalSlides) {
      this.counter = 0;
    }
  }

  /**
   * Проверка индекса
   *
   * @private
   */
  private checkIndex(): void {
    if (this.index >= this.totalSlides) {
      this.index = Math.max(this.index - this.totalSlides, 0);
    } else if (this.index < 0) {
      this.index = Math.min(
        this.totalSlides - Math.abs(this.index),
        this.totalSlides - 1
      );
    }
  }

  /**
   * Выполнение пользовательской функции "changed"
   *
   * @param direction{FazeCarouselMoveDirection} Направление карусели
   */
  private changeCallbackCall(direction?: FazeCarouselMoveDirection): void {
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          direction,
          holderNode: this.itemsHolderNode,
          carouselNode: this.node,
          slidesNodes: this.slidesNodes,
          totalSlides: this.totalSlides,
          index: this.index,
          currentSlideNode: this.currentSlide,
          controlsNode: this.controlsNode,
          counterNode: this.counterNode,
          arrowsNode: this.arrowsNode,
          arrowsNodes: this.arrowsNodes,
          pagesNode: this.pagesNode,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "changed": ${error}`
        );
      }
    }
  }

  /**
   * Выполнение пользовательской функции "beforeChanged"
   *
   * @param direction{FazeCarouselMoveDirection} Направление карусели
   */
  private beforeChangeCallbackCall(
    direction?: FazeCarouselMoveDirection
  ): void {
    if (typeof this.config.callbacks.beforeChanged === 'function') {
      // Текущий слайд(по факту он следующий, т.к. изменение уже началось)
      const currentSlideNode =
        this.slidesNodes.find(
          (tmpSlideNode) =>
            parseInt(tmpSlideNode.dataset.fazeIndex || '0', 10) === this.index
        ) || this.slidesNodes[0];

      try {
        this.config.callbacks.beforeChanged({
          direction,
          currentSlideNode,
          holderNode: this.itemsHolderNode,
          carouselNode: this.node,
          slidesNodes: this.slidesNodes,
          totalSlides: this.totalSlides,
          index: this.index,
          controlsNode: this.controlsNode,
          counterNode: this.counterNode,
          arrowsNode: this.arrowsNode,
          arrowsNodes: this.arrowsNodes,
          pagesNode: this.pagesNode,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "changed": ${error}`
        );
      }
    }
  }

  /**
   * Изменение текущего слайда
   *
   * @param direction{FazeCarouselMoveDirection} Направление движения
   * @param amount{number} Количество слайдов для изменения
   *
   * @private
   */
  private async updateSlides(
    direction: FazeCarouselMoveDirection,
    amount: number = 1,
    isFreeze: boolean = false
  ): Promise<void> {
    // Вызываем пользовательскую функцию "beforeChanged"
    this.beforeChangeCallbackCall(direction);

    // Блокируем карусель
    this.isIdle = false;

    // DOM элемент следующего слайда
    let nextSlide: HTMLElement;

    // Анимация
    switch (this.config.animation.type) {
      case 'fade':
        // Следующий слайд
        nextSlide = this.slidesNodes[this.index];

        // Активируем текущий слайд
        Faze.Helpers.activateItem(this.slidesNodes, this.index, 'faze-active');

        // Удаляем у всех слайдов стили
        this.slidesNodes.forEach((slideNode: HTMLElement) => {
          slideNode.removeAttribute('style');
        });

        // Переназначаем текущий слайд
        this.currentSlide = nextSlide;

        // Обновление размеров текущего слайда
        this.updateCurrentSlideSizes();

        // Карусель снова свободна
        this.isIdle = true;

        // Изменение состояний элементов управления
        this.changeControls();

        // Вызываем пользовательскую функцию
        this.changeCallbackCall(direction);

        break;
      case 'slide':
        // Следующий слайд
        nextSlide = this.slidesNodes[amount];

        // Активируем текущий слайд
        Faze.Helpers.activateItem(this.slidesNodes, this.index, 'faze-active');

        // Изменяем сдвиг относительно направления
        if (!isFreeze) {
          if (this.counter >= 0) {
            this.offset = -(this.index * this.slideWidth);
          } else {
            this.offset = (this.totalSlides - this.index) * this.slideWidth;
          }
        }

        await this.updateOffset(direction, amount, isFreeze);

        // Изменение состояний элементов управления
        this.changeControls();

        // Вызываем пользовательскую функцию
        this.changeCallbackCall(direction);

        // Карусель снова свободна
        this.isIdle = true;

        break;
      default:
        break;
    }
  }

  /**
   * Обновление сдвига слайдов
   *
   * @private
   */
  private updateSlidesOffset(amount: number = 1): void {
    this.slidesNodes.forEach((slideNode, index) => {
      let offset = 0;

      amount = 1;

      if (index < this.counter - 1) {
        offset = this.totalWidth * amount;
      } else if (index > this.slidesNodes.length + this.counter - 2) {
        offset = -this.totalWidth * amount;
      }

      slideNode.style.transform = `translate(${offset}px, 0)`;
    });
  }

  /**
   * Обновление сдвига карусели
   *
   * @private
   */
  private async updateOffset(
    direction: FazeCarouselMoveDirection,
    amount: number = 1,
    isFreeze: boolean = false
  ): Promise<void> {
    if (amount === 1) {
      this.updateSlidesOffset(amount);
    }

    if (direction === FazeCarouselMoveDirection.Forward && this.counter === 0) {
      if (!isFreeze) {
        this.offset = this.slideWidth * amount;
      } else {
        this.offset += this.slideWidth * amount;
      }

      this.setTransition(true);
      await this.moveSlide(true);
      this.setTransition();
      this.offset = 0;
    } else if (
      direction === FazeCarouselMoveDirection.Backward &&
      this.counter === -1
    ) {
      if (!isFreeze) {
        this.offset = 0;
      }

      this.setTransition(true);
      await this.moveSlide(true);
      this.setTransition();
      this.offset = this.slideWidth * amount;
    } else if (
      direction === FazeCarouselMoveDirection.Backward &&
      this.counter === 0
    ) {
      if (!isFreeze) {
        this.offset = -this.slideWidth * amount;
      } else {
        this.offset -= this.slideWidth * amount;
      }

      this.setTransition(true);
      await this.moveSlide(true);
      this.setTransition();
      this.offset = 0;
    }

    await this.moveSlide();

    if (amount > 1) {
      this.updateSlidesOffset(amount);
    }
  }

  /**
   * Сдвигаем слайдер
   *
   * @param {boolean} isImmediate Нужно ли мгновенное перемещение
   *
   * @private
   */
  private moveSlide(isImmediate: boolean = false): Promise<void> {
    return new Promise((resolve) => {
      this.itemsHolderNode.style.transform = `translate(${this.offset}px, 0)`;

      if (isImmediate) {
        resolve();
      } else {
        setTimeout(() => {
          resolve();
        }, this.config.animation.time);
      }
    });
  }

  /**
   * Задаём анимацию для карусели
   *
   * @param {boolean} isClean Очищать ли анимацию
   *
   * @private
   */
  private setTransition(isClean: boolean = false): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.itemsHolderNode.offsetHeight;
    this.itemsHolderNode.style.transition = isClean ? '' : this.transition;
  }

  /**
   * Изменения элементов управления
   *
   * @private
   */
  private changeControls(): void {
    // Если есть пагинация, изменяем её активный элемент
    if (this.config.pages) {
      this.changePagination();
    }

    // Если есть счетчик, изменяем его
    if (this.config.counter) {
      this.changeCounter();
    }
  }

  /**
   * Изменение назписи счетчика в соответствии с текущим индексом
   *
   * @private
   */
  private changeCounter(): void {
    this.counterNode.innerHTML = `<span class="faze-carousel-counter-current">${this.index + 1
      }</span> / <span class="faze-carousel-counter-total">${this.totalSlides
      }</span>`;
  }

  /**
   * Изменение активной точки в пагинации
   *
   * @private
   */
  private changePagination(): void {
    Faze.Helpers.activateItem(
      Array.from(this.pagesNodes),
      this.index,
      'faze-active'
    );
  }

  /**
   * Обновление размеров текущего слайда
   *
   * @private
   */
  private updateCurrentSlideSizes(): void {
    // Стили слайда
    const style: CSSStyleDeclaration = window.getComputedStyle(
      this.currentSlide
    );

    // Расчёт корректных размеров
    this.slideWidth =
      this.currentSlide.offsetWidth +
      parseFloat(style.marginLeft || '0') +
      parseFloat(style.marginRight || '0');
    this.totalWidth = this.slideWidth * this.totalSlides;
    // this.slideHeight = this.currentSlide.getBoundingClientRect().height;
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Carousel2(node, {
      autoplay: (node.dataset.fazeCarouselAutoplay || 'false') === 'true',
      counter: (node.dataset.fazeCarouselCounter || 'false') === 'true',
      pages: (node.dataset.fazeCarouselPages || 'false') === 'true',
      arrows: (node.dataset.fazeCarouselArrows || 'true') === 'true',
      duration: parseInt(node.dataset.fazeCarouselDuration || '3000', 10),
      infinite: (node.dataset.fazeCarouselInfinite || 'true') === 'true',
      useSlideFullSize: (node.dataset.fazeCarouselUseSlideFullSize || 'false') === 'true',
      stopOnHover: (node.dataset.fazeCarouselStopOnHover || 'false') === 'true',
      mouseMove: (node.dataset.fazeCarouselMouseMove || 'false') === 'true',
      touchMove: (node.dataset.fazeCarouselTouchMove || 'false') === 'true',
      amountPerSlide: parseInt(node.dataset.fazeCarouselAmountPerSlide || '1', 10),
      minAmount: parseInt(node.dataset.fazeCarouselMinAmount || '2', 10),
      disallowRanges: JSON.parse(node.dataset.fazeCarouselDisallowRanges || '[]'),
      offsetChange: parseInt(node.dataset.fazeCarouselOffsetChange || '50', 10),
      animation: {
        type: node.dataset.fazeCarouselAnimationType || 'fade',
        time: parseInt(node.dataset.fazeCarouselAnimationTime || '1000', 10),
        direction: node.dataset.fazeCarouselAnimationDirection || 'horizontal',
        function: node.dataset.fazeCarouselAnimationFunction || 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      selectors: {
        arrowLeft: node.dataset.fazeCarouselSelectorsArrowLeft,
        arrowRight: node.dataset.fazeCarouselSelectorsArrowRight,
        counter: node.dataset.fazeCarouselSelectorsCounter,
      },
    });
  }
}

export default Carousel2;
