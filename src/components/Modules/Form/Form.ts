/**
 * Плагин формы
 *
 * Автор: Ерохин Максим
 * Дата: 06.12.2024
 */

import './Form.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   node - DOM элемент где происходит работа модуля
 *   inputsNode - DOM элементы инпутов
 */
interface CallbackData {
  node: HTMLElement;
  inputsNode: NodeListOf<HTMLInputElement>;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после сабмита формы
 */
interface Config {
  callbacks: {
    created?: (data: CallbackData) => void;
    submitted?: (data: CallbackData) => void;
  };
}

/**
 * Типы проверок
 */
enum Type {
  None = 1,
  Required,
  Regex,
}

/**
 * Структура информации об инпуте
 */
type InputInfo = {
  node: HTMLInputElement;
  type: Type;
  checked: boolean;
  message: string;
};

/**
 * Класс
 */
class Form extends Module {
  // DOM элемент подсказки
  hintNode: HTMLDivElement;

  // DOM элементы инпутов
  inputsNodes: NodeListOf<HTMLInputElement>;

  /**
   * Стандартный конструктор
   *
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Config} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      callbacks: {
        created: undefined,
        submitted: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Form',
    });
  }

  /**
   * Инициализация
   *
   * @protected
   */
  protected initialize(): void {
    super.initialize();

    this.inputsNodes = this.node.querySelectorAll<HTMLInputElement>(
      '[data-faze-form-input]'
    );
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindInputs();
    this.bindFocus();
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void {
    super.build();

    this.buildHint();
  }

  /**
   * Навешивание событий на инпуты
   *
   * Навешивает на каждый инпут событие input, которое
   * вызывает метод checkInput
   *
   * @private
   */
  private bindInputs(): void {
    this.inputsNodes.forEach((inputNode: HTMLInputElement) => {
      inputNode.addEventListener('input', () => {
        this.checkInput(inputNode);
      });
    });
  }

  /**
   * Навешивание событий на инпуты
   *
   * Навешивает на каждый инпут событие focus, которое
   * вызывает метод checkInput
   *
   * @private
   */
  private bindFocus(): void {
    this.inputsNodes.forEach((inputNode: HTMLInputElement) => {
      inputNode.addEventListener('focus', () => {
        this.updateInput(this.checkInput(inputNode));
      });
    });
  }

  private updateInput(inputInfo: InputInfo): void {
    inputInfo.node.classList.toggle(
      'faze-form-input-error',
      !inputInfo.checked
    );
  }

  /**
   * Проверка инпута
   *
   * Метод вызывается при изменении значения инпута,
   * и проверяет его на соответствие правилу,
   * которое было указано в data атрибуте "data-faze-form-rule"
   *
   * @param {HTMLInputElement} inputNode DOM элемент инпута
   * @private
   */
  private checkInput(inputNode: HTMLInputElement): InputInfo {
    // Тип правила
    const type = this.getRuleType(inputNode);

    // Информация об инпуте
    const inputInfo: InputInfo = {
      message: '',
      type,
      checked: false,
      node: inputNode,
    };

    switch (type) {
      case Type.Required:
        break;
      case Type.Regex:
        break;
      case Type.None:
      default:
        break;
    }

    return inputInfo;
  }

  private getRuleType(inputNode: HTMLInputElement): Type {
    return Type.None;
  }

  /**
   * Построение подсказки
   *
   * @private
   */
  private buildHint(): void {
    this.hintNode = Faze.Helpers.createElement(
      'div',
      {},
      {},
      this.node,
      'faze-form-hint'
    );
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param {HTMLElement} node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Form(node, {});
  }
}

export default Form;
