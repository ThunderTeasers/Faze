/**
 * Плагин скрола
 *
 * Скрол представляет из себя область, в которую помещается исходный элемент и, если он не влезает в данную область, то появляется скрол
 * бар, и возможность скролить эту область колесиком мыши.
 *
 * Автор: Ерохин Максим, plarson.ru
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
 *   height     - высота окна скрола
 *   transition - CSS стиль для задания движения в окне
 */
interface Config {
  width: string;
  height: string;
  transition: string;
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
  widthWrapperNode: number;

  // Общая высота области враппера
  heightWrapperNode: number;

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
      transition: 'top 0.5s ease',
    };

    this.config = {...defaultConfig, ...config};
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
    this.wrapperNode.classList.add('faze-scroll');
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
    this.bindMouseDragVertical();
    this.bindMouseTouchVertical();
    this.bindMouseDragHorizontal();
    this.bindMouseTouchHorizontal();
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
      console.log(this.isVertical);

      if (this.isVertical) {
        event.preventDefault();

        // Определяем направление
        const delta = event.deltaY > 0 ? 100 : -100;

        // Изменяем текущую позицию
        let positionY = parseInt(this.node.style.top || '0', 10) - delta;

        // Проверяем чтобы позиция не уехала за рамки
        if (positionY >= 0) {
          positionY = 0;
        } else if (positionY <= -this.heightScrollNode + parseInt(this.config.height, 10)) {
          positionY = -this.heightScrollNode + parseInt(this.config.height, 10);
        }

        // Задаем позицию элементу который скролим
        this.node.style.top = `${positionY}px`;

        // Задаем позицию вертикальному скрол бару
        this.scrollBarVerticalNode.style.top = `${Math.abs(this.scrollVerticalHeightInPercents / 100 * positionY)}px`;
      }
    });
  }

  /**
   * Навешивание события прокрутки области видимости пальцем
   */
  bindMouseTouchVertical(): void {
    // Начальная позиция мыши
    let startTouchPosition = 0;

    // КОнечная позиция мыши
    let endTouchPosition = 0;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragTouchDown = (event: TouchEvent) => {
      // Получение позиции курсора при нажатии на элемент
      startTouchPosition = event.touches[0].clientY;

      // Выключаем плавную прокрутку при движении мышкой
      this.scrollBarVerticalNode.style.transition = '';
      this.node.style.transition = '';

      this.wrapperNode.addEventListener('touchend', endDragElement);
      this.wrapperNode.addEventListener('touchmove', elementDrag);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: TouchEvent) => {
      // Рассчет новой позиции курсора
      endTouchPosition = startTouchPosition - event.touches[0].clientY;
      startTouchPosition = event.touches[0].clientY;

      let positionNode = this.node.offsetTop - endTouchPosition;

      if (positionNode <= -(this.node.offsetHeight - this.heightWrapperNode)) {
        positionNode = -(this.node.offsetHeight - this.heightWrapperNode);
      } else if (positionNode >= 0) {
        positionNode = 0;
      }

      // Задаем позицию вертикальному скрол бару
      this.node.style.top = `${positionNode}px`;

      // Рассчет новой позиции скролбара
      this.scrollBarVerticalNode.style.top = `${-parseInt(this.node.style.top || '', 10) * this.scrollVerticalHeightInPercents / 100}px`;
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      // Включаем плавную прокрутку обратно после того как закончили двигать скрол бар мышкой
      this.scrollBarVerticalNode.style.transition = this.config.transition;
      this.node.style.transition = this.config.transition;

      this.wrapperNode.removeEventListener('touchend', endDragElement);
      this.wrapperNode.removeEventListener('touchend', elementDrag);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    this.wrapperNode.addEventListener('touchstart', dragTouchDown);
  }

  /**
   * Навешивание события прокрутки области видимости пальцем
   */
  bindMouseTouchHorizontal(): void {
    // Начальная позиция мыши
    let startTouchPosition = 0;

    // КОнечная позиция мыши
    let endTouchPosition = 0;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragTouchDown = (event: TouchEvent) => {
      // Получение позиции курсора при нажатии на элемент
      startTouchPosition = event.touches[0].clientX;

      // Выключаем плавную прокрутку при движении мышкой
      this.scrollBarHorizontalNode.style.transition = '';
      this.node.style.transition = '';

      this.wrapperNode.addEventListener('touchend', endDragElement);
      this.wrapperNode.addEventListener('touchmove', elementDrag);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: TouchEvent) => {
      // Рассчет новой позиции курсора
      endTouchPosition = startTouchPosition - event.touches[0].clientX;
      startTouchPosition = event.touches[0].clientX;

      let positionNode = this.node.offsetLeft - endTouchPosition;

      if (positionNode <= -(this.node.offsetWidth - this.widthWrapperNode)) {
        positionNode = -(this.node.offsetWidth - this.widthWrapperNode);
      } else if (positionNode >= 0) {
        positionNode = 0;
      }

      // Задаем позицию вертикальному скрол бару
      this.node.style.left = `${positionNode}px`;

      // Рассчет новой позиции скролбара
      this.scrollBarHorizontalNode.style.left = `${-parseInt(this.node.style.left || '0', 10) * this.scrollHorizontalWidthInPercents / 100}px`;
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      // Включаем плавную прокрутку обратно после того как закончили двигать скрол бар мышкой
      this.scrollBarHorizontalNode.style.transition = this.config.transition;
      this.node.style.transition = this.config.transition;

      this.wrapperNode.removeEventListener('touchend', endDragElement);
      this.wrapperNode.removeEventListener('touchend', elementDrag);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    this.wrapperNode.addEventListener('touchstart', dragTouchDown);
  }

  /**
   * Навешивание события прокрутки области видимости с помощью скролбара
   */
  bindMouseDragVertical(): void {
    // Начальная позиция мыши
    let startMousePosition = 0;

    // КОнечная позиция мыши
    let endMousePosition = 0;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      // Получение позиции курсора при нажатии на элемент
      startMousePosition = event.clientY;

      // Выключаем плавную прокрутку при движении мышкой
      this.scrollBarVerticalNode.style.transition = '';
      this.node.style.transition = '';

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: MouseEvent) => {
      event.preventDefault();

      // Рассчет новой позиции курсора
      endMousePosition = startMousePosition - event.clientY;
      startMousePosition = event.clientY;

      let position = this.scrollBarVerticalNode.offsetTop - endMousePosition;
      if (position <= 0) {
        position = 0;
      } else if (position >= this.heightWrapperNode - this.scrollBarVerticalNode.offsetHeight) {
        position = this.heightWrapperNode - this.scrollBarVerticalNode.offsetHeight;
      }

      // Рассчет новой позиции скролбара
      this.scrollBarVerticalNode.style.top = `${position}px`;

      // Задаем позицию вертикальному скрол бару
      this.node.style.top = `${-parseInt(this.scrollBarVerticalNode.style.top, 10) / this.scrollVerticalHeightInPercents * 100}px`;
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      // Включаем плавную прокрутку обратно после того как закончили двигать скрол бар мышкой
      this.scrollBarVerticalNode.style.transition = this.config.transition;
      this.node.style.transition = this.config.transition;

      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    this.scrollBarVerticalNode.addEventListener('mousedown', dragMouseDown);
  }

  /**
   * Навешивание события прокрутки области видимости с помощью скролбара
   */
  bindMouseDragHorizontal(): void {
    // Начальная позиция мыши
    let startMousePosition = 0;

    // КОнечная позиция мыши
    let endMousePosition = 0;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      // Получение позиции курсора при нажатии на элемент
      startMousePosition = event.clientX;

      // Выключаем плавную прокрутку при движении мышкой
      this.scrollBarVerticalNode.style.transition = '';
      this.node.style.transition = '';

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: MouseEvent) => {
      event.preventDefault();

      // Рассчет новой позиции курсора
      endMousePosition = startMousePosition - event.clientX;
      startMousePosition = event.clientX;

      let position = this.scrollBarHorizontalNode.offsetLeft - endMousePosition;
      if (position <= 0) {
        position = 0;
      } else if (position >= this.widthWrapperNode - this.scrollBarHorizontalNode.offsetWidth) {
        position = this.widthWrapperNode - this.scrollBarHorizontalNode.offsetWidth;
      }

      // Рассчет новой позиции скролбара
      this.scrollBarHorizontalNode.style.left = `${position}px`;

      // Задаем позицию вертикальному скрол бару
      this.node.style.left = `${-parseInt(this.scrollBarHorizontalNode.style.left || '0', 10) / this.scrollHorizontalWidthInPercents * 100}px`;
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      // Включаем плавную прокрутку обратно после того как закончили двигать скрол бар мышкой
      this.scrollBarHorizontalNode.style.transition = this.config.transition;
      this.node.style.transition = this.config.transition;

      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    this.scrollBarHorizontalNode.addEventListener('mousedown', dragMouseDown);
  }

  /**
   * Расчет ширины скрол баров и области скрола
   */
  calculateWidth(): void {
    if (this.config.width) {
      // Ширина враппера
      let wrapperWidth = '';
      if (this.config.width && parseFloat(this.config.width) !== 0) {
        if (this.config.width.toString().includes('%')) {
          wrapperWidth = `${parseFloat(this.config.width)}%`;
        } else {
          wrapperWidth = `${parseFloat(this.config.width)}px`;
        }
      } else {
        const styles = window.getComputedStyle(this.wrapperNode);

        wrapperWidth = `${
          this.node.offsetHeight +
          parseFloat(styles.marginLeft || '0') +
          parseFloat(styles.marginRight || '0') +
          parseFloat(styles.paddingLeft || '0') +
          parseFloat(styles.paddingRight || '0')
        }px`;
      }
      this.wrapperNode.style.width = wrapperWidth;

      // Получаем данные о размерах
      this.widthScrollNode = this.node.getBoundingClientRect().width;
      this.widthWrapperNode = this.wrapperNode.getBoundingClientRect().width;

      if (this.scrollBarHorizontalNode) {
        // Показываем скролл и делаем рассчеты если ширина контента больше ширины области видимости
        if (this.widthScrollNode > this.widthWrapperNode) {
          this.isHorizontal = true;

          // Проставляем класс
          this.wrapperNode.classList.add('faze-scroll-horizontal');

          this.scrollHorizontalWidthInPercents = <any>(this.widthWrapperNode / this.widthScrollNode).toFixed(3) * 100;
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
      if (this.scrollBarVerticalNode) {
        // Высота враппера
        let wrapperHeight = '';
        if (this.config.height && parseFloat(this.config.height) !== 0) {
          if (this.config.height.toString().includes('%')) {
            wrapperHeight = `${parseFloat(this.config.height)}%`;
          } else {
            wrapperHeight = `${parseFloat(this.config.height)}px`;
          }
        } else {
          const styles = window.getComputedStyle(this.wrapperNode);

          wrapperHeight = `${
            this.node.offsetHeight +
            parseFloat(styles.marginTop || '0') +
            parseFloat(styles.marginBottom || '0') +
            parseFloat(styles.paddingTop || '0') +
            parseFloat(styles.paddingBottom || '0')
          }px`;
        }
        this.wrapperNode.style.height = wrapperHeight;

        // Получаем данные о размерах
        this.heightScrollNode = this.node.getBoundingClientRect().height;
        this.heightWrapperNode = this.wrapperNode.getBoundingClientRect().height;

        // Показываем скролл и делаем рассчеты если ширина контента больше ширины области видимости
        if (this.heightScrollNode > this.heightWrapperNode) {
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
