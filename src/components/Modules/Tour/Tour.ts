/**
 * Плагин табов
 *
 * Модуль табов представляет собой набор "заголовков" связанных с набором "тел" через data атрибут. Одновременно может отображаться
 * только одно "тело", какое именно отображается, зависит от того, на какой "заголовок" нажали. По умолчанию отображается первый.
 *
 * Автор: Ерохин Максим
 * Дата: 08.05.2024
 */

import './Tour.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   group - Группа
 */
interface CallbackData {
  group: string;
}

interface StepData {
  index: number;
  text: string;
  side: 'left' | 'right' | 'bottom' | 'top';
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   group - Группа
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  group: string;
  callbacks: {
    changed?: (activeTabData: CallbackData) => void;
  };
}

/**
 * Класс табов
 */
class Tour extends Module {
  // Данные шагов
  private _stepsData: StepData[];

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент на который навешивается модуль
   * @param config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      group: 'default',
      callbacks: {
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Tour',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    super.initialize();

    this.initializeSteps();

    console.log(this._stepsData);
  }

  /**
   * Инициализация шагов тура для дальнейшей работы
   *
   * @private
   */
  private initializeSteps(): void {
    this._stepsData = Array.from(this.node.querySelectorAll<HTMLElement>(`[data-faze-tour-step="${this.config.group}"]`))
      .map(
        (stepNode, index) =>
          ({
            index: parseInt(stepNode.dataset.fazeTourStepIndex || index.toString(), 10),
            text: stepNode.dataset.fazeTourStepText || '',
            side: stepNode.dataset.fazeTourStepSide || 'right',
          } as StepData)
      )
      .sort((stepA, stepB) => stepA.index - stepB.index);
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {}

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Tour(node, {
      group: node.dataset.fazeTourGroup,
    });
  }
}

export default Tour;
