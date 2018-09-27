import './Carousel.scss';

interface Config {
  autoplay: boolean;
  counter: boolean;
  pages: boolean;
  arrows: boolean;
  duration: number;
  animation: {
    type: string;
    time: number;
    direction: string;
  };
  callbacks: {
    created?: () => void;
    changed?: () => void;
  };
}

class Carousel {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элменты слайдов
  readonly slidesNodes: HTMLElement[];

  // DOM элемент который содержит все
  readonly itemsHolderNode: HTMLElement;

  // Общее количество слайдов
  readonly totalSlides: number;

  // Индекс текущего слайда
  index: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект карусели');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      autoplay: false,
      counter: false,
      pages: false,
      arrows: true,
      duration: 3000,
      animation: {
        type: 'fade',
        time: 1000,
        direction: 'horizontal',
      },
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.slidesNodes = <HTMLElement[]>Array.from(this.node.children);
    this.totalSlides = this.slidesNodes.length;
    this.itemsHolderNode = document.createElement('div');

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Изначально индекс равен нулю
    this.index = 0;

    // Время работы анимации
    const transitionDuration = `${this.config.animation.time / 1000}s`;

    // Инициализируем держатель для элементов карусели и перемещаем их в него
    this.itemsHolderNode.className = 'carousel-holder';
    this.slidesNodes.forEach((slide: HTMLElement, i: number) => {
      // Необходимо для соединения между "пагинацией" и самими слайдами
      slide.setAttribute('data-index', i.toString());

      slide.classList.add('item');

      // Задаем время анимации слайда
      slide.style.transitionDuration = transitionDuration;

      // Перевещаем слайд в родителя
      this.itemsHolderNode.appendChild(slide);
    });
    this.node.appendChild(this.itemsHolderNode);

    // Присвоение DOM объекту карусели необходимых классов и стилей для работы самой карусели
    this.node.classList.add('carousel');
    this.itemsHolderNode.classList.add(`animation-${this.config.animation.type}`, `direction-${this.config.animation.direction}`);
    this.itemsHolderNode.style.transitionDuration = transitionDuration;

    // Активания первого слайда по умолчанию
    this.slidesNodes[0].classList.add('active');
  }

  /**
   * Навешивание событий
   */
  bind(): void {

  }

  /**
   * Переключение карусели влево
   */
  next(): void {
    this.index += 1;
    if (this.index >= this.totalSlides) {
      this.index = 0;
    }

    this.changeSlide('next');
  }

  /**
   * Переключение карусели вправо
   */
  prev(): void {
    this.index -= 1;
    if (this.index < 0) {
      this.index = this.totalSlides - 1;
    }

    this.changeSlide('prev');
  }

  /**
   * Метод изменения текущего слайда
   *
   * @param direction - направление изменения(нужно только для анимации slide)
   */
  changeSlide(direction: string) {

  }
}

export default Carousel;
