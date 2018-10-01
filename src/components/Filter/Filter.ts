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
  texts: {
    buttonLoading: string;
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

  // DOM элемент кнопки сабмита формы фильтра
  readonly buttonSubmitNode: HTMLElement | null;

  // Параметры фильтра, должны совпадать с параметрами в поисковой строке
  params: URLSearchParams;

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
      texts: {
        buttonLoading: 'Обработка...',
      },
      callbacks: {
        created: undefined,
        filtered: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    this.buttonSubmitNode = this.node.querySelector(`${this.config.selectors.form} [type="submit"]`);

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

  /**
   * Обновление внутненних параметров поиска, для того чтобы они совпадали с теми, что содержатся в поисковой строке
   */
  updateSearchParams() {
    this.params = new URLSearchParams(window.location.search);
  }

  /**
   * Блокирует кнопку от нажатия, так же запоминает оригинальный тест
   */
  lockButton() {
    if (this.buttonSubmitNode) {
      this.buttonSubmitNode.setAttribute('disabled', 'disabled');
      this.buttonSubmitNode.setAttribute('data-initial-text', this.buttonSubmitNode.textContent || '');
      this.buttonSubmitNode.classList.add('disabled');
      this.buttonSubmitNode.textContent = this.config.texts.buttonLoading;
    }
  }

  /**
   * Разблокирует кнопку, ставя ей обратно текст который был на ней изначально, до блокировки
   */
  unlockButton() {
    if (this.buttonSubmitNode) {
      this.buttonSubmitNode.removeAttribute('disabled');
      this.buttonSubmitNode.classList.remove('disabled');
      this.buttonSubmitNode.textContent = this.buttonSubmitNode.getAttribute('data-initial-text') || 'Готово!';
    }
  }
}

export default Filter;
