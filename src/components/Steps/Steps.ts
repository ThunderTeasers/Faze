/**
 * Плагин "шагов"
 *
 * Плагин представляет из себя возможность создания многоступенчатого интерфейса с кнопками "Вперёд" и "Назад"
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 02.11.2019
 */

import './Steps.scss';
import Faze from '../Core/Faze';
import Logger from '../Core/Logger';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   bodyNode - DOM элемент тела ступени
 */
interface CallbackData {
  bodyNode: HTMLElement | null;
}

/**
 * Структура конфига ступеней
 *
 * Содержит:
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся при успешном создании спойлера
 *     changed  - пользовательская функция, исполняющаяся при изменении видимости спойлера
 */
interface Config {
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
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
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);

    // Инициализация переменных
    this.node = node;

    this.headersNodes = node.querySelectorAll('.faze-steps-header');
    this.bodiesNodes = node.querySelectorAll('.faze-steps-body');

    this.currentStepIndex = 0;

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
      bodyNode.querySelectorAll('.faze-steps-next').forEach((buttonNextNode) => {
        buttonNextNode.addEventListener('click', (event) => {
          event.preventDefault();

          this.currentStepIndex += 1;
          if (this.currentStepIndex > this.bodiesNodes.length) {
            this.currentStepIndex = this.bodiesNodes.length;
          }

          this.activateStep(this.currentStepIndex);
        });
      });
    });
  }

  /**
   * Навешивание событий на кнопки "Далее"
   *
   * @private
   */
  private bindButtonsBack(): void {
    this.bodiesNodes.forEach((bodyNode) => {
      bodyNode.querySelectorAll('.faze-steps-back').forEach((buttonBackNode) => {
        buttonBackNode.addEventListener('click', (event) => {
          event.preventDefault();

          this.currentStepIndex -= 1;
          if (this.currentStepIndex < 0) {
            this.currentStepIndex = 0;
          }

          this.activateStep(this.currentStepIndex);
        });
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

          this.activateStep(this.bodiesNodes.length - 1);
        });
      });
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

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          bodyNode: this.bodiesNodes[index],
        });
      } catch (error) {
        console.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
      }
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="steps"]', (stepsNode: HTMLElement) => {
      new Faze.Steps(stepsNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="steps"]').forEach((stepsNode: HTMLElement) => {
      new Faze.Steps(stepsNode);
    });
  }
}

export default Steps;
