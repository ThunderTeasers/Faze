/**
 * Плагин скрола
 *
 * Скрол представляет из себя область, в которую помещается исходный элемент и, если он не влезает в данную область, то появляется скрол
 * бар, и возможность скролить эту область колесиком мыши.
 *
 * Автор: Ерохин Максим
 * Дата: 30.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'ScrollPage',
 *     plugins: ['Scroll'],
 *     condition: document.querySelectorAll('.for-scroll').length,
 *     callback: () => {
 *       new Faze.Scroll(document.querySelector('.for-scroll'), {
 *         height: 200,
 *       });
 *     }
 *   });
 *
 * В HTML:
 *   <div class="for-scroll">
 *     МНОГО ТЕКСТА
 *   </div>
 */

import './Scroll.scss';

/**
 * Структура конфига
 *
 * Содержит:
 *   width      - ширина окна скрола
 *   height     - высота окна скрола
 *   shrink     - уменьшать ли размер враппера если реальный размер контента меньше него
 *   transition - CSS стиль для задания движения в окне
 *   class      - дополнительный CSS класс для враппера
 */
interface Config {
  width: string;
  height: string;
  shrink: boolean;
  transition: string;
  class: string;
}

/**
 * Направление движения
 */
enum Direction {
  Horizontal,
  Vertical,
}

/**
 * Класс скролл
 */
class Scroll {
  // DOM элемент скрола
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент обертки скрола
  readonly wrapperNode: HTMLDivElement;

  // DOM элемент вертикального скрол бара
  readonly scrollBarVerticalNode: HTMLDivElement;

  // DOM элемент горизонтального скрол бара
  readonly scrollBarHorizontalNode: HTMLDivElement;

  // Общая ширина области скрола
  widthScrollNode: number;

  // Общая высота области скрола
  heightScrollNode: number;

  // Общая ширина области враппера
  wrapperWidth: number;

  // Общая высота области враппера
  wrapperHeight: number;

  // Размер вертикального скрола в процентах относительно области скрола
  scrollVerticalHeightInPercents: number;

  // Размер горизонтального скрола в процентах относительно области скрола
  scrollHorizontalWidthInPercents: number;

  // Флаг обозначающий имеет ли область вертикальный скролл
  isVertical: boolean;

  // Флаг обозначающий имеет ли область горизонтальный скролл
  isHorizontal: boolean;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект скрола');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      width: '100%',
      height: '0',
      shrink: true,
      transition: 'top 0.5s ease',
      class: '',
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    // Общих
    this.wrapperNode = document.createElement('div');
    this.scrollBarVerticalNode = document.createElement('div');
    this.scrollBarHorizontalNode = document.createElement('div');
    this.isVertical = false;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Подготовка элемента
    this.node.style.position = 'absolute';
    this.node.style.top = '0';
    this.node.style.left = '0';
    this.node.style.transition = this.config.transition;

    // Создаем обертку
    this.wrapperNode.className = `faze-scroll ${this.config.class}`;
    if (this.node.parentNode) {
      this.node.parentNode.insertBefore(this.wrapperNode, this.node);
    }
    this.wrapperNode.appendChild(this.node);

    // Получаем полную высоту и ширину элемента
    this.calculateHeight();
    this.calculateWidth();

    // Создаем вертикальный скролл
    this.scrollBarVerticalNode.className = 'faze-scroll-vertical';
    this.scrollBarVerticalNode.style.transition = this.config.transition;
    this.wrapperNode.appendChild(this.scrollBarVerticalNode);

    // Создаем вертикальный скролл
    this.scrollBarHorizontalNode.className = 'faze-scroll-horizontal';
    this.scrollBarHorizontalNode.style.transition = this.config.transition;
    this.wrapperNode.appendChild(this.scrollBarHorizontalNode);
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.bindResizeRecalculate();
    this.bindMouseWheel();
    this.bindTouchDrag();
    this.bindMouseDrag();
  }

  /**
   * Навешивание события перерасчета размеров при изменении размера окна
   */
  bindResizeRecalculate(): void {
    if (this.config.width.toString().includes('%') || this.config.height.toString().includes('%')) {
      window.addEventListener('resize', () => {
        // Обновляем полную высоту и ширину элемента
        this.calculateHeight();
        this.calculateWidth();
      });
    }
  }

  /**
   * Навешивание события прокрутки области видимости с помощью колесика мышы
   */
  bindMouseWheel(): void {
    this.wrapperNode.addEventListener('wheel', (event) => {
      if (this.isVertical) {
        event.preventDefault();

        // Определяем направление
        const delta: number = event.deltaY > 0 ? 100 : -100;

        // Изменяем текущую позицию
        let positionY: number = parseInt(this.node.style.top || '0', 10) - delta;

        // Проверяем чтобы позиция не уехала за рамки
        if (positionY >= 0) {
          positionY = 0;
        } else if (positionY <= -this.heightScrollNode + parseInt(this.config.height, 10)) {
          positionY = -this.heightScrollNode + parseInt(this.config.height, 10);
        }

        // Задаем позицию элементу который скролим
        this.node.style.top = `${positionY}px`;

        // Задаем позицию вертикальному скрол бару
        this.scrollBarVerticalNode.style.top = `${Math.abs((this.scrollVerticalHeightInPercents / 100) * positionY)}px`;
      }
    });
  }

  /**
   * Навешиевание событий на движения полосы прокрутки(а соответственно и поля просмотра) в стороны с помощью пальца
   */
  bindTouchDrag(): void {
    this.bindTouchDragDirection(Direction.Vertical);
    this.bindTouchDragDirection(Direction.Horizontal);
  }

  /**
   * Навашивание событий на движения полосы прокрутки(а соответственно и поля просмотра) в определенную сторону с помощью мыши
   *
   * @param direction - направление движения
   */
  bindTouchDragDirection(direction: Direction): void {
    // Начальная позиция пальца
    let startTouchPosition: number = 0;

    // Конечная позиция пальца
    let endTouchPosition: number = 0;

    // DOM элемент полосы прокрутки
    const scrollbarNode: HTMLDivElement = direction === Direction.Horizontal ? this.scrollBarHorizontalNode : this.scrollBarVerticalNode;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragTouchDown = (event: TouchEvent) => {
      // Получение пальца при нажатии на элемент
      startTouchPosition = direction === Direction.Horizontal ? event.touches[0].clientX : event.touches[0].clientY;

      // Выключаем плавную прокрутку при движении мышкой
      scrollbarNode.style.transition = '';
      this.node.style.transition = '';

      this.wrapperNode.addEventListener('touchend', endDragElement);
      this.wrapperNode.addEventListener('touchmove', dragElement);
    };

    /**
     * Функция перетаскивания области скрола.
     * Происходит расчёт координат и они присваиваются через стили "top" и "left".
     *
     * @param event - событие пальца
     */
    const dragElement = (event: TouchEvent) => {
      event.preventDefault();

      // Рассчет новой позиции пальца
      endTouchPosition = startTouchPosition - (direction === Direction.Horizontal ? event.touches[0].clientX : event.touches[0].clientY);
      startTouchPosition = direction === Direction.Horizontal ? event.touches[0].clientX : event.touches[0].clientY;

      let position = 0;
      if (direction === Direction.Horizontal) {
        position = this.node.offsetLeft - endTouchPosition;

        if (position <= -(this.node.offsetWidth - this.wrapperWidth)) {
          position = -(this.node.offsetWidth - this.wrapperWidth);
        } else if (position >= 0) {
          position = 0;
        }
      } else {
        position = this.node.offsetTop - endTouchPosition;

        if (position <= -(this.node.offsetHeight - this.wrapperHeight)) {
          position = -(this.node.offsetHeight - this.wrapperHeight);
        } else if (position >= 0) {
          position = 0;
        }
      }

      // Рассчет новой позиции скролбара и задаем позицию вертикальному скрол бару
      if (direction === Direction.Horizontal) {
        this.node.style.left = `${position}px`;
        scrollbarNode.style.left = `${(-parseInt(this.node.style.left || '', 10) * this.scrollHorizontalWidthInPercents) / 100}px`;
      } else {
        this.node.style.top = `${position}px`;
        scrollbarNode.style.top = `${(-parseInt(this.node.style.top || '', 10) * this.scrollVerticalHeightInPercents) / 100}px`;
      }
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      // Включаем плавную прокрутку обратно после того как закончили двигать скрол бар мышкой
      scrollbarNode.style.transition = this.config.transition;
      this.node.style.transition = this.config.transition;

      this.wrapperNode.removeEventListener('touchend', endDragElement);
      this.wrapperNode.removeEventListener('touchend', dragElement);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    this.wrapperNode.addEventListener('touchstart', dragTouchDown);
  }

  /**
   * Навешиевание событий на движения полосы прокрутки(а соответственно и поля просмотра) в стороны с помощью мыши
   */
  bindMouseDrag(): void {
    this.bindMouseDragDirection(Direction.Vertical);
    this.bindMouseDragDirection(Direction.Horizontal);
  }

  /**
   * Навашивание событий на движения полосы прокрутки(а соответственно и поля просмотра) в определенную сторону с помощью мыши
   *
   * @param direction - направление движения
   */
  bindMouseDragDirection(direction: Direction): void {
    // Начальная позиция мыши
    let startMousePosition: number = 0;

    // Конечная позиция мыши
    let endMousePosition: number = 0;

    // DOM элемент полосы прокрутки
    const scrollbarNode: HTMLDivElement = direction === Direction.Horizontal ? this.scrollBarHorizontalNode : this.scrollBarVerticalNode;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      // Получение позиции курсора при нажатии на элемент
      startMousePosition = direction === Direction.Horizontal ? event.clientX : event.clientY;

      // Выключаем плавную прокрутку при движении мышкой
      scrollbarNode.style.transition = '';
      this.node.style.transition = '';

      this.wrapperNode.addEventListener('mouseup', endDragElement);
      this.wrapperNode.addEventListener('mousemove', dragElement);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const dragElement = (event: MouseEvent) => {
      event.preventDefault();

      // Ставим ограничение на передвижение полосы если мышь за её пределами
      if (direction === Direction.Horizontal) {
        if (scrollbarNode.getBoundingClientRect().right < event.clientX || scrollbarNode.getBoundingClientRect().left > event.clientX) {
          return;
        }
      } else {
        if (scrollbarNode.getBoundingClientRect().bottom < event.clientY || scrollbarNode.getBoundingClientRect().top > event.clientY) {
          return;
        }
      }

      // Рассчет новой позиции курсора
      endMousePosition = startMousePosition - (direction === Direction.Horizontal ? event.clientX : event.clientY);
      startMousePosition = direction === Direction.Horizontal ? event.clientX : event.clientY;

      let maxPosition = 0;
      if (direction === Direction.Horizontal) {
        maxPosition = this.wrapperWidth - scrollbarNode.offsetWidth;
      } else {
        maxPosition = this.wrapperHeight - scrollbarNode.offsetHeight;
      }

      let position: number = (direction === Direction.Horizontal ? scrollbarNode.offsetLeft : scrollbarNode.offsetTop) - endMousePosition;
      if (position <= 0) {
        position = 0;
      } else if (position >= maxPosition) {
        position = maxPosition;
      }

      // Рассчет новой позиции скролбара и задаем позицию вертикальному скрол бару
      if (direction === Direction.Horizontal) {
        scrollbarNode.style.left = `${position}px`;
        this.node.style.left = `${(-parseInt(scrollbarNode.style.left, 10) / this.scrollHorizontalWidthInPercents) * 100}px`;
      } else {
        scrollbarNode.style.top = `${position}px`;
        this.node.style.top = `${(-parseInt(scrollbarNode.style.top, 10) / this.scrollVerticalHeightInPercents) * 100}px`;
      }
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      // Включаем плавную прокрутку обратно после того как закончили двигать скрол бар мышкой
      scrollbarNode.style.transition = this.config.transition;
      this.node.style.transition = this.config.transition;

      this.wrapperNode.removeEventListener('mouseup', endDragElement);
      this.wrapperNode.removeEventListener('mousemove', dragElement);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    scrollbarNode.addEventListener('mousedown', dragMouseDown);
  }

  /**
   * Расчет ширины скрол баров и области скрола
   */
  calculateWidth(): void {
    if (this.config.width) {
      // Дополнительная высота за счет паддингов
      const styles = window.getComputedStyle(this.wrapperNode);
      const additionalWidth = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');

      // Ширина враппера
      let wrapperWidth = '';
      if (this.config.width && parseFloat(this.config.width) !== 0) {
        if (this.config.width.toString().includes('%')) {
          wrapperWidth = `${parseFloat(this.config.width)}%`;
        } else {
          wrapperWidth = `${parseFloat(this.config.width) + additionalWidth}px`;
        }
      } else {
        wrapperWidth = `${this.node.offsetHeight + additionalWidth}px`;
      }
      this.wrapperNode.style.width = wrapperWidth;

      // Получаем данные о размерах
      this.widthScrollNode = this.node.getBoundingClientRect().width;
      this.wrapperWidth = this.wrapperNode.getBoundingClientRect().width - additionalWidth;

      if (this.scrollBarHorizontalNode) {
        // Показываем скролл и делаем рассчеты если ширина контента больше ширины области видимости
        if (this.widthScrollNode > this.wrapperWidth) {
          this.isHorizontal = true;

          // Проставляем класс
          this.wrapperNode.classList.add('faze-scroll-horizontal');

          this.scrollHorizontalWidthInPercents = <any>(this.wrapperWidth / this.widthScrollNode).toFixed(3) * 100;
          this.scrollBarHorizontalNode.style.width = `${this.scrollHorizontalWidthInPercents}%`;
        } else {
          this.isHorizontal = false;

          // Если меньше то скрываем скролл
          this.wrapperNode.classList.remove('faze-scroll-horizontal');
        }
      }
    }
  }

  /**
   * Расчет высоты скрол баров и области скрола
   */
  calculateHeight(): void {
    if (this.config.height) {
      // Проверяем не слишком ли большая высота задана в конфиге и если это так то уменьшаем высоту враппера до реальной
      if (!this.config.height.toString().includes('%') && this.node.getBoundingClientRect().height <= parseInt(this.config.height, 10)) {
        this.isVertical = false;
        this.wrapperNode.classList.remove('faze-scroll-vertical');
        this.wrapperNode.style.height = `${this.node.getBoundingClientRect().height || 0}px`;
      } else if (this.scrollBarVerticalNode) {
        // Дополнительная высота за счет паддингов
        const styles = window.getComputedStyle(this.wrapperNode);
        const additionalHeight = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');

        // Высота враппера
        let wrapperHeight = '';

        if (this.config.height && parseFloat(this.config.height) !== 0) {
          if (this.config.height.toString().includes('%')) {
            wrapperHeight = `${parseFloat(this.config.height)}%`;
          } else {
            wrapperHeight = `${parseFloat(this.config.height) + additionalHeight}px`;
          }
        } else {
          wrapperHeight = `${this.node.offsetHeight + additionalHeight}px`;
        }
        this.wrapperNode.style.height = wrapperHeight;

        // Получаем данные о размерах
        this.heightScrollNode = this.node.getBoundingClientRect().height;
        this.wrapperHeight = this.wrapperNode.getBoundingClientRect().height - additionalHeight;

        // Показываем скролл и делаем рассчеты если ширина контента больше ширины области видимости
        if (this.heightScrollNode > this.wrapperHeight) {
          this.isVertical = true;

          // Проставляем класс
          this.wrapperNode.classList.add('faze-scroll-vertical');

          this.scrollVerticalHeightInPercents = <any>(parseInt(this.config.height, 10) / this.heightScrollNode).toFixed(3) * 100;
          this.scrollBarVerticalNode.style.height = `${this.scrollVerticalHeightInPercents}%`;
        } else {
          this.isVertical = false;

          // Если меньше то скрываем скролл
          this.wrapperNode.classList.remove('faze-scroll-vertical');
        }
      }
    }
  }
}

export default Scroll;
