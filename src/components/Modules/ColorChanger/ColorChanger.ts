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
 *   preview - количество цветов в свёрнутом варианте
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  changeOnHover: boolean;
  preview: number;
  callbacks: {
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс переключателя цветов
 */
class ColorChanger extends Module {
  // Количество цветов
  quantity: number;

  // Данные о цветах
  data?: any;

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент на который навешивается модуль
   * @param config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      changeOnHover: false,
      preview: 4,
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

    // Инициализация переменных
    this.quantity = 0;
    this.data = undefined;
  }

  /**
   * Инициализация
   *
   * @protected
   */
  protected initialize(): void {
    super.initialize();

    this.parse();
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
    this.data = Faze.Helpers.parseJSON(this.node.dataset.fazeColorchangerData);
    if (!this.data) {
      this.logger.error('Ошибка парсинга данных цветов!');
    }
  }

  /**
   * Построение HTML
   *
   * @protected
   */
  protected build(): void {
    if (this.data && Array.isArray(this.data)) {
      const colorsHolderNode: HTMLElement = document.createElement('div');
      colorsHolderNode.className = `${this.classPrefix}-colors`;

      this.data.forEach((dataRow: any) => {
        const colorNode: HTMLImageElement = document.createElement('img');
        colorNode.className = `${this.classPrefix}-color`;

        if ('image' in dataRow) {
          colorNode.src = dataRow.image;
        }

        Object.keys(dataRow).forEach((key: string) => {
          colorNode.dataset[key] = dataRow[key];
        });

        colorsHolderNode.appendChild(colorNode);
      });

      this.node.appendChild(colorsHolderNode);
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new ColorChanger(node, {
      changeOnHover: (node.dataset.fazeTabUseHash || 'false') === 'true',
      preview: parseInt(node.dataset.fazeTabMaxBodies || '4', 10),
    });
  }
}

export default ColorChanger;
