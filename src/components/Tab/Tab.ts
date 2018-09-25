import './Tab.scss';

/**
 * Структура конфига табов
 *
 * Содержит:
 *   selectors
 *     headers  - CSS селекторы заголовков табов
 *     bodies   - CSS селекторы тел табов
 */
interface Config {
  selectors: {
    headers: string;
    bodies: string;
  };
}

/**
 * Класс табов
 */
class Tab {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Заголовки табов
  headers: NodeListOf<Element>;

  // Тела табов
  bodies: NodeListOf<Element>;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект при нажатии на который должно появляться модальное окно');
    }

    // Конфиг по умолчанию
    const defaultConfig = {
      selectors: {
        headers: '.block-tabs-headers .block-header',
        bodies: '.block-tabs-bodies .block-body',
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.headers = this.node.querySelectorAll(this.config.selectors.headers);
    this.bodies = this.node.querySelectorAll(this.config.selectors.bodies);
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    for (const header of this.headers) {
      header.addEventListener('click', (event) => {
        event.preventDefault();
      });
    }
  }
}

export default Tab;
