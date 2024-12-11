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
  inputsData: InputData[];
}

/**
 * Структура конфига
 *
 * Содержит:
 *   hintSide - положение подсказки
 *   hintOffset - смещение подсказки
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после сабмита формы
 */
interface Config {
  hintSide: FazeSide;
  hintOffset: number;
  callbacks: {
    created?: (data: CallbackData) => void;
    input?: (data: CallbackData) => void;
  };
}

/**
 * Типы проверок
 */
enum Type {
  None = 1,
  Required,
  Regex,
  Same,
}

/**
 * Структура правил
 */
type Rule = {
  message: string;
  rule: RegExp;
  type: Type;
  valid: boolean;
  special?: string;
};

/**
 * Структура информации об инпуте
 */
type InputData = {
  node: HTMLInputElement;
  hintDisabled: boolean;
  rules: Rule[];
};

/**
 * Класс
 */
class Form extends Module {
  // DOM элемент подсказки
  hintNode: HTMLDivElement;

  // Данные инпутов
  inputsData: InputData[];

  // DOM элементы кнопок
  buttonsNodes: NodeListOf<HTMLButtonElement>;

  /**
   * Стандартный конструктор
   *
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Config} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      hintOffset: 4,
      hintSide: 'bottom',
      callbacks: {
        created: undefined,
        input: undefined,
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

    // Получение всех кнопок
    this.buttonsNodes = this.node.querySelectorAll<HTMLButtonElement>(
      '[data-faze-form-button], .faze-form-button'
    );

    // Получение всех данных
    this.inputsData = Array.from(
      this.node.querySelectorAll<HTMLInputElement>('[data-faze-form-rules]')
    ).map((inputNode: HTMLInputElement) => ({
      node: inputNode,
      rules: this.parseRules(inputNode),
      hintDisabled: inputNode.dataset.fazeFormHintDisabled === 'true',
    }));

    // Проверка состояния кнопок
    this.checkButtons();

    // Выполнение пользовательской функции "created"
    this.createdCallbackCall();
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
    this.bindClickOutside();
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

  private bindClickOutside(): void {
    Faze.Events.listener('click', window, (event: MouseEvent) => {
      if (
        !Faze.Helpers.isMouseOverlapsNodes(event, [
          ...this.inputsData.map((inputData) => inputData.node),
          this.hintNode,
        ])
      ) {
        this.hideHint();
      }
    });
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
    this.inputsData.forEach((inputsData: InputData) => {
      Faze.Events.listener('input', inputsData.node, () => {
        this.updateInput(inputsData);
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
    this.inputsData.forEach((inputsData: InputData) => {
      Faze.Events.listener('focus', inputsData.node, () => {
        this.updateInput(inputsData);
      });
    });
  }

  /**
   * Проверка кнопок
   *
   * Проверяет, все ли инпуты валидны,
   * и устанавливает состояние кнопок
   *
   * @private
   */
  private checkButtons(): void {
    const isValid = this.inputsData.some((inputsData: InputData) =>
      inputsData.rules.some((rule) => !rule.valid)
    );

    this.buttonsNodes.forEach((buttonNode: HTMLButtonElement) => {
      buttonNode.disabled = isValid;
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
   * @param {boolean} checkNeeded Проверять инпут на соответствие правилам
   * @private
   */
  private updateInput(inputData: InputData, checkNeeded: boolean = true): void {
    // Проверка инпута
    if (checkNeeded) {
      inputData = this.checkInput(inputData);
    }

    // Есть хоть одно неправильное значение
    const isInvalid = inputData.rules.some((rule) => !rule.valid);

    inputData.node.classList.toggle('faze-form-input-invalid', isInvalid);

    if (isInvalid) {
      this.showHint(inputData);
    } else {
      this.hideHint();
    }

    // Проверка состояния кнопок
    this.checkButtons();

    // Выполнение пользовательской функции "input"
    this.inputCallbackCall();
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
    // Не выводим подсказку если она отключена у инпута
    // или если нет сообщения для вывода
    if (
      inputData.hintDisabled ||
      !inputData.rules.some((rule) => rule.message)
    ) {
      this.hideHint();
      return;
    }

    // Построение HTML кода подсказки
    this.buildRules(inputData);

    // Позиционируем подсказку
    this.hintNode.classList.add('active');

    // Позиция инпута
    const position: FazePosition = Faze.Helpers.getElementPosition(
      inputData.node
    );

    switch (this.config.hintSide) {
      case 'top':
        this.hintNode.style.top = `${
          position.y - this.hintNode.offsetHeight - this.config.hintOffset
        }px`;
        this.hintNode.style.left = `${position.x}px`;
        break;
      case 'bottom':
      default:
        this.hintNode.style.top = `${
          position.y +
          inputData.node.getBoundingClientRect().height +
          this.config.hintOffset
        }px`;
        this.hintNode.style.left = `${position.x}px`;
        break;
      case 'left':
        this.hintNode.style.top = `${position.y}px`;
        this.hintNode.style.left = `${
          position.x - this.hintNode.offsetWidth - this.config.hintOffset
        }px`;
        break;
      case 'right':
        this.hintNode.style.top = `${position.y}px`;
        this.hintNode.style.left = `${
          position.x +
          inputData.node.getBoundingClientRect().width +
          this.config.hintOffset
        }px`;
        break;
    }
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
    inputData.rules
      .filter((rule: Rule) => rule.message)
      .forEach((rule: Rule) => {
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
   * @param {InputData} inputData Данные инпута
   * @private
   */
  private checkInput(inputData: InputData): InputData {
    inputData.rules.forEach((rule: Rule) => {
      // Проверка на соответствие правилу
      switch (rule.type) {
        case Type.Regex:
          rule.valid = !!inputData.node.value.match(
            new RegExp(rule.rule || '')
          );

          break;
        case Type.Same:
          // Ищем специальный инпут для проверки
          const specialInputNode = document.querySelector<HTMLInputElement>(
            rule.special || ''
          );

          // Если специальный инпут нашелся, ищем его данные
          const spetialInputData = this.inputsData.find(
            (inputData) => inputData.node === specialInputNode
          );

          // Если данные найдены
          if (spetialInputData) {
            // Проверяем соответствие
            const isSame = inputData.node.value === spetialInputData.node.value;
            rule.valid = isSame;

            // Обновляем правило найденного инпута
            const specialRule: Rule | undefined = spetialInputData.rules.find(
              (rule: Rule) => rule.type === Type.Same
            );

            if (specialRule) {
              specialRule.valid = isSame;

              this.updateInput(spetialInputData, false);
            }
          } else {
            rule.valid = false;
          }

          break;
        case Type.None:
        case Type.Required:
        default:
          rule.valid = inputData.node.checkValidity();
          break;
      }
    });

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
        } else if (jsonData.rule === 'same') {
          return {
            message: jsonData.message,
            rule: 'same',
            special: jsonData.special,
            type: Type.Same,
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
      document.body,
      'faze-form-hint'
    );
  }

  /**
   * Выполнение пользовательской функции "created"
   *
   * @private
   */
  private createdCallbackCall(): void {
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          node: this.node,
          inputsData: this.inputsData,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "created": ${error}`
        );
      }
    }
  }

  /**
   * Выполнение пользовательской функции "input"
   *
   * @private
   */
  private inputCallbackCall(): void {
    if (typeof this.config.callbacks.input === 'function') {
      try {
        this.config.callbacks.input({
          node: this.node,
          inputsData: this.inputsData,
        });
      } catch (error) {
        this.logger.error(
          `Ошибка исполнения пользовательского метода "input": ${error}`
        );
      }
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param {HTMLElement} node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Form(node, {
      hintSide: (node.dataset.fazeFormHintSide || 'bottom') as FazeSide,
      hintOffset: parseInt(node.dataset.fazeFormHintOffset || '4', 10),
    });
  }
}

export default Form;
