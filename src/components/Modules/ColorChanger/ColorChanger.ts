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
 *   node - DOM элемент где происходит работа модуля
 *   colorsNode - DOM элемент холдера цветов
 *   colorsNodes - DOM элементы цветов
 *   selectedColorNode - DOM элемент выбранного цвета
 */
interface CallbackData {
  node: HTMLElement;
  colorsNode: HTMLElement;
  colorsNodes: HTMLElement[];
  selectedColorNode?: HTMLElement;
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   changeOnHover - изменять ли цвет при наведении(по умолчанию смена идёт при клике)
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  changeOnHover: boolean;
  perRow: number;
  direction: 'vertical' | 'horizontal';
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

  // DOM элемент холдера цветов
  colorsNode: HTMLElement;

  // DOM элементы цветов
  colorsNodes: HTMLImageElement[];

  // DOM элементы строк(колонок)
  colorsRowNodes: HTMLElement[];

  // DOM элемент выбранного цвета
  selectedColorNode?: HTMLElement;

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
      perRow: 4,
      direction: 'vertical',
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

    // Инициализация переменных
    this.quantity = 0;
    this.data = undefined;
    this.selectedColorNode = undefined;
    this.colorsNode = document.createElement('div');
    this.colorsNodes = [];
    this.colorsRowNodes = [];
    this.node.classList.add(`${this.classPrefix}-${this.config.direction}`);

    this.parse();
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindColorChange();
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
      // Если цветов больше чем может вывести превью
      const isMore: boolean = this.data.length > this.config.perRow;

      // Проставляем классы
      this.colorsNode.className = `${this.classPrefix}-colors ${
        isMore ? `${this.classPrefix}-colors-more` : ''
      }`;

      // Количество колонок(строк) с цветами
      const numberOfRows = Math.ceil(this.data.length / this.config.perRow);

      // Создаём колонки для цветов
      for (let i = 0; i < numberOfRows; i++) {
        const rowNode = document.createElement('div');
        rowNode.className = `${this.classPrefix}-row`;
        this.colorsRowNodes.push(rowNode);

        this.colorsNode.appendChild(rowNode);
      }

      // Генерируем HTML код для цветов
      this.data.forEach((dataRow: any, index: number) => {
        const colorNode: HTMLImageElement = document.createElement('img');
        colorNode.className = `${this.classPrefix}-color`;

        if ('image' in dataRow) {
          colorNode.src = dataRow.image;
        }

        Object.keys(dataRow).forEach((key: string) => {
          colorNode.dataset[key] = dataRow[key];
        });

        this.colorsNodes.push(colorNode);
        this.colorsRowNodes[Math.floor(index / this.config.perRow)].appendChild(
          colorNode
        );
      });

      // Вставляем элемент "Показать ещё"
      if (isMore) {
        const moreNode = document.createElement('div');
        moreNode.className = `${this.classPrefix}-more`;
        moreNode.textContent = `+${this.data.length - this.config.perRow + 1}`;

        this.colorsRowNodes[0].appendChild(moreNode);
      }

      this.node.appendChild(this.colorsNode);
    }
  }

  /**
   * Навешивание событий на изменение цвета
   *
   * @private
   */
  private bindColorChange(): void {
    this.colorsNodes.forEach((colorNode: HTMLElement) => {
      Faze.Events.listener(
        this.config.changeOnHover ? 'mouseenter' : 'click',
        colorNode,
        () => {
          this.change(colorNode);
        }
      );
    });
  }

  /**
   * Изменение цвета
   *
   * @param {HTMLElement} colorNode DOM элемент выбранного цвета
   */
  private change(colorNode: HTMLElement): void {
    // Изменяем выбранный цвет
    this.selectedColorNode = colorNode;

    Object.keys(colorNode.dataset).forEach((key: string) => {
      // DOM элемент в котором нужно изменить значения
      const foundNode: HTMLElement | null = this.node.querySelector(
        `[data-faze-colorchanger="${key}"]`
      );

      if (foundNode) {
        this.changeParam(foundNode, colorNode.dataset[key], key);
      }
    });

    // Вызываем пользовательскую функцию
    this.changeCallbackCall();
  }

  /**
   * Изменяем данные в DOM элементе
   *
   * @param {HTMLElement} node Изменяемый DOM элемент
   * @param {string} data Данные на которые меняем
   * @param {string} key Ключ, необходим если нужно менять data атрибут
   */
  private changeParam(
    node: HTMLElement | HTMLImageElement | HTMLAnchorElement,
    data: string | undefined,
    key: string
  ): void {
    if (!data) {
      return;
    }

    const types = (node.dataset.fazeColorchangerType || 'text').split(',');

    types.forEach((type: string) => {
      switch (type) {
        case 'src':
          (node as HTMLImageElement).src = data;
          break;
        case 'href':
          (node as HTMLAnchorElement).href = data;
          break;
        case 'data':
          node.dataset[key] = data;
          break;
        case 'text':
        default:
          node.textContent = data;
      }
    });
  }

  /**
   * Выполнение пользовательской функции "changed"
   *
   * @param currentSlide - DOM элемент текущего слайда
   * @param direction - направление карусели
   */
  private changeCallbackCall(): void {
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          node: this.node,
          colorsNode: this.colorsNode,
          colorsNodes: this.colorsNodes,
          selectedColorNode: this.selectedColorNode,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "changed": ${error}`
        );
      }
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new ColorChanger(node, {
      changeOnHover:
        (node.dataset.fazeColorchangerChangeOnHover || 'false') === 'true',
      perRow: parseInt(node.dataset.fazeColorchangerPerRow || '4', 10),
      direction:
        node.dataset.fazeColorchangerDirection === 'vertical'
          ? 'vertical'
          : 'horizontal',
    });
  }
}

export default ColorChanger;
