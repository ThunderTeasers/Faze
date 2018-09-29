import './Scroll.scss';

/**
 * Структура конфига
 *
 * Содержит:
 *   height     - высота окна скрола
 *   transition - CSS стиль для задания движения в окне
 */
interface Config {
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

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект скрола');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      height: 300,
      transition: 'top 0.5s ease',
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

export default Scroll;
