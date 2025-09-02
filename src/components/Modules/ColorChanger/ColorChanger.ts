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
  colorsNodes: HTMLImageElement[];
  selectedColorNode?: HTMLElement;
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   changeOnHover - изменять ли цвет при наведении(по умолчанию смена идёт при клике)
 *   perRow - количество цветов в строке
 *   direction - направление строк(колонок)
 *   showIfOne - показывать если один цвет
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  changeOnHover: boolean;
  perRow: number;
  direction: 'vertical' | 'horizontal';
  showIfOne: boolean;
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
  data?: {
    image?: string;
    [key: string]: string | string[] | undefined;
  }[];

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
      showIfOne: false,
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
      // Проверка на вывод единичного цвета
      if (!this.config.showIfOne && this.data.length < 2) {
        return;
      }

      // Если цветов больше чем может вывести превью
      const isMore: boolean = this.data.length > this.config.perRow;

      // Проставляем классы
      this.colorsNode.className = `${this.classPrefix}-colors ${isMore ? `${this.classPrefix}-colors-more` : ''}`;

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

        // Специальное условие для отображения картинки цвета
        if ('image' in dataRow) {
          colorNode.src = dataRow.image;
        }

        Object.keys(dataRow).forEach((key: string) => {
          let value = dataRow[key];

          // Проверка на массив, т.к. при стандартном приведении массива в строку JS убирает скобки, а они нам нужны для будущего парсинга
          if (Array.isArray(dataRow[key])) {
            value = `["${dataRow[key].join('","')}"]`;
          }

          colorNode.dataset[key] = value;
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
    this.colorsNodes.forEach((colorNode: HTMLImageElement, index: number) => {
      Faze.Events.listener(
        this.config.changeOnHover ? 'mouseenter' : 'click',
        colorNode,
        () => {
          Faze.Helpers.activateItem(this.colorsNodes, index, 'faze-active');

          this.change(colorNode);
        }
      );
    });
  }

  /**
   * Изменение цвета
   *
   * @param {HTMLImageElement} colorNode DOM элемент выбранного цвета
   */
  private change(colorNode: HTMLImageElement): void {
    // Изменяем выбранный цвет
    this.selectedColorNode = colorNode;

    Object.keys(colorNode.dataset).forEach((key: string) => {
      this.changeParam(key);
    });

    // Вызываем пользовательскую функцию
    this.changeCallbackCall();
  }

  /**
   * Выполняет пользовательскую функцию, если она определена в data-атрибутах.
   *
   * Функция ищет data-атрибут `data-faze-colorchanger-function-<key>`, где <key> - имя параметра,
   * например `data-faze-colorchanger-function-price` для параметра `price`.
   * Если атрибут найден, то функция, указанная в его значении, будет вызвана с параметрами:
   *  - node: DOM-элемент, на который навешен модуль
   *  - colorNode: DOM-элемент выбранного цвета
   *  - data: данные, полученные из data-атрибута `data-faze-colorchanger-data`
   *  - key: имя параметра
   *
   * @param key Ключ параметра, для которого выполняется функция.
   * @param value Значение параметра.
   * @param nodes DOM элементы для проставления значений
   *
   * @returns true, если функция найдена и выполнена, иначе false.
   */
  private evaluateParamFunction(key: string, value: string, nodes: NodeListOf<HTMLElement>): boolean {
    const functionKey: string = `fazeColorchangerFunction${key.charAt(0).toUpperCase() + key.slice(1)}`;
    if (functionKey in this.node.dataset) {
      const functionName: string | undefined = this.node.dataset[functionKey];
      if (typeof functionName === 'string' &&
        functionName in window &&
        (window as any)[functionName] instanceof Function) {
        (window as any)[functionName]({
          node: this.node,
          colorNode: this.selectedColorNode,
          data: this.data,
          key,
          value,
          nodes
        });

        return true;
      }

      return false;
    }

    return false;
  }

  /**
   * Изменяем данные в DOM элементе
   *
   * @param {string} key Ключ, необходим если нужно менять data атрибут
   */
  private changeParam(key: string): void {
    // Получаем значение параметра
    const value: string | undefined = this.selectedColorNode?.dataset[key];
    if (!value) {
      return;
    }

    // Получаем DOM элементы, которые нужно изменить
    const nodesToChange = this.node.querySelectorAll<HTMLElement>(`[data-faze-colorchanger="${key}"]`);

    // Если есть пользовательская функция, то вызываем ее
    if (this.evaluateParamFunction(key, value, nodesToChange)) {
      return;
    }

    nodesToChange
      .forEach((node: HTMLElement) => {
        const types = (node.dataset.fazeColorchangerType || 'text').split(',');
        const name = node.dataset.fazeColorchangerName;

        types.forEach((type: string) => {
          switch (type) {
            case 'src':
              (node as HTMLImageElement).src = value;
              break;
            case 'href':
              (node as HTMLAnchorElement).href = value;
              break;
            case 'data':
              node.dataset[name || key] = value;
              break;
            case 'text':
            default:
              node.textContent = value;
          }
        });
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
      showIfOne: (node.dataset.fazeColorchangerShowIfOne || 'false') === 'true',
      perRow: parseInt(node.dataset.fazeColorchangerPerRow || '4', 10),
      direction:
        node.dataset.fazeColorchangerDirection === 'horizontal'
          ? 'horizontal'
          : 'vertical',
    });
  }
}

export default ColorChanger;
