import './Zoom.scss';

/**
 * Структура конфига
 *
 * Содержит:
 *   side   - сторона с которой должно появится окно с увеличенной картиной, может быть: 'left', 'right', 'top', 'bottom'
 *   width  - ширина окна с увеличенной картинкой в пикселях
 *   height - высота окна с увеличенной картинкой в пикселях
 */
interface Config {
  side: string;
  width: number;
  height: number;
}

/**
 * Класс зума
 */
class Zoom {
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект внутри которого лежат шапки и тела табов');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      side: 'right',
      width: 300,
      height: 300,
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;
  }
}

export default Zoom;
