import './Scroll.scss';

/**
 * Структура конфига
 *
 * Содержит:
 *   height     - высота окна скрола
 *   transition - CSS стиль для задания движения в окне
 */
interface Config {
  width: number;
  height: number;
  transition: string;
}

/**
 * Класс скролл
 */
class Scroll {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент обертки скрола
  readonly wrapperNode: HTMLDivElement;

  // DOM элемент вертикального скрол бара
  readonly scrollVerticalNode: HTMLDivElement;

  // Общая ширина области скрола
  width: number;

  // Общая высота области скрола
  height: number;

  // Размер вертикального скрола в процентах относительно области скрола
  scrollVerticalHeightInPercents: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект скрола');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      width: 0,
      height: 300,
      transition: 'top 0.5s ease',
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    this.wrapperNode = document.createElement('div');
    this.scrollVerticalNode = document.createElement('div');

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Получаем полную высоту элемента
    this.calculateHeight();

    // Подготовка элемента
    this.node.style.position = 'absolute';
    this.node.style.top = '0';
    this.node.style.left = '0';
    this.node.style.transition = this.config.transition;

    // Создаем обертку
    this.wrapperNode.className = 'scroll';
    this.wrapperNode.style.height = `${this.config.height}px`;
    if (this.node.parentNode) {
      this.node.parentNode.insertBefore(this.wrapperNode, this.node);
    }
    this.wrapperNode.appendChild(this.node);

    // Создаем вертикальный скролл
    this.scrollVerticalNode.className = 'scroll-vertical';
    this.scrollVerticalNode.style.transition = this.config.transition;
    this.wrapperNode.appendChild(this.scrollVerticalNode);
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.node.addEventListener('wheel', (event) => {
      event.preventDefault();

      // Определяем направление
      const delta = event.deltaY > 0 ? 100 : -100;

      // Изменяем текущую позицию
      let positionY = parseInt(this.node.style.top || '0', 10) - delta;

      // Проверяем чтобы позиция не уехала за рамки
      if (positionY >= 0) {
        positionY = 0;
      } else if (positionY <= -this.height + this.config.height) {
        positionY = -this.height + this.config.height;
      }

      // Задаем позицию элементу который скролим
      this.node.style.top = `${positionY}px`;

      // Задаем позицию вертикальному скрол бару
      this.scrollVerticalNode.style.top = `${Math.abs(this.scrollVerticalHeightInPercents / 100 * positionY)}px`;
    });
  }

  /**
   * Расчет высоты скрол баров и области скрола
   */
  calculateHeight() {
    if (this.config.height) {
      this.height = this.node.getBoundingClientRect().height;
    }

    if (this.scrollVerticalNode) {
      this.scrollVerticalHeightInPercents = <any>(this.config.height / this.height).toFixed(3) * 100;
      this.scrollVerticalNode.style.height = `${this.scrollVerticalHeightInPercents}%`;
    }
  }
}

export default Scroll;
