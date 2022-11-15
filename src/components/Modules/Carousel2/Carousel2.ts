/**
 * Плагин карусели
 *
 * Автор: Ерохин Максим, plarson.ru
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

  // Ширина слайда
  private slideWidth: number;

  // Высота слайда
  // private slideHeight: number;

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
    super.initialize();

    // ===========================================
    // Инициализация переменных
    // ===========================================
    this.slidesNodes = <HTMLElement[]>Array.from(this.node.children);
    this.totalSlides = this.slidesNodes.length;
    this.itemsHolderNode = document.createElement('div');
    this.controlsNode = document.createElement('div');
    this.index = 0;
    this.offset = 0;
    this.isIdle = true;

    this.touchStart = {
      x: 0,
      y: 0,
    };

    this.touchEnd = {
      x: 0,
      y: 0,
    };

    if (this.config.pages) {
      this.pagesNode = document.createElement('div');
    }

    if (this.config.counter) {
      this.counterNode = document.createElement('div');
    }

    // ===========================================
    // Инициализация работы модуля
    // ===========================================
    // Проставляем необходимые классы
    this.node.classList.add(`faze-animation-${this.config.animation.type}`, `faze-direction-${this.config.animation.direction}`);
    this.itemsHolderNode.className = 'faze-carousel-holder';

    // Инициализируем слайды
    this.initializeSlides();

    // Инициализируем стрелки
    this.initializeArrows();

    // Добавляем враппер слайдов в карусель
    this.node.appendChild(this.itemsHolderNode);

    // Обновляем размеры текущего слайда
    this.updateCurrentSlideSizes();

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
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
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
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

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
      this.bindMouseGestures();
      this.bindTouchGestures();
    }
  }

  /**
   * Навешивание событий на нажитие по страницам пагинации слайдов для их переключения
   */
  private bindPagination(): void {
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
   *
   * @private
   */
  private bindArrows(): void {
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
   * Отслеживание события нажатия пальцем или мышью на область карусели
   *
   * @param event{MouseEvent | TouchEvent} Событие нажатия мышью или пальцем
   *
   * @private
   */
  private mouseOrTouchDown(event: MouseEvent | TouchEvent) {
    if (Faze.Helpers.isMouseOver(event, this.node).contains && !Faze.Helpers.isMouseOverlapsNode(event, this.controlsNode) && this.isIdle) {
      // Отключаем стандартное перетаскивание
      event.preventDefault();

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
  private mouseOrTouchMove(event: MouseEvent | TouchEvent, isDown: boolean): void {
    // Если не было нажатия, то не выполняем метод
    if (!isDown) {
      return;
    }

    // Получаем координаты касания/нажатия
    this.touchEnd = Faze.Helpers.getMouseOrTouchPosition(event);

    // Вычисляем сдвиг и двигаем весь враппер на это число вбок
    const offset = -(this.touchStart.x - this.touchEnd.x);
    this.itemsHolderNode.style.left = `${offset - this.slideWidth}px`;

    // Проверяем выход за границы
    if (parseInt(this.itemsHolderNode.style.left, 10) >= 0) {
      this.itemsHolderNode.style.left = '0';
    } else if (parseInt(this.itemsHolderNode.style.left, 10) <= -(this.slideWidth * 2)) {
      this.itemsHolderNode.style.left = `-${this.slideWidth * 2}px`;
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
  private mouseOrTouchUp(event: MouseEvent | TouchEvent, isDown: boolean): void {
    if (!isDown) {
      return;
    }

    // Получаем координаты касания/нажатия
    this.touchEnd = Faze.Helpers.getMouseOrTouchPosition(event);

    // Вычисляем сдвиг и двигаем весь враппер на это число вбок
    const offset = -(this.touchStart.x - this.touchEnd.x);

    // Производим работу с перетаскиванием
    // Если сдвинуто влево больше чем на пол слайда, то активируем следующий слайд
    if (offset < -(this.slideWidth / 2)) {
      Faze.Animations.smoothBetween(
        -(Math.abs(offset) + this.slideWidth),
        -(this.slideWidth * 2),
        this.config.animation.time,
        (value: number) => {
          this.itemsHolderNode.style.left = `${value}px`;
        },
        () => {
          // Увеличиваем и проверяем текущий индекс
          this.index += 1;
          this.checkIndexBounds();

          // Производим остаточные действия для корректного переключения слайда
          this.updateAfterChangeSlide(this.slidesNodes[this.index]);

          // Обнуляем сдвиг для продолжения корректной работы
          this.itemsHolderNode.style.left = '0';

          // Карусель снова бездействует
          this.isIdle = true;
        },
      );
    } else if (offset > this.slideWidth / 2) {
      Faze.Animations.smoothBetween(
        -(this.slideWidth - Math.abs(offset)),
        0,
        this.config.animation.time,
        (value: number) => {
          this.itemsHolderNode.style.left = `${value}px`;
        },
        () => {
          // Уменьшаем и проверяем текущий индекс
          this.index -= 1;
          this.checkIndexBounds();

          // Производим остаточные действия для корректного переключения слайда
          this.updateAfterChangeSlide(this.slidesNodes[this.index - 1]);

          // Обнуляем сдвиг для продолжения корректной работы
          this.itemsHolderNode.style.left = '0';

          // Карусель снова бездействует
          this.isIdle = true;
        },
      );
    } else {
      // Плавно двигаем в изначальное положение
      if (offset < 0) {
        // Анимируем
        Faze.Animations.smoothBetween(
          -Math.abs(offset),
          0,
          this.config.animation.time,
          (value: number) => {
            this.itemsHolderNode.style.left = `${value}px`;
          },
          () => {
            // Карусель снова бездействует
            this.isIdle = true;
          },
        );
      } else {
        // Анимируем
        Faze.Animations.smoothBetween(
          -(-Math.abs(offset) + this.slideWidth),
          -this.slideWidth,
          this.config.animation.time,
          (value: number) => {
            this.itemsHolderNode.style.left = `${value}px`;
          },
          () => {
            // Обнуляем сдвиг для продолжения корректной работы
            this.itemsHolderNode.style.left = '0';

            // Карусель снова бездействует
            this.isIdle = true;
          },
        );
      }
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
      isDown = this.mouseOrTouchDown(event);
    });

    // Отслеживаем движение, если находимся внутри враппера слайдов
    document.body.addEventListener('mousemove', (event: MouseEvent) => {
      this.mouseOrTouchMove(event, isDown);
    });

    // Убираем флаг нажатия в любом случае при отпускании мыши
    document.body.addEventListener('mouseup', (event: MouseEvent) => {
      this.mouseOrTouchUp(event, isDown);
      isDown = false;
    });
  }

  /**
   * Навешивание событий для отслеживания жестов пальцем
   */
  private bindTouchGestures(): void {
    // Флаг показывающий нажатие, для отслеживания движения внутри
    let isDown = false;

    // При нажатии на враппер для слайдов ставим флаг, что можно отслеживать движение
    document.body.addEventListener('touchstart', (event: TouchEvent) => {
      isDown = this.mouseOrTouchDown(event);
    });

    // Отслеживаем движение, если находимся внутри враппера слайдов
    document.body.addEventListener('touchmove', (event: TouchEvent) => {
      this.mouseOrTouchMove(event, isDown);
    });

    // Убираем флаг нажатия в любом случае при отпускании мыши
    document.body.addEventListener('touchend', (event: TouchEvent) => {
      this.mouseOrTouchUp(event, isDown);
      isDown = false;
    });
  }

  /**
   * Построение необходимых DOM элементов
   */
  build() {
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
    if (this.config.arrows) {
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
    this.pagesNodes = <HTMLElement[]>Array.from(this.pagesNode.querySelectorAll('.faze-page'));
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

    if (!(this.config.selectors.arrowLeft && this.config.selectors.arrowRight)) {
      this.arrowsNodes.left.className = 'faze-carousel-arrow faze-carousel-arrow-prev';
      this.arrowsNode.appendChild(this.arrowsNodes.left);

      this.arrowsNodes.right.className = 'faze-carousel-arrow faze-carousel-arrow-next';
      this.arrowsNode.appendChild(this.arrowsNodes.right);
    }
  }

  /**
   * Переключение на следующий слайд
   */
  next(): void {
    if (this.isIdle) {
      this.index += 1;
      if (this.index >= this.totalSlides) {
        this.index = Math.max(this.index - this.totalSlides, 0);
      }

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
      if (this.index < 0) {
        this.index = Math.min(this.totalSlides - Math.abs(this.index), this.totalSlides - 1);
      }

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
    } else {
      amount = Math.abs(this.index - index);
    }

    // Присваиваем текущий индекс
    this.index = index;

    // Применяем изменения
    this.updateSlides(direction, amount);
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
        this.logger.error(`Ошибка исполнения пользовательского метода "changed": ${error}`);
      }
    }
  }

  /**
   * Выполнение пользовательской функции "beforeChanged"
   *
   * @param direction{FazeCarouselMoveDirection} Направление карусели
   */
  private beforeChangeCallbackCall(direction?: FazeCarouselMoveDirection): void {
    if (typeof this.config.callbacks.beforeChanged === 'function') {
      // Текущий слайд(по факту он следующий, т.к. изменение уже началось)
      const currentSlideNode = this.slidesNodes.find((tmpSlideNode) => parseInt(tmpSlideNode.dataset.fazeIndex || '0', 10) === this.index) || this.slidesNodes[0];

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
   * Корректировка индекса
   *
   * @private
   */
  private checkIndexBounds(): void {
    if (this.index > this.totalSlides - 1) {
      this.index = 0;
    } else if (this.index < 0) {
      this.index = this.totalSlides - 1;
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
  private updateSlides(direction: FazeCarouselMoveDirection, amount: number = 1): void {
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

        const totalWidth = this.slideWidth * this.totalSlides;

        // Изменяем сдвиг относительно направления
        this.offset += direction === FazeCarouselMoveDirection.Forward ? -this.slideWidth : this.slideWidth;
        if (Math.abs(this.offset) > totalWidth) {
          this.offset = 0;
        }

        this.slidesNodes.forEach((slideNode: HTMLElement, slideIndex: number) => {
          if (slideIndex + 1 < this.index) {
            slideNode.style.transform = `translate(${totalWidth}px, 0)`;
          }
        });

        if (this.index === 0) {
          this.slidesNodes.forEach((slideNode: HTMLElement) => {
            slideNode.style.transform = '';
          });
        }

        this.itemsHolderNode.style.transform = `translate(${this.offset}px, 0)`;

        // Карусель снова свободна
        this.isIdle = true;

        // Изменение состояний элементов управления
        this.changeControls();

        // Вызываем пользовательскую функцию
        this.changeCallbackCall(direction);

        break;
      default:
        break;
    }
  }

  private updateAfterChangeSlide(nextSlide: HTMLElement): void {
    // Проставляем класс активного слайда
    nextSlide.classList.add('faze-active');

    // Переопределяем текущий слайд
    this.currentSlide = nextSlide;

    // Обновление размеров текущего слайда
    this.updateCurrentSlideSizes();

    // Снова получаем все слайды, т.к. при анимации "slide" DOM элементы слайдов перемещаются внутри родителя, что в свою очередь
    // говорит о том, что изначальный массив this.slidesNodes будет содержать неправельные ссылки на элемент когда мы обращаемся
    // по индексу, например [0]
    this.slidesNodes = <HTMLElement[]>Array.from(this.itemsHolderNode.children);

    // Карусель снова свободна
    this.isIdle = true;

    // Изменение состояний элементов управления
    this.changeControls();
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
    this.counterNode.innerHTML = `<span class="faze-carousel-counter-current">${this.index + 1}</span> / <span class="faze-carousel-counter-total">${this.totalSlides}</span>`;
  }

  /**
   * Изменение активной точки в пагинации
   *
   * @private
   */
  private changePagination(): void {
    Faze.Helpers.activateItem(Array.from(this.pagesNodes), this.index, 'faze-active');
  }

  /**
   * Обновление размеров текущего слайда
   *
   * @private
   */
  private updateCurrentSlideSizes(): void {
    this.slideWidth = this.currentSlide.getBoundingClientRect().width;
    // this.slideHeight = this.currentSlide.getBoundingClientRect().height;
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement) {
    new Carousel2(node, {
      autoplay: (node.dataset.fazeCarouselAutoplay || 'false') === 'true',
      counter: (node.dataset.fazeCarouselCounter || 'false') === 'true',
      pages: (node.dataset.fazeCarouselPages || 'false') === 'true',
      arrows: (node.dataset.fazeCarouselArrows || 'true') === 'true',
      duration: parseInt(node.dataset.fazeCarouselDuration || '3000', 10),
      infinite: (node.dataset.fazeCarouselInfinite || 'true') === 'true',
      useSlideFullSize: (node.dataset.fazeCarouselUseSlideFullSize || 'false') === 'true',
      stopOnHover: (node.dataset.fazeCarouselStopOnHover || 'false') === 'true',
      amountPerSlide: parseInt(node.dataset.fazeCarouselAmountPerSlide || '1', 10),
      disallowRanges: JSON.parse(node.dataset.fazeCarouselDisallowRanges || '[]'),
      animation: {
        type: node.dataset.fazeCarouselAnimationType || 'fade',
        time: parseInt(node.dataset.fazeCarouselAnimationTime || '500', 10),
        direction: node.dataset.fazeCarouselAnimationDirection || 'horizontal',
      },
    });
  }
}

export default Carousel2;
