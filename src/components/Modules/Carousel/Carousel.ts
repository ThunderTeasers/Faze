/**
 * Плагин карусели
 *
 * Карусель в текущем варианте имеет две анимации изменения слайдов, а именно:
 *   slide - где следующий слайд плавно сдвигает текущий в указанном направлении
 *   fade  - где текущий слайд плавно исчезает, а на его месте плавно появляется следующий
 *
 * Так же, карусель имеет элементы управления, а именно:
 *   пагинация  - точки которые сигнализируют какой слайд активен, так же есть возможность нажать на точку и перейти на слайд
 *   стрелки    - стрелки переключения слайдов вперед/назад
 *   счетчик    - счетчик слайдов, показывает текущий слайд и сколько слайдов всего
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 29.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Carousel
 */

import './Carousel.scss';
import Faze from '../../Core/Faze';
import Logger from '../../Core/Logger';

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
  disallowRanges: FazeDisallowRange[];
  animation: {
    type: string;
    time: number;
    direction: string;
  };
  selectors: {
    arrowLeft?: string;
    arrowRight?: string;
  };
  callbacks: {
    created?: (data: CallbackData) => void;
    beforeChanged?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
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
 * Класс карусели
 */
class Carousel {
  // DOM элемент карусели
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элменты слайдов
  slidesNodes: HTMLElement[];

  // DOM элемент который содержит все
  readonly itemsHolderNode: HTMLElement;

  // DOM элемент содержащий пагинацию по слайдам
  readonly pagesNode: HTMLElement;

  // DOM элементы пагинации
  pagesNodes: NodeListOf<HTMLElement>;

  // DOM элемент который содержит все дополнительные части карусели(пагинацию, стрелки, счетчик)
  readonly controlsNode: HTMLElement;

  // DOM элемент содержащий стрелки переключения слайдов
  readonly arrowsNode: HTMLElement;

  // DOM элементы стрелок переключения слайдов
  readonly arrowsNodes: {
    left: HTMLElement;
    right: HTMLElement;
  };

  // DOM элемент счетчика слайдов
  readonly counterNode: HTMLElement;

  // Общее количество слайдов
  totalSlides: number;

  // Индекс текущего слайда
  index: number;

  // ID таймера переключения слайдов
  timer: number;

  // Определяет состояние карусели, в состоянии покоя или проигрывается анимация
  isIdle: boolean;

  // CSS стиль времени анимации
  readonly transitionDuration: string;

  // Ширина слайда, нужна для анимации "slide" по горизонтали
  slideWidth: number;

  // Ширина слайда, нужна для анимации "slide" по вертикали
  slideHeight: number;

  // Начало касания пальца
  readonly touchStart: FazePosition;

  // Конец касания пальца
  readonly touchEnd: FazePosition;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект карусели');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Carousel:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-carousel-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

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
      amountPerSlide: 1,
      disallowRanges: [],
      animation: {
        type: 'fade',
        time: 1000,
        direction: 'horizontal',
      },
      selectors: {
        arrowLeft: undefined,
        arrowRight: undefined,
      },
      callbacks: {
        created: undefined,
        beforeChanged: undefined,
        changed: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Проверка на границы инициализации
    if (!this._checkDisallowRanges()) {
      return;
    }

    // Инициализация переменных
    // Общих
    this.slidesNodes = <HTMLElement[]>Array.from(this.node.children);
    this.totalSlides = this.slidesNodes.length;
    this.itemsHolderNode = document.createElement('div');
    this.controlsNode = document.createElement('div');

    // Жестов
    this.touchStart = {
      x: 0,
      y: 0,
    };

    this.touchEnd = {
      x: 0,
      y: 0,
    };

    // Для пагинации
    if (this.config.pages) {
      this.pagesNode = document.createElement('div');
    }

    // Для стрелок
    if (this.config.arrows) {
      // DOM элемент содержащий кнопки переключения
      this.arrowsNode = document.createElement('div');

      // Проверка на присутствие кастомных стрелок
      if (this.config.selectors.arrowLeft && this.config.selectors.arrowRight) {
        // DOM элементы стрелок управления
        const arrowLeftNode = document.querySelector<HTMLElement>(this.config.selectors.arrowLeft);
        const arrowRightNode = document.querySelector<HTMLElement>(this.config.selectors.arrowRight);

        // Если нашли кастомные стрелки, то задаём их
        if (arrowLeftNode && arrowRightNode) {
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

    // Для счетчика
    if (this.config.counter) {
      this.counterNode = document.createElement('div');
    }

    // Время работы анимации
    this.transitionDuration = `${this.config.animation.time / 1000}s`;

    // Карусель в простое
    this.isIdle = true;

    this.initialize();
    this.bind();

    // Получение параметров слайда, ВАЖНО делать после инициализации, т.к. на слайды могут быть повешаны CSS модификаторы
    // изменяющие его размеры
    this.calculateSlideSize();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка стандартных классов
    this.node.classList.add('faze-carousel-initialized');

    // Изначально индекс равен нулю
    this.index = 0;

    // Инициализируем держатель для элементов карусели и перемещаем их в него
    this.itemsHolderNode.className = 'faze-carousel-holder';

    // Создаём слайды
    this.createSlides();

    // Добавляем холдер слайдов в карусель
    this.node.appendChild(this.itemsHolderNode);

    // Присвоение DOM объекту карусели необходимых классов и стилей для работы самой карусели
    this.node.classList.add('faze-carousel');
    this.node.classList.add(`faze-animation-${this.config.animation.type}`, `faze-direction-${this.config.animation.direction}`);
    this.itemsHolderNode.style.transitionDuration = this.transitionDuration;

    if (this.config.amountPerSlide !== 1) {
      this.node.classList.add('faze-carousel-grouped');
    }

    // Активания первого слайда по умолчанию, нужно только для анимации "fade"
    if (this.config.animation.type === 'fade') {
      this.slidesNodes[0].classList.add('faze-active');
    }

    // Создание дополнительных элементов карусели
    this.createControls();

    // Проверка на границы
    if (!this.config.infinite) {
      this.checkBounds();
    }

    // Выполнение пользовательской функции
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
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    // Сбросить счетчик автоматического переключения слайдов
    this.resetInterval();

    // Навешиваем события на переключения слайдов по нажатии на элементы пагинации
    if (this.config.pages) {
      this.bindPagination();
    }

    // Навешиваем события на переключение слайдов при нажатии на стрелки
    if (this.config.arrows) {
      this.bindArrows();
    }

    // Навешиваем события жестов
    this.bindGestures();

    // Навешиваем события остановки при наведении
    if (this.config.stopOnHover && this.config.autoplay) {
      this.bindStopOnHover();
    }
  }

  /**
   * Проверка на границы инициализации, границ может быть несколько, их структура следующая:
   *   from?: number
   *   to?: number
   *
   * Если отстутствует нижняя граница, принимаем её за 0, если отстутсвует верхняя, то проверяем просто на вхождение в нижнюю.
   * Если ширина экрана попала хоть в одну проверяемую границу, то возвращается "false" и модуль не инициализитуестя вообще.
   *
   * @return{boolean} Прошла ли проверка, "true" если да, "false" если нет
   *
   * @private
   */
  _checkDisallowRanges(): boolean {
    // Проходимся по всем границам, при первом же попадении выходим из цикла, т.к. проверять уже нет смысла
    for (const disallowRange of this.config.disallowRanges) {
      if (window.innerWidth > (disallowRange.from || 0) && window.innerWidth < (disallowRange.to || window.screen.width)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Навешивание событий для остановление карусели при наведении курсора
   */
  bindStopOnHover(): void {
    // Останавливаем при наведении
    this.node.addEventListener('mouseover', () => {
      clearInterval(this.timer);
    });

    // Включаем после того как убрали курсор
    this.node.addEventListener('mouseleave', () => {
      this.timer = window.setInterval(() => {
        this.next();
      }, this.config.duration);
    });
  }

  /**
   * Навешивание событий на нажитие по страницам пагинации слайдов для их переключения
   */
  bindPagination(): void {
    this.pagesNodes.forEach((page: HTMLElement) => {
      page.addEventListener('click', (event: Event) => {
        event.preventDefault();

        const index = page.dataset.fazeIndex;
        if (index) {
          this.change(parseInt(index, 10));
        }
      });
    });
  }

  /**
   * Навешивание событий на нажатие стрелок для переключения слайдов
   */
  bindArrows(): void {
    // Стрелка влево
    this.arrowsNodes.left.addEventListener('click', (event: Event) => {
      event.preventDefault();

      if (!this.arrowsNodes.left.classList.contains('faze-disabled')) {
        this.prev();
      }
    });

    // Стрелка вправо
    this.arrowsNodes.right.addEventListener('click', (event: Event) => {
      event.preventDefault();

      if (!this.arrowsNodes.right.classList.contains('faze-disabled')) {
        this.next();
      }
    });
  }

  /**
   * Навешивание событий для отслеживания жестов и мышки
   */
  bindGestures(): void {
    this.bindTouchGestures();

    if (this.config.mouseMove) {
      this.bindMouseGestures();
    }
  }

  /**
   * Навешивание событий для отслеживания жестов мышкой
   */
  private bindMouseGestures(): void {
    // Флаг показывающий нажатие, для отслеживания движения внутри
    let isDown = false;

    // При нажатии на враппер для слайдов ставим флаг, что можно отслеживать движение
    document.body.addEventListener('mousedown', (event: MouseEvent) => {
      if (Faze.Helpers.isMouseOver(event, this.node).contains) {
        // Отключаем стандартное перетаскивание
        event.preventDefault();

        // Проставляем флаг что есть нажатие
        isDown = true;

        // Получаем координаты мыши
        this.touchStart.x = event.clientX;
        this.touchStart.y = event.clientY;

        this.handleGesturesStart();
      }
    });

    // Отслеживаем движение, если находимся внутри враппера слайдов
    document.body.addEventListener('mousemove', (event: MouseEvent) => {
      if (isDown) {
        // Получаем координаты мыши
        this.touchEnd.x = event.clientX;
        this.touchEnd.y = event.clientY;

        // Проверка на выход за границы
        this.checkMoveBounds({
          x: this.touchStart.x - this.touchEnd.x,
          y: this.touchStart.y - this.touchEnd.y,
        });

        // Производим работу с перетаскиванием
        this.handleGesturesMove();
      }
    });

    // Убираем флаг нажатия в любом случае при отпускании мыши
    document.body.addEventListener('mouseup', (event: MouseEvent) => {
      isDown = false;

      // Получаем координаты мыши
      this.touchEnd.x = event.clientX;
      this.touchEnd.y = event.clientY;

      // Производим работу с окончанием перетаскивания
      if (Faze.Helpers.isMouseOver(event, this.node).contains) {
        this.handleGesturesStop();
      }
    });
  }

  /**
   * Навешивание событий для отслеживания жестов пальцем
   */
  private bindTouchGestures(): void {
    // Флаг показывающий нажатие, для отслеживания движения внутри
    let isDown = false;

    this.itemsHolderNode.addEventListener('touchstart', (event: TouchEvent) => {
      if (!isDown) {
        this.touchStart.x = event.changedTouches[0].screenX;
        this.touchStart.y = event.changedTouches[0].screenY;

        this.handleGesturesStart();
      }

      // Проставляем флаг что есть нажатие
      isDown = true;
    });

    this.itemsHolderNode.addEventListener('touchmove', (event: TouchEvent) => {
      if (isDown && event.changedTouches.length === 0) {
        this.touchEnd.x = event.changedTouches[0].screenX;
        this.touchEnd.y = event.changedTouches[0].screenY;

        // Проверка на выход за границы
        this.checkMoveBounds({
          x: this.touchStart.x - this.touchEnd.x,
          y: this.touchStart.y - this.touchEnd.y,
        });

        this.handleGesturesMove();
      }
    });

    this.itemsHolderNode.addEventListener('touchend', (event: TouchEvent) => {
      if (isDown) {
        this.touchEnd.x = event.changedTouches[0].screenX;
        this.touchEnd.y = event.changedTouches[0].screenY;

        this.handleGesturesStop();
      }

      isDown = false;
    });
  }

  /**
   * Проверка и ограничение движения мыши при перетаскивании слайда
   *
   * @param position
   */
  private checkMoveBounds(position: FazePosition): void {
    if (position.x > this.slideWidth) {
      position.x = this.slideWidth;
    } else if (position.x < this.slideWidth) {
      position.x = this.slideWidth;
    }
  }

  private handleGesturesStart() {
    // Убираем время анимации слайдов для чёткого перетаскивания мышкой
    this.itemsHolderNode.style.transitionDuration = '';

    // Вставляем слайд перед текущим, чтобы можно было сдвигать карусель вправо
    this.insertSlideBefore();

    this.itemsHolderNode.style.left = `${-this.slideWidth}px`;
  }

  /**
   * Отслеживание жестов и выполнение действий при них
   */
  private handleGesturesMove(): void {
    // Вычисляем сдвиг и двигаем весь враппер на это число вбок
    const offset = -(this.touchStart.x - this.touchEnd.x);
    this.itemsHolderNode.style.left = `${offset - this.slideWidth}px`;
  }

  private handleGesturesStop() {
    // Вычисляем сдвиг
    const offset = -(this.touchStart.x - this.touchEnd.x);

    // Если сдвинуто влево больше чем на пол слайда, то активируем следующий слайд
    if (offset < -(this.slideWidth / 2)) {
      this.insertSlideAfter();
      this.itemsHolderNode.style.left = `${parseInt(this.itemsHolderNode.style.left, 10) + this.slideWidth}px`;
      this.next();
    } else if (offset > this.slideWidth / 2) {
      // Если тоже самое вправо, то предыдущий
      this.itemsHolderNode.style.transitionDuration = this.transitionDuration;
      this.itemsHolderNode.style.left = '0';
      this.prev(false);
    } else {
      // Передвигаем первый слайд в конец
      this.insertSlideAfter();

      // Если мышка была отпущена, но передвинули слайд недостаточно, то позвращаем на место
      this.itemsHolderNode.style.left = '0';
    }

    setTimeout(() => {
      this.itemsHolderNode.style.transitionDuration = this.transitionDuration;
    }, 100);
  }

  /**
   * Перемещение последнего слайда вперед
   */
  private insertSlideBefore(): void {
    this.slidesNodes = <HTMLElement[]>Array.from(this.itemsHolderNode.children);

    // Берем последний слайд и перемещаем его в начало
    this.itemsHolderNode.insertBefore(this.slidesNodes[this.slidesNodes.length - 1], this.slidesNodes[0]);
  }

  /**
   * Перемещение первого слайда в конец
   */
  private insertSlideAfter(): void {
    this.slidesNodes = <HTMLElement[]>Array.from(this.itemsHolderNode.children);

    // Берем первый слайд и перемещаем его в конец
    this.itemsHolderNode.appendChild(this.slidesNodes[0]);
  }

  /**
   * Создание слайдов
   */
  createSlides() {
    if (this.config.amountPerSlide === 1) {
      // Если количество слайдов в одной действие равно одному, это стандартная карусель
      this.slidesNodes.forEach((slide: HTMLElement, i: number) => {
        // Необходимо для соединения между "пагинацией" и самими слайдами
        slide.dataset.fazeIndex = i.toString();

        slide.classList.add('faze-item');

        // Задаем время анимации слайда
        slide.style.transitionDuration = this.transitionDuration;

        // Перевещаем слайд в родителя
        this.itemsHolderNode.appendChild(slide);
      });
    } else {
      // Иначе нужно сгруппировать элементы
      // Высчитываем сколько групп нужно
      const groupCount = Math.ceil(this.slidesNodes.length / this.config.amountPerSlide);

      // Группы слайдов
      const slidesGroupNodes = [];

      // Создаём эти группы
      for (let i = 0; i < groupCount; i += 1) {
        const sliderGroupNode = document.createElement('div');
        sliderGroupNode.className = 'faze-item';
        sliderGroupNode.dataset.fazeIndex = i.toString();
        sliderGroupNode.style.transitionDuration = this.transitionDuration;

        // Перемещаем в неё слайды
        this.slidesNodes.slice(i * this.config.amountPerSlide, i * this.config.amountPerSlide + this.config.amountPerSlide).forEach((slideNode) => {
          sliderGroupNode.appendChild(slideNode);
        });

        // Перевещаем слайд в родителя
        this.itemsHolderNode.appendChild(sliderGroupNode);

        // Добавляем группу в общий массив
        slidesGroupNodes.push(sliderGroupNode);
      }

      // Переназначаем слайды, т.к. ими в таком случае уже становятся группы
      this.slidesNodes = slidesGroupNodes;

      // Переназначаем общее количество слайдов, т.к. при группировке их количество изменилось
      this.totalSlides = this.slidesNodes.length;
    }
  }

  /**
   * Создание дополнительных элементов карусели, таких как: пагинация, стрелки, счетчик
   */
  createControls(): void {
    if (this.config.arrows || this.config.pages || this.config.counter) {
      this.controlsNode.className = 'faze-carousel-controls';
      this.node.appendChild(this.controlsNode);

      // Создание пагинации, если это указанов конфиге
      if (this.config.pages) {
        this.createPagination();
      }

      // Создание стрелок переключения, если это указано в конфиге
      if (this.config.arrows) {
        this.createArrows();
      }

      // Создание счетчика, если это указано в конфиге
      if (this.config.counter) {
        this.createSlidesCounter();
      }
    }
  }

  /**
   * Создание пагинации по слайдам
   */
  createPagination(): void {
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
    this.pagesNodes = this.pagesNode.querySelectorAll('.faze-page');
    this.controlsNode.appendChild(this.pagesNode);

    // Активируем первую по умолчанию
    this.pagesNodes[0].classList.add('faze-active');
  }

  /**
   * Создание счетчика слайдов
   */
  createSlidesCounter(): void {
    this.counterNode.className = 'faze-carousel-counter';
    this.changeCounter();

    // Если у карусели есть стрелки, то вставляем между них
    if (this.config.arrows) {
      this.arrowsNode.insertBefore(this.counterNode, this.arrowsNodes.right);
    } else {
      this.controlsNode.appendChild(this.counterNode);
    }
  }

  /**
   * Изменение назписи счетчика в соответствии с текущим индексом
   */
  changeCounter() {
    this.counterNode.innerHTML = `<span class="faze-carousel-counter-current">${this.index + 1}</span> / <span class="faze-carousel-counter-total">${this.totalSlides}</span>`;
  }

  /**
   * Создание стрелок переключения слайдов вперед/назад(либо вверх вниз в вертикальном виде)
   */
  createArrows(): void {
    this.arrowsNode.className = 'faze-carousel-arrows';
    this.controlsNode.appendChild(this.arrowsNode);

    if (!(this.config.selectors.arrowLeft && this.config.selectors.arrowRight)) {
      this.arrowsNodes.left.className = 'faze-carousel-arrow faze-carousel-arrow-prev';
      this.arrowsNode.appendChild(this.arrowsNodes.left);

      this.arrowsNodes.right.className = 'faze-carousel-arrow faze-carousel-arrow-next';
      this.arrowsNode.appendChild(this.arrowsNodes.right);
    }
  }

  /**
   * Переключение карусели вперед
   *
   * @param needToChange - нужно ли вставлять DOM элемент следующего слайда
   */
  next(needToChange: boolean = true): void {
    if (this.isIdle) {
      this.index += 1;
      if (this.index >= this.totalSlides) {
        this.index = Math.max(this.index - this.totalSlides, 0);
      }
    }

    if (needToChange) {
      this.changeSlide('next', 1);
    } else {
      // Инменяем индикаторы
      this.changeControls();
    }
  }

  /**
   * Переключение карусели назад
   *
   * @param needToChange - нужно ли вставлять DOM элемент следующего слайда
   */
  prev(needToChange: boolean = true): void {
    if (this.isIdle) {
      this.index -= 1;
      if (this.index < 0) {
        this.index = Math.min(this.totalSlides - Math.abs(this.index), this.totalSlides - 1);
      }
    }

    if (needToChange) {
      this.changeSlide('prev', 1);
    } else {
      // Инменяем индикаторы
      this.changeControls();
    }
  }

  /**
   * Изменение текущего слайда на указанный индекс
   *
   * @param index - индекс нужного слайда
   */
  change(index: number): void {
    // Определяем направление и количество слайдов
    let direction: string = '';
    if (this.index > index) {
      // Текущий индекс больше, значит надо листать влево(вниз)
      direction = 'prev';
    } else if (this.index < index) {
      // Текущий индекс меньше, значит надо листать вправо(вверх)
      direction = 'next';
    } else {
      // Индексы равны или иной случай, просто выходим из метода
      return;
    }

    // Рассчёт на сколько слайдов нужно сдвинуть карусель
    let amount;
    if (index > this.index) {
      amount = index - this.index;
    } else {
      amount = Math.abs(this.index - index);
    }

    // Присваиваем текущий индекс
    this.index = index;

    // Применяем изменения
    this.changeSlide(direction, amount);
  }

  /**
   * Проверка на границы при переключении слайдов, чтобы выключить соответствующую стрелку
   *
   * @private
   */
  private checkBounds() {
    // Проверка на левую стрелку
    if (this.index === 0) {
      this.arrowsNodes.left.classList.add('faze-disabled');
    } else {
      this.arrowsNodes.left.classList.remove('faze-disabled');
    }

    // Проверка на правую стрелку
    if (this.index === this.totalSlides - 1) {
      this.arrowsNodes.right.classList.add('faze-disabled');
    } else {
      this.arrowsNodes.right.classList.remove('faze-disabled');
    }
  }

  /**
   * Сброс таймера автоматического переключения слайдов
   */
  resetInterval(): void {
    clearInterval(this.timer);
    if (this.config.autoplay) {
      this.timer = window.setInterval(() => {
        this.next();
      }, this.config.duration);
    }
  }

  /**
   * Метод изменения текущего слайда
   *
   * @param direction - направление изменения(нужно только для анимации slide)
   * @param amount    - количество слайдов
   *
   * @private
   */
  private changeSlide(direction?: string, amount: number = 1): void {
    // Вызываем пользовательскую функцию "beforeChanged"
    this.beforeChangeCallbackCall(direction);

    // Проверка на границы, если не бесконечная прокрутка
    if (!this.config.infinite) {
      this.checkBounds();
    }

    // Сброс предыдущей анимации
    this.resetInterval();

    // Получение актуальной информации о размере слайде
    this.calculateSlideSize();

    let currentSlide: HTMLElement | null = null;
    switch (this.config.animation.type) {
      // Анимация 'fade', заключается в исчезновении предыдущего и появлении следующего слайда
      case 'fade':
        // Изменение происходит следующим образом, пробегаемся по всем слайдам, у кого из них
        // индекс совпадает с текущим индексом, ставим класс 'current', у остальных же этот
        // класс удаляем.
        // Вся анимация происходит за счет CSS.
        this.slidesNodes.forEach((slide: HTMLElement, index: number) => {
          if (this.index === index) {
            slide.classList.add('faze-active');

            // Задаем текущий слайд для передачи в кастомную функцию
            currentSlide = slide;
          } else {
            slide.classList.remove('faze-active');
          }
        });

        // Вызываем пользовательскую функцию
        this.changeCallbackCall(currentSlide, direction);

        break;
      // Анимация 'slide', заключается в плавном смещении одного слайда другим в бок.
      // Вся анимация выполняется средствами CSS
      case 'slide':
        // Проверяем, если карусель в спокойном состоянии,
        // то есть анимация не идет, то переключаем
        if (this.isIdle) {
          // Ставится флаг что карусель активна
          this.isIdle = false;

          // Снова получаем все слайды, т.к. при анимации "slide" DOM элементы слайдов перемещаются внутри родителя, что в свою очередь
          // говорит о том, что изначальный массим this.slidesNodes будет содержать неправельные ссылки на элемент когда мы обращаемся
          // по индексу, например [0]
          this.slidesNodes = <HTMLElement[]>Array.from(this.itemsHolderNode.children);

          // Определение направления, относительно него разное поведение и стили у карусели
          if (direction === 'next') {
            // Задаем карусели необходимые стили для сдвига влево
            this.itemsHolderNode.style.transitionDuration = this.transitionDuration;
            if (this.config.animation.direction === 'horizontal') {
              this.itemsHolderNode.style.left = `-${this.slideWidth * amount}px`;
            } else if (this.config.animation.direction === 'vertical') {
              this.itemsHolderNode.style.top = `-${this.slideHeight * amount}px`;
            }

            // Присваиваем следующему слайду класс
            const nextSlide: HTMLElement = this.slidesNodes[amount];
            if (nextSlide) {
              nextSlide.classList.add('faze-next');
            }

            // После того как CSS анимация выполнилась, стили сбрасываются в первоначальное состояние
            setTimeout(() => {
              this.itemsHolderNode.style.transitionDuration = '';
              if (this.config.animation.direction === 'horizontal') {
                this.itemsHolderNode.style.left = '0';
              } else if (this.config.animation.direction === 'vertical') {
                this.itemsHolderNode.style.top = '0';
              }

              // Так же крайние левые слайды перемещаются в конец
              for (let i = 0; i < amount; i += 1) {
                this.itemsHolderNode.appendChild(this.slidesNodes[i]);
              }

              // Удаляем класс со "следующего" слайда, т.к. он уже стал текущим
              if (nextSlide) {
                nextSlide.classList.remove('faze-next');
              }

              // Присваиваем текущий слайд
              currentSlide = this.slidesNodes.find(tmpSlideNode => parseInt(tmpSlideNode.dataset.fazeIndex || '0', 10) === this.index) || this.slidesNodes[0];

              // Выставление флага, что карусель в простое и готова к новой анимации
              this.isIdle = true;

              // Вызываем пользовательскую функцию
              this.changeCallbackCall(currentSlide, direction);
            }, this.config.animation.time);
          } else if (direction === 'prev') {
            // При направлении влево, сначала перемещаем крайние правые слайды в начало
            for (let i = amount; i !== 0; i -= 1) {
              this.itemsHolderNode.insertBefore(this.slidesNodes[this.totalSlides - i], this.slidesNodes[0]);
            }

            // Задаем стили
            if (this.config.animation.direction === 'horizontal') {
              this.itemsHolderNode.style.left = `-${this.slideWidth * amount}px`;
            } else if (this.config.animation.direction === 'vertical') {
              this.itemsHolderNode.style.top = `-${this.slideHeight * amount}px`;
            }
            this.itemsHolderNode.style.transitionDuration = '';

            // Присваиваем предыдущему слайду класс
            const prevSlide: HTMLElement = this.slidesNodes[this.totalSlides - 1];
            if (prevSlide) {
              prevSlide.classList.add('faze-prev');
            }

            // Хак для включения транзишина
            setTimeout(() => {
              if (this.config.animation.direction === 'horizontal') {
                this.itemsHolderNode.style.left = '0';
              } else if (this.config.animation.direction === 'vertical') {
                this.itemsHolderNode.style.top = '0';
              }
              this.itemsHolderNode.style.transitionDuration = this.transitionDuration;
            }, 10);

            // И после выполнения анимации, ставится флаг, что карусель свободна
            setTimeout(() => {
              currentSlide = this.slidesNodes.find(tmpSlideNode => parseInt(tmpSlideNode.dataset.fazeIndex || '0', 10) === this.index) || this.slidesNodes[0];

              // Удаляем класс с "предыдущего" слайда, т.к. он уже стал текущим
              if (prevSlide) {
                prevSlide.classList.remove('faze-prev');
              }

              // Выставление флага, что карусель в простое и готова к новой анимации
              this.isIdle = true;

              // Вызываем пользовательскую функцию
              this.changeCallbackCall(currentSlide, direction);
            }, this.config.animation.time);
          }
        }
        break;
      default:
        break;
    }

    // Инменяем индикаторы
    this.changeControls();
  }

  /**
   * Выполнение пользовательской функции "changed"
   *
   * @param currentSlide - DOM элемент текущего слайда
   * @param direction - направление карусели
   */
  private changeCallbackCall(currentSlide: HTMLElement | null, direction?: string): void {
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          direction,
          holderNode: this.itemsHolderNode,
          carouselNode: this.node,
          slidesNodes: this.slidesNodes,
          totalSlides: this.totalSlides,
          index: this.index,
          currentSlideNode: currentSlide,
          controlsNode: this.controlsNode,
          counterNode: this.counterNode,
          arrowsNode: this.arrowsNode,
          arrowsNodes: this.arrowsNodes,
          pagesNode: this.pagesNode,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "changed": ${error}`);
      }
    }
  }

  /**
   * Выполнение пользовательской функции "beforeChanged"
   *
   * @param direction - направление карусели
   */
  private beforeChangeCallbackCall(direction?: string): void {
    if (typeof this.config.callbacks.beforeChanged === 'function') {
      // Текущий слайд(по факту он следующий, т.к. изменение уже началось)
      const currentSlideNode = this.slidesNodes.find(tmpSlideNode => parseInt(tmpSlideNode.dataset.fazeIndex || '0', 10) === this.index) || this.slidesNodes[0];

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
        this.logger.error(`Ошибка исполнения пользовательского метода "changed": ${error}`);
      }
    }
  }

  /**
   * Метод управления изменениями элементами управления
   */
  changeControls(): void {
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
   * Изменение активной точки в пагинации
   */
  changePagination(): void {
    Faze.Helpers.activateItem(Array.from(this.pagesNodes), this.index, 'faze-active');
  }

  /**
   * Получение размеров слайда
   */
  calculateSlideSize(): void {
    const slideNode: HTMLElement = this.slidesNodes[0];

    if (this.config.useSlideFullSize) {
      const style: CSSStyleDeclaration = window.getComputedStyle(slideNode);

      this.slideWidth = slideNode.offsetWidth +
        parseFloat(style.marginLeft || '0') +
        parseFloat(style.marginRight || '0');

      this.slideHeight = slideNode.offsetHeight +
        parseFloat(style.marginTop || '0') +
        parseFloat(style.marginBottom || '0');
    } else {
      this.slideWidth = slideNode.offsetWidth;
      this.slideHeight = slideNode.offsetHeight;
    }
  }

  /**
   * Изменение направления анимации
   *
   * @param direction - новое направление
   */
  changeAnimationDirection(direction: string): void {
    // Удаляем все предыдущие классы направления анимации
    this.node.classList.remove('faze-direction-vertical');
    this.node.classList.remove('faze-direction-horizontal');

    // Проставляем переданный
    this.node.classList.add(`faze-direction-${direction}`);

    // Изменение конфига
    this.config.animation.direction = direction;
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param carouselNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(carouselNode: HTMLElement): void {
    new Faze.Carousel(carouselNode, {
      autoplay: (carouselNode.dataset.fazeCarouselAutoplay || 'false') === 'true',
      counter: (carouselNode.dataset.fazeCarouselCounter || 'false') === 'true',
      pages: (carouselNode.dataset.fazeCarouselPages || 'false') === 'true',
      arrows: (carouselNode.dataset.fazeCarouselArrows || 'true') === 'true',
      arrowsOutside: (carouselNode.dataset.fazeCarouselArrowsOutside || 'true') === 'true',
      duration: carouselNode.dataset.fazeCarouselDuration || 3000,
      infinite: (carouselNode.dataset.fazeCarouselInfinite || 'true') === 'true',
      useSlideFullSize: (carouselNode.dataset.fazeCarouselUseSlideFullSize || 'false') === 'true',
      stopOnHover: (carouselNode.dataset.fazeCarouselStopOnHover || 'false') === 'true',
      amountPerSlide: parseInt(carouselNode.dataset.fazeCarouselAmountPerSlide || '1', 10),
      disallowRanges: JSON.parse(carouselNode.dataset.fazeCarouselDisallowRanges || '[]'),
      animation: {
        type: carouselNode.dataset.fazeCarouselAnimationType || 'fade',
        time: carouselNode.dataset.fazeCarouselAnimationTime || 1000,
        direction: carouselNode.dataset.fazeCarouselAnimationDirection || 'horizontal',
      },
      selectors: {
        arrowLeft: carouselNode.dataset.fazeCarouselSelectorsArrowLeft,
        arrowRight: carouselNode.dataset.fazeCarouselSelectorsArrowRight,
      },
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="carousel"]', (carouselNode: HTMLElement) => {
      Carousel.initializeByDataAttributes(carouselNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="carousel"]').forEach((carouselNode: HTMLElement) => {
      Carousel.initializeByDataAttributes(carouselNode);
    });
  }
}

export default Carousel;
