import './Filter.scss';

/**
 * Структура конфига
 *
 * Содержит:
 */
interface Config {
  tableName?: string;
  showTotal: boolean;
  modules: {
    get?: number;
  };
  selectors: {
    form: string;
    items: string;
    total: string;
  };
  callbacks: {
    created?: () => void;
    filtered?: () => void;
  };
}

/**
 * Класс фильтра
 */
class Filter {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект дропдауна');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      tableName: undefined,
      showTotal: true,
      modules: {
        get: undefined,
      },
      selectors: {
        form: '.js-filter .js-form',
        items: '.js-filter .js-items',
        total: '.total',
      },
      callbacks: {
        created: undefined,
        filtered: undefined,
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

  }

  /**
   * Навешивание событий
   */
  bind(): void {

  }
}

export default Filter;
