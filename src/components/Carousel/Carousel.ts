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
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'ProductCarousel',
 *     plugins: ['Carousel'],
 *     condition: document.querySelectorAll('.carousel-product').length,
 *     callback: () => {
 *       new Faze.Carousel(document.querySelector('.carousel-product'), {
 *         autoplay: true,
 *         pages: true,
 *         counter: true,
 *       });
 *     }
 *   });
 *
 * В HTML:
 *   <div class="carousel-product">
 *     <img src="https://via.placeholder.com/350x150">
 *     <img src="https://via.placeholder.com/350x150">
 *     <img src="https://via.placeholder.com/350x150">
 *     <img src="https://via.placeholder.com/350x150">
 *   </div>
 */

import './Carousel.scss';

/**
 * Структура конфига карусели
 *
 * Содержит:
 *   autoplay   - флаг авто воспроизведения карусели
 *   counter    - отображать ли счетчик слайдов
 *   pages      - отображать ли пагинацию слайдов
 *   arrows     - отображать ли стрелки переключения
 *   duration   - время смены слайдов, в мс.
 *   animation
 *     type     - тип анимации, может быть: 'slide', 'fade'
 *     time     - длительность анимации в миллисекундах
 *     direction - направление смены слайдов, может быть: 'vertical', 'horizontal'. Используется только для анимации 'slide'
 *   callbacks
 *     changed  - пользовательская функция, исполняющаяся при создании карусели
 *     changed  - пользовательская функция, исполняющаяся при изменении слайда
 */
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
    created?: (data: CallbackData) => void;
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
 *   totalSlides  - общее число слайдов
 *   index        - индекс активного слайда
 *   currentSlideNode - DOM элемент активного слайда
 */
interface CallbackData {
  holderNode: HTMLElement;
  carouselNode: HTMLElement;
  slidesNodes: HTMLElement[];
  controlsNode?: HTMLElement;
  pagesNode?: HTMLElement;
  arrowsNode?: HTMLElement;
  counterNode?: HTMLElement;
  totalSlides: number;
  index: number;
  currentSlideNode?: HTMLElement | null;
}

/**
 * Класс карусели
 */
class Carousel {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

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
  readonly totalSlides: number;

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

    // Инициализация переменных
    // Общих
    this.slidesNodes = <HTMLElement[]>Array.from(this.node.children);
    this.totalSlides = this.slidesNodes.length;
    this.itemsHolderNode = document.createElement('div');
    this.controlsNode = document.createElement('div');

    // Для пагинации
    if (this.config.pages) {
      this.pagesNode = document.createElement('div');
    }

    // Для стрелок
    if (this.config.arrows) {
      this.arrowsNode = document.createElement('div');
      this.arrowsNodes = {
        left: document.createElement('div'),
        right: document.createElement('div'),
      };
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

    // Получение параметров слайда, ВАЖНО делать после инициализации, т.к. на слайды могут быть повешаны CSS модификаторы изменяющие его
    // размеры
    this.slideWidth = this.slidesNodes[0].offsetWidth;
    this.slideHeight = this.slidesNodes[0].offsetHeight;
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Изначально индекс равен нулю
    this.index = 0;

    // Инициализируем держатель для элементов карусели и перемещаем их в него
    this.itemsHolderNode.className = 'faze-carousel-holder';
    this.slidesNodes.forEach((slide: HTMLElement, i: number) => {
      // Необходимо для соединения между "пагинацией" и самими слайдами
      slide.setAttribute('data-faze-index', i.toString());

      slide.classList.add('faze-item');

      // Задаем время анимации слайда
      slide.style.transitionDuration = this.transitionDuration;

      // Перевещаем слайд в родителя
      this.itemsHolderNode.appendChild(slide);
    });
    this.node.appendChild(this.itemsHolderNode);

    // Присвоение DOM объекту карусели необходимых классов и стилей для работы самой карусели
    this.node.classList.add('faze-carousel');
    this.node.classList.add(`faze-animation-${this.config.animation.type}`, `faze-direction-${this.config.animation.direction}`);
    this.itemsHolderNode.style.transitionDuration = this.transitionDuration;

    // Активания первого слайда по умолчанию, нужно только для анимации "fade"
    if (this.config.animation.type === 'fade') {
      this.slidesNodes[0].classList.add('faze-active');
    }

    // Создание дополнительных элементов карусели
    this.createControls();

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
          pagesNode: this.pagesNode,
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательского метода "created":', error);
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
  }

  /**
   * Навешивание событий на нажитие по страницам пагинации слайдов для их переключения
   */
  bindPagination(): void {
    this.pagesNodes.forEach((page) => {
      page.addEventListener('click', (event) => {
        event.preventDefault();

        const index = page.getAttribute('data-faze-index');
        if (index) {
          this.index = parseInt(index, 10);
          this.changeSlide(null);
        }
      });
    });
  }

  /**
   * Навешивание событий на нажатие стрелок для переключения слайдов
   */
  bindArrows(): void {
    // Стрелка влево
    this.arrowsNodes.left.addEventListener('click', (event) => {
      event.preventDefault();

      this.prev();
    });

    // Стрелка вправо
    this.arrowsNodes.right.addEventListener('click', (event) => {
      event.preventDefault();

      this.next();
    });
  }

  /**
   * Создание дополнительных элементов карусели, таких как: пагинация, стрелки, счетчик
   */
  createControls() {
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
      throw new Error('Родительский элемент пагинации не найден');
    }

    this.pagesNode.className = 'faze-carousel-pages';
    this.node.appendChild(this.pagesNode);

    let pagesHTML = '';
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

    this.arrowsNodes.left.className = 'faze-carousel-arrow faze-carousel-arrow-prev';
    this.arrowsNode.appendChild(this.arrowsNodes.left);

    this.arrowsNodes.right.className = 'faze-carousel-arrow faze-carousel-arrow-next';
    this.arrowsNode.appendChild(this.arrowsNodes.right);
  }

  /**
   * Переключение карусели влево
   */
  next(): void {
    if (this.isIdle) {
      this.index += 1;
      if (this.index >= this.totalSlides) {
        this.index = 0;
      }
    }

    this.changeSlide('next');
  }

  /**
   * Переключение карусели вправо
   */
  prev(): void {
    if (this.isIdle) {
      this.index -= 1;
      if (this.index < 0) {
        this.index = this.totalSlides - 1;
      }
    }

    this.changeSlide('prev');
  }

  /**
   * Сброс таймера автоматического переключения слайдов
   */
  resetInterval(): void {
    clearInterval(this.timer);
    if (this.config.autoplay) {
      this.timer = setInterval(() => {
        this.next();
      }, this.config.duration);
    }
  }

  /**
   * Метод изменения текущего слайда
   *
   * @param direction - направление изменения(нужно только для анимации slide)
   */
  changeSlide(direction: string | null) {
    // Сброс предыдущей анимации
    this.resetInterval();

    let currentSlide = null;
    switch (this.config.animation.type) {
      // Анимация 'fade', заключается в исчезновении предыдущего и появлении следующего слайда
      case 'fade':
        // Изменение происходит следующим образом, пробегаемся по всем слайдам, у кого из них
        // индекс совпадает с текущим индексом, ставим класс 'current', у остальных же этот
        // класс удаляем.
        // Вся анимация происходит за счет CSS.
        this.slidesNodes.forEach((slide, index) => {
          if (this.index === index) {
            slide.classList.add('faze-active');

            // Задаем текущий слайд для передачи в кастомную функцию
            currentSlide = slide;
          } else {
            slide.classList.remove('faze-active');
          }
        });
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
              this.itemsHolderNode.style.left = `-${this.slideWidth}px`;
            } else if (this.config.animation.direction === 'vertical') {
              this.itemsHolderNode.style.top = `-${this.slideHeight}px`;
            }

            // После того как CSS анимация выполнилась,
            // стили сбрасываются в первоначальное состояние
            setTimeout(() => {
              this.itemsHolderNode.style.transitionDuration = null;
              if (this.config.animation.direction === 'horizontal') {
                this.itemsHolderNode.style.left = '0';
              } else if (this.config.animation.direction === 'vertical') {
                this.itemsHolderNode.style.top = '0';
              }

              // Так же крайний левый слайд перемещается в конец
              this.itemsHolderNode.appendChild(this.slidesNodes[0]);

              // Выставление флага, что карусель в простое и готова к новой анимации
              this.isIdle = true;
            }, this.config.animation.time);
          } else if (direction === 'prev') {
            // При направлении влево, сначала перемещаем крайний правый слайд в начало
            this.itemsHolderNode.insertBefore(this.slidesNodes[this.totalSlides - 1], this.slidesNodes[0]);

            // Задаем стили
            if (this.config.animation.direction === 'horizontal') {
              this.itemsHolderNode.style.left = `-${this.slideWidth}px`;
            } else if (this.config.animation.direction === 'vertical') {
              this.itemsHolderNode.style.top = `-${this.slideHeight}px`;
            }
            this.itemsHolderNode.style.transitionDuration = null;

            // Хак для включения транзишина
            setTimeout(() => {
              if (this.config.animation.direction === 'horizontal') {
                this.itemsHolderNode.style.left = '0';
              } else if (this.config.animation.direction === 'vertical') {
                this.itemsHolderNode.style.top = '0';
              }
              this.itemsHolderNode.style.transitionDuration = this.transitionDuration;
            }, 1);

            // И после выполнения анимации, ставится флаг, что карусель свободна
            setTimeout(() => {
              this.isIdle = true;
            }, this.config.animation.time);
          }
        }
        break;
      default:
        break;
    }

    // Инменяем индикаторы
    this.changeControls();

    // Выполнение пользовательской функции
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          holderNode: this.itemsHolderNode,
          carouselNode: this.node,
          slidesNodes: this.slidesNodes,
          totalSlides: this.totalSlides,
          index: this.index,
          currentSlideNode: currentSlide,
          controlsNode: this.controlsNode,
          counterNode: this.counterNode,
          arrowsNode: this.arrowsNode,
          pagesNode: this.pagesNode,
        });
      } catch (error) {
        console.error('Ошибка исполнения пользовательского метода "changed":', error);
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
  changePagination() {
    this.pagesNodes.forEach((indicator, i) => {
      if (this.index === i) {
        indicator.classList.add('faze-active');
      } else {
        indicator.classList.remove('faze-active');
      }
    });
  }
}

export default Carousel;
