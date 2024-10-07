/**
 * Плагин переключения цветов товаров в листинге
 *
 * Автор: Ерохин Максим
 * Дата: 08.10.2024
 */

import './ColorChanger.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   itemNode - DOM элемент где происходит работа модуля
 *   colorsNode - DOM элемент холдера цветов
 *   colorsNodes - DOM элементы цветов
 *   selectedColorNode - DOM элемент выбранного цвета
 */
interface CallbackData {
  itemNode: HTMLElement;
  colorsNode: HTMLElement;
  colorsNodes: HTMLElement[];
  selectedColorNode: HTMLElement;
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   changeOnHover - изменять ли цвет при наведении(по умолчанию смена идёт при клике)
 *   shortShow - количество цветов в свёрнутом варианте
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  changeOnHover: boolean;
  shortShow: number;
  callbacks: {
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс переключателя цветов
 */
class ColorChanger extends Module {
  // Количество цветов
  quantity?: number;

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент на который навешивается модуль
   * @param config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    console.log(123);

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      changeOnHover: false,
      shortShow: 4,
      callbacks: {
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'ColorChanger',
    });
  }

  /**
   * Инициализация
   *
   * @protected
   */
  protected initialize(): void {
    super.initialize();

    this.parse();
    this.build();
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();
  }

  /**
   * Парсинг JSON с данными
   */
  private parse(): void {
    const data: any = Faze.Helpers.parseJSON(
      this.node.dataset.fazeColorchangerData
    );

    console.log(data);
  }

  /**
   * Построение HTML
   *
   * @protected
   */
  protected build(): void {}

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new ColorChanger(node, {
      changeOnHover: (node.dataset.fazeTabUseHash || 'false') === 'true',
      shortShow: parseInt(node.dataset.fazeTabMaxBodies || '1', 4),
    });
  }
}

export default ColorChanger;
