import Module from '../../Core/Module';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   url - ссылка, где содержатся данные модуля для их загрузки в плейсхолдер
 *   callbacks
 *     loaded - пользовательская функция, исполняющаяся после загрузки контента
 */
interface Config {
  url: string;
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

    fetch(`${this.config.url}${this.config.url.includes('?') ? '&' : '?'}ajax=true`)
      .then((responce) => responce.text())
      .then((data) => {
        this.node.innerHTML = data;

        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.loaded === 'function') {
          try {
            this.config.callbacks.loaded();
          } catch (error) {
            console.error(`Ошибка исполнения пользовательского метода "loaded": ${error}`);
          }
        }
      });
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    super.bind();
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Placeholder(node, {
      url: node.dataset.fazePlaceholderUrl,
    });
  }
}

export default Placeholder;
