import './Tooltip.scss';

interface Config {
  side: string;
  text: string;
  margin: number;
  callbacks: {
    open?: () => void;
  };
}

class Tooltip {
  readonly node: HTMLElement;
  readonly config: Config;
  readonly tooltip: HTMLDivElement;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект у которого должен отображаться тултип.');
    }

    const defaultConfig: Config = {
      side: 'bottom',
      text: '',
      margin: 10,
      callbacks: {
        open: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    if (!['top', 'bottom', 'right', 'left'].includes(this.config.side)) {
      throw new Error('Параметр "side" задан верно! Корректные значения: "top", "right", "bottom", "left".');
    }

    this.node = node;
    this.tooltip = document.createElement('div');

    this.initialize();
    this.bind();
  }

  initialize(): void {
    this.tooltip.className = `tooltip tooltip-${this.config.side}`;
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.textContent = this.config.text || this.node.getAttribute('data-text') || '';
  }

  bind(): void {
    this.node.addEventListener('mouseenter', () => {
      this.tooltip.style.visibility = 'hidden';

      document.body.appendChild(this.tooltip);

      const callerRect = this.node.getBoundingClientRect();
      const tooltipRect = this.tooltip.getBoundingClientRect();

      const offsetHorizontal = callerRect.width / 2 + tooltipRect.width / 2 + this.config.margin;
      const offsetVertical = callerRect.height / 2 + tooltipRect.height / 2 + this.config.margin;

      let centerX = callerRect.left + callerRect.width / 2 - tooltipRect.width / 2;
      let centerY = callerRect.top + callerRect.height / 2 - tooltipRect.height / 2;

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

      this.tooltip.style.top = `${centerY}px`;
      this.tooltip.style.left = `${centerX}px`;

      this.tooltip.style.visibility = 'visible';

      if (typeof this.config.callbacks.open === 'function') {
        this.config.callbacks.open();
      }
    });

    this.node.addEventListener('mouseleave', () => {
      this.tooltip.remove();
    });
  }
}

export default Tooltip;
