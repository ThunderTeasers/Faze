import './Placeholder.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   url - ссылка, где содержатся данные модуля для их загрузки в плейсхолдер
 *   offset - при каком максимальном сдвиге вьюпорта начинать загружать блок
 *   delay - задержка при загрузке
 *   callbacks
 *     loaded - пользовательская функция, исполняющаяся после загрузки контента
 */
interface Config {
  url: string;
  offset: number;
  delay: number;
  callbacks: {
    loaded?: () => void;
  };
}

/**
 * Класс плейсхолдера
 *
 */
class Placeholder extends Module {
  // DOM элемент селекта
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Загружен ли контент
  isLoaded: boolean;

  /**
   * Конструктор
   *
   * @param node Основной DOM элемент модуля
   * @param config Настройки модуля
   */
  constructor(node: HTMLElement | undefined, config: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      url: '',
      offset: 100,
      delay: 0,
      callbacks: {
        loaded: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Placeholder',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    super.initialize();

    this.node.classList.add('faze-placeholder-loading');

    this.isLoaded = false;
  }

  /**
   * Загрузка HTML на страницу
   *
   * @private
   */
  private load(): void {
    setTimeout(() => {
      fetch(`${this.config.url}${this.config.url.includes('?') ? '&' : '?'}ajax=true`)
        .then((responce: Response) => responce.text())
        .then((data: string) => {
          this.node.innerHTML = data;
          this.node.classList.remove('faze-placeholder-loading');

          // Вызываем пользовательский метод
          if (typeof this.config.callbacks.loaded === 'function') {
            try {
              this.config.callbacks.loaded();
            } catch (error) {
              console.error(`Ошибка исполнения пользовательского метода "loaded": ${error}`);
            }
          }
        });
    }, this.config.delay);
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    super.bind();

    this.bindLoad();
  }

  /**
   * Навешивание событий на загрузку
   *
   * @private
   */
  private bindLoad(): void {
    Faze.Helpers.addEventListeners(window, ['scroll', 'resize'], () => {
      if (Faze.Helpers.isElementInViewport(this.node, this.config.offset) && !this.isLoaded) {
        this.isLoaded = true;
        this.load();
      }
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Placeholder(node, {
      url: node.dataset.fazePlaceholderUrl,
      offset: parseInt(node.dataset.fazePlaceholderOffset || '0', 10),
      delay: parseInt(node.dataset.fazePlaceholderDelay || '0', 10),
    });
  }
}

export default Placeholder;
