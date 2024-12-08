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
 * Структура правил
 */
type Rule = {
  message: string;
  rule: RegExp;
  type: Type;
  valid: boolean;
};

/**
 * Структура информации об инпуте
 */
type InputData = {
  node: HTMLInputElement;
  rules: Rule[];
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
      '[data-faze-form-rules]'
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
        this.updateInput(this.checkInput(inputNode));
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

  /**
   * Обновляет инпут
   *
   * Метод вызывается при изменении значения инпута,
   * и обновляет статус инпута на основе информации,
   * полученной из inputData
   *
   * @param {InputData} inputData Структура информации об инпуте
   * @private
   */

  private updateInput(inputData: InputData): void {
    // Есть хоть одно неправильное значение
    const isInvalid = inputData.rules.some((rule) => !rule.valid);

    inputData.node.classList.toggle('faze-form-input-invalid', isInvalid);

    if (isInvalid) {
      this.showHint(inputData);
    } else {
      this.hideHint();
    }
  }

  /**
   * Показывает подсказку
   *
   * Метод вызывается, когда возникла ошибка валидации,
   * и показывает подсказку с ошибкой
   *
   * @param {InputData} inputData Структура информации об инпуте
   * @private
   */
  private showHint(inputData: InputData): void {
    this.buildRules(inputData);

    // Позиционируем подсказку
    this.hintNode.classList.add('active');
    this.hintNode.style.top = `${
      inputData.node.offsetTop +
      inputData.node.getBoundingClientRect().height +
      4
    }px`;
    this.hintNode.style.left = `${inputData.node.offsetLeft}px`;
  }

  /**
   * Генерирует HTML код для подсказки
   *
   * Метод берёт информацию из inputData.rules,
   * и генерирует HTML код для подсказки,
   * который будет отображаться у инпута
   *
   * @param {InputData} inputData Структура информации об инпуте
   * @private
   */
  private buildRules(inputData: InputData): void {
    let rulesHTML = '';
    inputData.rules.forEach((rule: Rule) => {
      rulesHTML += `<div class="faze-form-rule ${
        rule.valid ? 'faze-form-rule-valid' : 'faze-form-rule-invalid'
      }">${rule.message}</div>`;
    });

    this.hintNode.innerHTML = rulesHTML;
  }

  /**
   * Скрывает подсказку
   *
   * Метод вызывается, когда необходимо скрыть
   * подсказку, возникшую при ошибке валидации.
   *
   * @private
   */
  private hideHint(): void {
    this.hintNode.classList.remove('active');
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
  private checkInput(inputNode: HTMLInputElement): InputData {
    // Правило
    const rules: Rule[] = this.parseRules(inputNode);

    rules.forEach((rule: Rule) => {
      // Проверка на соответствие правилу
      switch (rule.type) {
        case Type.Regex:
          rule.valid = !!inputNode.value.match(new RegExp(rule.rule || ''));

          break;
        case Type.None:
        case Type.Required:
        default:
          rule.valid = inputNode.checkValidity();
          break;
      }
    });

    // Информация об инпуте
    const inputData: InputData = {
      node: inputNode,
      rules,
    };

    return inputData;
  }

  private parseRules(inputNode: HTMLInputElement): Rule[] {
    let result: Rule[] = [];

    const jsonData = Faze.Helpers.parseJSON(
      inputNode.dataset.fazeFormRules?.replace(/\\/g, '|||') || '[]'
    );
    if (Array.isArray(result)) {
      result = jsonData.map((jsonData: any) => {
        if (jsonData.rule === 'validation') {
          return {
            message: jsonData.message,
            rule: 'validation',
            type: Type.Required,
          };
        } else {
          return {
            message: jsonData.message,
            rule: new RegExp((jsonData.rule || '').replace(/\|\|\|/g, '\\')),
            type: Type.Regex,
          };
        }
      });
    }

    return result;
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
