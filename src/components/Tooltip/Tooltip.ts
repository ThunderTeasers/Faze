/**
 * Плагин тултипа
 *
 * Тултип(подсказка) представляет из себя элемент, который появляется сбоку(с любого из четырех) от элемента и содержит текст-подсказку
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 23.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'ProductTooltips',
 *     plugins: ['Tooltip'],
 *     condition: document.querySelectorAll('.informer').length,
 *     callback: () => {
 *       for (const informer of document.querySelectorAll('.informer')) {
 *         new Faze.Tooltip(informer);
 *       }
 *     }
 *   });
 *
 * В HTML:
 *   <div class="informer" data-faze-tooltip-text="Я подсказка!">Наведите для подсказки</div>
 */

import './Tooltip.scss';
import Faze from '../Core/Faze';

/**
 * Структура конфига тултипа
 *
 * Содержит:
 *   side   - сторона с которой должен появляться тултип
 *   text   - текст тултипа
 *   margin - отступ от выбранной стороны(side) в пикселях
 *   callbacks
 *     opened  - пользовательский метод, срабатывающий при вызове тултипа
 */
interface Config {
  side: string;
  text: string;
  margin: number;
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

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент для отрисовки тултипа
  readonly tooltip: HTMLDivElement;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект у которого должен отображаться тултип.');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      side: 'bottom',
      text: '',
      margin: 10,
      callbacks: {
        opened: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    // Проверка на то, что сторона задана правильно
    if (!['top', 'bottom', 'right', 'left'].includes(this.config.side)) {
      throw new Error('Параметр "side" задан верно! Корректные значения: "top", "right", "bottom", "left".');
    }

    this.node = node;
    this.tooltip = document.createElement('div');

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.tooltip.className = `faze-tooltip faze-tooltip-${this.config.side}`;
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.textContent = this.config.text || this.node.getAttribute('data-faze-tooltip-text') || '';
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.node.addEventListener('mouseenter', () => {
      // Для начала скрываем тултип для первичного рассчета его данных
      this.tooltip.style.visibility = 'hidden';
      document.body.appendChild(this.tooltip);

      // Рассчет позиционирования и размеров
      this.calculatePositionAndSize();

      // Показываем тултип
      this.tooltip.style.visibility = 'visible';

      // Вызываем пользовательский метод
      if (typeof this.config.callbacks.opened === 'function') {
        try {
          this.config.callbacks.opened();
        } catch (e) {
          throw new Error(e);
        }
      }
    });

    // Удаление тултипа при выводе мышки за пределы DOM элемента который вызывает тултип
    this.node.addEventListener('mouseleave', () => {
      this.tooltip.remove();
    });
  }

  /**
   * Рассчет позиции и размеров тултипа
   */
  calculatePositionAndSize(): void {
    // Кэшируем данные для рассчета
    const callerRect = this.node.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Рассчет отступов
    const offsetHorizontal = callerRect.width / 2 + tooltipRect.width / 2 + this.config.margin;
    const offsetVertical = callerRect.height / 2 + tooltipRect.height / 2 + this.config.margin;

    const documentElement = document.documentElement;
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
    this.tooltip.style.top = `${centerY}px`;
    this.tooltip.style.left = `${centerX}px`;
  }

  /**
   * Инициализация спойлеров по data атрибутам
   */
  static hotInitialize(): void {
    document.querySelectorAll('[data-faze="tooltip"]').forEach((tooltipNode) => {
      new Faze.Tooltip(tooltipNode, {
        text: tooltipNode.getAttribute('data-faze-tooltip-text') || '',
        side: tooltipNode.getAttribute('data-faze-tooltip-side') || 'bottom',
      });
    });
  }
}

export default Tooltip;
