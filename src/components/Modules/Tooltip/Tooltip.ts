/**
 * Плагин тултипа
 *
 * Тултип(подсказка) представляет из себя элемент, который появляется сбоку(с любого из четырех) от элемента и содержит текст-подсказку
 *
 * Автор: Ерохин Максим
 * Дата: 23.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Tooltip
 */

import './Tooltip.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Структура конфига тултипа
 *
 * Содержит:
 *   text   - текст подсказки
 *   side   - сторона с которой должена появляться подсказка
 *   margin - отступ от выбранной стороны(side) в пикселях
 *   class  - кастомный класс
 *   event - событие вызова тултипа
 *   callbacks
 *     opened  - пользовательская функция, срабатывающая при показе тултипа
 */
interface Config {
  text: string;
  side: string;
  margin: number;
  class: string;
  event: 'mouseenter' | 'click';
  resolution?: {
    mobile?: {
      side?: string;
    };
  };
  callbacks: {
    opened?: () => void;
  };
}

/**
 * Класс тултипа
 */
class Tooltip extends Module {
  // DOM элемент для отрисовки тултипа
  tooltipNode: HTMLDivElement;

  // Список медиа-запросов для проверки разрешения экрана
  resolutions: MediaQueryList[];

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      text: '',
      side: 'bottom',
      margin: 10,
      class: '',
      event: 'mouseenter',
      resolution: undefined,
      callbacks: {
        opened: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Tooltip',
      classPrefix: 'faze-tooltip-caller',
    });

    // Проверка на то, что сторона задана правильно
    if (!['top', 'bottom', 'right', 'left'].includes(this.config.side)) {
      this.logger.error('constructor', 'Параметр "side" задан верно! Корректные значения: "top", "right", "bottom", "left".');
    }

    this.handleResolution();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();

    // Инициализация переменных
    this.tooltipNode = document.createElement('div');
    this.resolutions = [window.matchMedia('(max-width: 768px)')];

    this.tooltipNode.className = `faze-tooltip faze-tooltip-${this.config.side} ${this.config.class}`;
    this.tooltipNode.style.visibility = 'hidden';

    this.updateText();
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    // Проверка на нажатие за пределами тултипа
    document.addEventListener('click', (event: MouseEvent) => {
      const path = (event as any).path || (event.composedPath && event.composedPath());
      if (path) {
        if (!path.find((element: HTMLElement) => element === this.tooltipNode || element === this.node)) {
          this.hide();
        }
      }
    });

    // При наведении
    if (this.config.event === 'mouseenter') {
      this.node.addEventListener('mouseenter', () => {
        this.show();
      });

      // Удаление тултипа при выводе мышки за пределы DOM элемента который вызывает тултип
      this.node.addEventListener('mouseleave', () => {
        this.hide();
      });
    } else if (this.config.event === 'click') {
      // При клике
      this.node.addEventListener('click', () => {
        this.toggle();
      });
    }
  }

  /**
   * Отслеживаем изменение разрешения экрана и в соответствии с этим изменяем параметры
   */
  private handleResolution() {
    this.checkResolution();

    this.resolutions.forEach((mql) => {
      mql.addEventListener('change', this.checkResolution.bind(this));
    });
  }

  private checkResolution() {
    this.resolutions.forEach((mql) => {
      if (mql.matches && this.config.resolution?.mobile?.side) {
        this.setSide(this.config.resolution.mobile.side);
      } else {
        this.setSide(this.config.side);
      }
    });
  }

  /**
   * Показ тултипа
   */
  private show(): void {
    // Если не нужно показывать тултип, то выходим из метода
    if (this.node.dataset.fazeTooltipDisabled === 'true') {
      return;
    }

    // Обновление текста
    this.updateText();

    // Для начала скрываем тултип для первичного рассчета его данных
    this.tooltipNode.style.visibility = 'hidden';
    document.body.appendChild(this.tooltipNode);

    // Рассчет позиционирования и размеров
    this.calculatePositionAndSize();

    // Показываем тултип
    this.tooltipNode.style.visibility = 'visible';

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.opened === 'function') {
      try {
        this.config.callbacks.opened();
      } catch (error: any) {
        this.logger.error('opened', error);
      }
    }
  }

  /**
   * Скрытие тултипа
   */
  private hide(): void {
    this.tooltipNode.style.visibility = 'hidden';

    this.tooltipNode.remove();
  }

  /**
   * Переключение видимости тултипа
   */
  private toggle(): void {
    if (this.tooltipNode.style.visibility === 'visible') {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Обновление текста тултипа
   */
  private updateText(): void {
    this.tooltipNode.innerHTML = this.config.text || this.node.dataset.fazeTooltipText || this.node.title || '';
  }

  /**
   * Изменяем сторону отображения
   *
   * @param side Сторона отображения на которую меняем
   */
  setSide(side: string): void {
    this.config.side = side;
    this.tooltipNode.className = `faze-tooltip faze-tooltip-${side} ${this.config.class}`;
  }

  /**
   * Рассчет позиции и размеров тултипа
   */
  private calculatePositionAndSize(): void {
    // Кэшируем данные для рассчета
    const callerRect = this.node.getBoundingClientRect();
    const tooltipRect = this.tooltipNode.getBoundingClientRect();

    // Рассчет отступов
    const offsetHorizontal = callerRect.width / 2 + tooltipRect.width / 2 + this.config.margin;
    const offsetVertical = callerRect.height / 2 + tooltipRect.height / 2 + this.config.margin;

    const { documentElement } = document;
    let left = 0;
    let top = 0;
    if (documentElement) {
      left = (window.pageXOffset || documentElement.scrollLeft) - (documentElement.clientLeft || 0);
      top = (window.pageYOffset || documentElement.scrollTop) - (documentElement.clientTop || 0);
    }

    // Рассчет центров
    let centerX = callerRect.left + callerRect.width / 2 - tooltipRect.width / 2 + left;
    let centerY = callerRect.top + callerRect.height / 2 - tooltipRect.height / 2 + top;

    // Применение отступа в зависимости от стороны
    switch (this.config.side) {
      case 'top':
        centerY -= offsetVertical;
        break;
      case 'left':
        centerX -= offsetHorizontal;
        break;
      case 'right':
        centerX += offsetHorizontal;
        break;
      case 'bottom':
      default:
        centerY += offsetVertical;
        break;
    }

    // Применение данных на тултип
    this.tooltipNode.style.top = `${centerY}px`;
    this.tooltipNode.style.left = `${centerX}px`;
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param tooltipNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(tooltipNode: HTMLElement) {
    new Faze.Tooltip(tooltipNode, {
      text: tooltipNode.dataset.fazeTooltipText || '',
      side: tooltipNode.dataset.fazeTooltipSide || tooltipNode.dataset.fazeTooltipAlign || 'bottom',
      class: tooltipNode.dataset.fazeTooltipClass || '',
      event: tooltipNode.dataset.fazeTooltipEvent || 'mouseenter',
      resolution: {
        mobile: {
          side: tooltipNode.dataset.fazeTooltipSideMobile || 'bottom',
        },
      },
    });
  }
}

export default Tooltip;
