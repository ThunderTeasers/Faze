/**
 * Плагин "шагов"
 *
 * Плагин представляет из себя возможность создания многоступенчатого интерфейса с кнопками "Вперёд" и "Назад"
 *
 * Автор: Ерохин Максим
 * Дата: 02.11.2019
 */

import './Steps.scss';
import Faze from '../../Core/Faze';
import Logger from '../../Core/Logger';
import Helpers from '../../Helpers/Helpers';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   index - номер шага
 *   bodyNode - DOM элемент тела ступени
 */
interface CallbackData {
  bodyNode: HTMLElement | null;
  index: number;
}

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   index - номер шага
 *   paths - выбранные пути
 */
interface StepData {
  index: number;
  paths: string[];
}

/**
 * Структура конфига ступеней
 *
 * Содержит:
 *   formMode   - режим формы, в нём кнопка следующего шага будет недоступна пока не заполнены все обязательные поля формы на текущем шаге
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся при успешном создании модуля
 *     changed  - пользовательская функция, исполняющаяся при изменении шага
 *     finished - пользовательская функция, исполняющаяся при завершении прохода по шагам
 */
interface Config {
  formMode: boolean;
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    beforeFinished?: (data: CallbackData) => void;
    finished?: (data: CallbackData) => void;
    afterFinished?: (data: CallbackData) => void;
  };
}

/**
 * Класс шагов
 */
class Steps {
  // DOM элемент при наведении на который появляется
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент заголовков шагов
  readonly headersNodes: NodeListOf<HTMLElement>;

  // DOM элемент тел шагов
  readonly bodiesNodes: NodeListOf<HTMLElement>;

  // Выбранные пути
  readonly stepsData: StepData[];

  // Индекс текущего шага
  currentStepIndex: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект "шагов"!');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Steps:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-steps-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      formMode: true,
      callbacks: {
        created: undefined,
        changed: undefined,
        beforeFinished: undefined,
        finished: undefined,
        afterFinished: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    // Инициализация переменных
    this.node = node;

    this.headersNodes = node.querySelectorAll('.faze-steps-header');
    this.bodiesNodes = node.querySelectorAll('.faze-steps-body');

    this.currentStepIndex = 0;
    this.stepsData = [];

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка стандартных классов
    this.node.classList.add('faze-steps');
    this.node.classList.add('faze-steps-initialized');

    this.activateStep(0);

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          bodyNode: this.bodiesNodes[0],
          index: this.currentStepIndex,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.bindButtons();

    if (this.config.formMode) {
      this.bindFormInputs();
    }
  }

  /**
   * Навешивание событий на элементы формы, если включен флаг "formMode"
   *
   * @private
   */
  private bindFormInputs() {
    // Проходимся по всем шагам
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      // DOM элементы полей ввода
      const inputsNodes: NodeListOf<HTMLInputElement> = bodyNode.querySelectorAll<HTMLInputElement>('input[required], select[required], textarea[required]');

      // Если если поля, то блокируем кнопки перехода
      if (inputsNodes.length > 0) {
        // Блокировка кнопок
        this.lockButton(bodyNode);

        // Проходимся по всем полям ввода
        Faze.Events.listener(['keyup', 'change'], inputsNodes, () => {
          this.bindCheckSteps(bodyNode, inputsNodes);
        });
      }
    });
  }

  /**
   * Навешивание события на проверку заполненности обязательных полей текущего шага
   *
   * @param bodyNode    - DOM элемент тела текущего шага
   * @param inputsNodes - DOM элементы инпутов текущего шага
   */
  private bindCheckSteps(bodyNode: HTMLElement, inputsNodes: NodeListOf<HTMLInputElement>): void {
    // Если на шаге всё заполнено, то разблокируем кнопки
    if (this.checkStepInputs(inputsNodes)) {
      this.unlockButton(bodyNode);
    } else {
      this.lockButton(bodyNode);
    }
  }

  /**
   * Навешивание событий на кнопки изменения состояния шага
   *
   * @private
   */
  private bindButtons(): void {
    this.bindButtonsNext();
    this.bindButtonsBack();
    this.bindButtonsExit();
  }

  /**
   * Навешивание событий на кнопки "Далее"
   *
   * @private
   */
  private bindButtonsNext(): void {
    this.bodiesNodes.forEach((bodyNode) => {
      Faze.Events.click(bodyNode.querySelectorAll('.faze-steps-next'), () => {
        // Валиден ли шаг
        let isValid = true;

        // Проверка на валидность инпутов на шаге
        bodyNode.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input:not([type="checkbox"]):not([type="radio"]), textarea, select').forEach((inputNode: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
          isValid = inputNode.reportValidity();
        });

        // Если шаг валиден, идем дальше
        if (isValid) {
          this.collectData(bodyNode);

          this.currentStepIndex += 1;
          if (this.currentStepIndex > this.bodiesNodes.length) {
            this.currentStepIndex = this.bodiesNodes.length;
          }

          this.activateStep(this.currentStepIndex);
        }
      });
    });
  }

  /**
   * Сбор данных
   *
   * @param {HTMLElement} bodyNode DOM элемент тела текущего шага
   *
   * @private
   */
  private collectData(bodyNode: HTMLElement): void {
    const stepData: StepData = {
      index: this.currentStepIndex,
      paths: this.collectPaths(bodyNode),
    };

    // Если такой шаг уже был, то перезаписываем данные, если нет, то пушим новые
    if (this.stepsData[this.currentStepIndex]) {
      this.stepsData[this.currentStepIndex] = stepData;
    } else {
      this.stepsData.push(stepData);
    }
  }

  /**
   * Сбор выбранных путей в шаге
   *
   * @param {HTMLElement} bodyNode DOM элемент тела текущего шага
   *
   * @private
   */
  private collectPaths(bodyNode: HTMLElement): string[] {
    return Array.from(bodyNode.querySelectorAll<HTMLInputElement>('input[type="radio"][data-faze-steps-path]:checked')).map((inputNode) => inputNode.dataset.fazeStepsPath || '');
  }

  /**
   * Навешивание событий на кнопки "Далее"
   *
   * @private
   */
  private bindButtonsBack(): void {
    this.bodiesNodes.forEach((bodyNode) => {
      Faze.Events.click(bodyNode.querySelectorAll('.faze-steps-back'), () => {
        this.currentStepIndex -= 1;
        if (this.currentStepIndex < 0) {
          this.currentStepIndex = 0;
        }

        this.activateStep(this.currentStepIndex);
      });
    });
  }

  /**
   * Навешивание событий на кнопки "Далее"
   *
   * @private
   */
  private bindButtonsExit(): void {
    this.bodiesNodes.forEach((bodyNode) => {
      bodyNode.querySelectorAll('.faze-steps-finish').forEach((buttonFinishNode) => {
        buttonFinishNode.addEventListener('click', (event) => {
          event.preventDefault();

          // Вызываем пользовательский метод
          if (typeof this.config.callbacks.beforeFinished === 'function') {
            try {
              this.config.callbacks.beforeFinished({
                bodyNode: this.bodiesNodes[0],
                index: this.currentStepIndex,
              });
            } catch (error) {
              this.logger.error(`Ошибка исполнения пользовательского метода "beforeFinished": ${error}`);
            }
          }

          this.currentStepIndex += 1;
          this.activateStep(this.bodiesNodes.length - 1);

          // Вызываем пользовательский метод
          if (typeof this.config.callbacks.finished === 'function') {
            try {
              this.config.callbacks.finished({
                bodyNode: this.bodiesNodes[0],
                index: this.currentStepIndex,
              });
            } catch (error) {
              this.logger.error(`Ошибка исполнения пользовательского метода "finished": ${error}`);
            }
          }

          // Вызываем пользовательский метод
          if (typeof this.config.callbacks.afterFinished === 'function') {
            try {
              this.config.callbacks.afterFinished({
                bodyNode: this.bodiesNodes[0],
                index: this.currentStepIndex,
              });
            } catch (error) {
              this.logger.error(`Ошибка исполнения пользовательского метода "afterFinished": ${error}`);
            }
          }
        });
      });
    });
  }

  /**
   * Проверка шага на то что все поля ввода заполнены
   *
   * @param inputsNodes - DOM элементы полей ввода
   *
   * @private
   */
  private checkStepInputs(inputsNodes: NodeListOf<HTMLInputElement>): boolean {
    let isValid = true;

    // Родительский элемент для всех чекбоксов,
    const parentNode: HTMLElement | Document = inputsNodes[0].closest<HTMLElement>('.faze-steps-body') || document;

    inputsNodes.forEach((inputNode) => {
      // Проверка, чтобы исключить невидимые элементы
      if (!Faze.Helpers.isElementVisible(inputNode)) {
        return;
      }

      // Проверка, является ли инпут чекбоксом
      const isCheckboxChecked = inputNode.type === 'checkbox' ? Helpers.isCheckboxChecked(inputNode.name, parentNode) : true;

      // Проверка, является ли инпут радио кнопкой
      const isRadioChecked = inputNode.type === 'radio' ? Helpers.isRadioChecked(inputNode.name, parentNode) : true;

      // Проверка на валидность
      if (!inputNode.value || !isCheckboxChecked || !isRadioChecked) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Блокируем кнопки на шаге
   *
   * @param bodyNode - DOM элемент шага
   */
  private lockButton(bodyNode: HTMLElement): void {
    bodyNode.querySelectorAll<HTMLButtonElement>('.faze-steps-finish, .faze-steps-next').forEach((buttonNode: HTMLButtonElement) => {
      buttonNode.disabled = true;
      buttonNode.classList.add('disabled');
    });
  }

  /**
   * Разблокируем кнопки на шаге
   *
   * @param bodyNode - DOM элемент шага
   */
  private unlockButton(bodyNode: HTMLElement): void {
    bodyNode.querySelectorAll<HTMLButtonElement>('.faze-steps-finish, .faze-steps-next').forEach((buttonNode: HTMLButtonElement) => {
      buttonNode.disabled = false;
      buttonNode.classList.remove('disabled');
    });
  }

  /**
   * Активация шака, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param index - индекс шага для активации
   */
  activateStep(index: number): void {
    this.headersNodes.forEach((headerNode, headerIndex) => {
      headerNode.classList.toggle('faze-active', headerIndex <= index);
    });

    this.bodiesNodes.forEach((bodyNode, bodyIndex) => {
      bodyNode.classList.toggle('faze-active', bodyIndex === index);
    });

    // Активания выбранных ранее путей
    this.activatePaths(this.bodiesNodes[index]);

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.changed === 'function' && index !== 0) {
      try {
        this.config.callbacks.changed({
          bodyNode: this.bodiesNodes[index],
          index: this.currentStepIndex,
        });
      } catch (error) {
        console.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
      }
    }
  }

  /**
   * Активания выбранных ранее путей
   *
   * @param {HTMLElement} bodyNode DOM элемент тела текущего шага
   *
   * @private
   */
  private activatePaths(bodyNode: HTMLElement): void {
    this.stepsData.forEach((stepData: StepData) => {
      stepData.paths.forEach((path: string) => {
        bodyNode.querySelectorAll<HTMLElement>('.faze-steps-path[data-faze-steps-path]').forEach((foundNode: HTMLElement) => {
          foundNode.classList.toggle('faze-steps-path-selected', foundNode.dataset.fazeStepsPath === path);
        });
      });
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param stepsNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(stepsNode: HTMLElement): void {
    new Faze.Steps(stepsNode, {
      formMode: (stepsNode.dataset.fazeStepsFormMode || 'true') === 'true',
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="steps"]', (stepsNode: HTMLElement) => {
      Steps.initializeByDataAttributes(stepsNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="steps"]').forEach((stepsNode: HTMLElement) => {
      Steps.initializeByDataAttributes(stepsNode);
    });
  }
}

export default Steps;
