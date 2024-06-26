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
import Logger from '../../Core/Logger';

/**
 * Структура конфига тултипа
 *
 * Содержит:
 *   text   - текст подсказки
 *   side   - сторона с которой должена появляться подсказка
 *   margin - отступ от выбранной стороны(side) в пикселях
 *   class  - кастомный класс
 *   event - событие вызова тултипа
 *   dynamicUpdate - нужно ли динамическое обновление текста тултипа, если оно изменится в data атрибутах
 *   callbacks
 *     opened  - пользовательская функция, срабатывающая при показе тултипа
 */
interface Config {
  text: string;
  side: string;
  margin: number;
  class: string;
  event: string;
  dynamicUpdate: boolean;
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
class Tooltip {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  side: string;

  // DOM элемент для отрисовки тултипа
  readonly tooltipNode: HTMLDivElement;

  readonly resolutions: MediaQueryList[];

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект у которого должен отображаться тултип.');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Tooltip:');

    this.resolutions = [window.matchMedia('(max-width: 768px)')];

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-tooltip-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      text: '',
      side: 'bottom',
      margin: 10,
      class: '',
      event: 'mouseenter',
      dynamicUpdate: false,
      resolution: undefined,
      callbacks: {
        opened: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    this.side = this.config.side;

    // Проверка на то, что сторона задана правильно
    if (!['top', 'bottom', 'right', 'left'].includes(this.side)) {
      this.logger.error('Параметр "side" задан верно! Корректные значения: "top", "right", "bottom", "left".');
    }

    // Инициализация переменных
    this.node = node;
    this.tooltipNode = document.createElement('div');

    this.initialize();
    this.bind();
    this.handleResolution();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.node.classList.add('faze-tooltip-initialized');
    this.tooltipNode.className = `faze-tooltip faze-tooltip-${this.side} ${this.config.class}`;
    this.tooltipNode.style.visibility = 'hidden';
    this.tooltipNode.innerHTML = this.config.text || this.node.dataset.fazeTooltipText || this.node.title || '';
  }

  /**
   * Навешивание событий
   */
  bind(): void {
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
    if (this.config.dynamicUpdate) {
      this.updateText();
    }

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
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
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
    this.tooltipNode.innerHTML = this.node.dataset.fazeTooltipText || this.node.title || '';
  }

  /**
   * Изменяем сторону отображения
   *
   * @param side Сторона отображения на которую меняем
   */
  setSide(side: string): void {
    this.side = side;
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
    switch (this.side) {
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
      dynamicUpdate: tooltipNode.dataset.fazeTooltipDynamicUpdate === 'true',
      resolution: {
        mobile: {
          side: tooltipNode.dataset.fazeTooltipSideMobile || 'bottom',
        },
      },
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="tooltip"]', (tooltipNode: HTMLElement) => {
      Tooltip.initializeByDataAttributes(tooltipNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="tooltip"]').forEach((tooltipNode: HTMLElement) => {
      Tooltip.initializeByDataAttributes(tooltipNode);
    });
  }
}

export default Tooltip;
