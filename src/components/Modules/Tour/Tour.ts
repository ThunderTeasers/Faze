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
import Faze from '../../Core/Faze';

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
  node: HTMLElement;
}

interface HintData {
  node: HTMLElement;
  btnCloseNode: HTMLButtonElement;
  bodyNode: HTMLElement;
  btnNextNode: HTMLButtonElement;
  btnPrevNode: HTMLButtonElement;
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
  padding: number;
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

  // DOM элемент обертки подсказки
  private _hintWrapperNode: HTMLDivElement;

  // DOM элемент подсказки
  private _hintData: HintData;

  // Текущий шаг
  private _index: number;

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
      padding: 10,
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

    // Инициализируем переменные
    this._index = 0;

    this.initializeSteps();
    this.buildHint();

    this.changeStep();
  }

  /**
   * Закрытие подсказок
   */
  private close(): void {
    // Удаляем всё, что связано с модулем
    this._hintWrapperNode.remove();
  }

  /**
   * Генерация HTML кода для подсказки
   */
  private buildHint(): void {
    this._hintWrapperNode = document.createElement('div');
    this._hintWrapperNode.className = 'faze-tour-hint-wrapper';

    // Создаём элементы управления и взаимодействия для окна подсказки
    const hintNode: HTMLElement = Faze.Helpers.createElement('div', {}, {}, this._hintWrapperNode, 'faze-tour-hint');
    const btnCloseNode: HTMLButtonElement = Faze.Helpers.createElement('button', {}, {}, hintNode, 'faze-tour-hint-btn-close');
    btnCloseNode.textContent = '×';
    const bodyNode: HTMLElement = Faze.Helpers.createElement('main', {}, {}, hintNode, 'faze-tour-hint-body');
    const footerNode: HTMLElement = Faze.Helpers.createElement('footer', {}, {}, hintNode, 'faze-tour-hint-footer');
    const btnPrevNode: HTMLButtonElement = Faze.Helpers.createElement('button', {}, {}, footerNode, 'faze-tour-hint-btn-prev');
    btnPrevNode.textContent = 'Предыдущая';
    const btnNextNode: HTMLButtonElement = Faze.Helpers.createElement('button', {}, {}, footerNode, 'faze-tour-hint-btn-next');
    btnNextNode.textContent = 'Следующая';
    this._hintData = {
      node: hintNode,
      btnCloseNode,
      bodyNode,
      btnNextNode,
      btnPrevNode,
    };

    // Добавляем всё на страницу
    document.body.appendChild(this._hintWrapperNode);
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
            node: stepNode,
          } as StepData)
      )
      .sort((stepA, stepB) => stepA.index - stepB.index);
  }

  /**
   * Изменение текущего шага
   */
  private changeStep(): void {
    const stepData = this._stepsData[this._index];
    if (stepData) {
      // Позицианируем подсвеченую область
      this._hintWrapperNode.style.top = `${stepData.node.offsetTop - this.config.padding}px`;
      this._hintWrapperNode.style.left = `${stepData.node.offsetLeft - this.config.padding}px`;
      this._hintWrapperNode.style.width = `${stepData.node.offsetWidth + this.config.padding * 2}px`;
      this._hintWrapperNode.style.height = `${stepData.node.offsetHeight + this.config.padding * 2}px`;

      // Настраиваем подсказку
      this._hintData.node.className = `faze-tour-hint faze-tour-hint-side-${stepData.side}`;
      this._hintData.bodyNode.innerHTML = stepData.text;

      // Если это последний слайд, меняем надпись
      if (this._index >= this._stepsData.length - 1) {
        this._hintData.btnNextNode.textContent = 'Завершить';
      }

      // Если это первый слайд, то скрываем кнопку "Назад"
      this._hintData.btnPrevNode.classList.toggle('faze-hidden', this._index === 0);
    }
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    this.bindNextButton();
    this.bindPrevButton();
  }

  /**
   * Навешивание событий на переключение шага вперед
   */
  private bindNextButton(): void {
    Faze.Events.click(this._hintData.btnNextNode, () => {
      if (this._index < this._stepsData.length - 1) {
        this._index++;
        this.changeStep();
      } else {
        this.close();
      }
    });
  }

  /**
   * Навешивание событий на переключение шага назад
   */
  private bindPrevButton(): void {
    Faze.Events.click(this._hintData.btnPrevNode, () => {
      if (this._index > 0) {
        this._index--;
        this.changeStep();
      }
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Tour(node, {
      group: node.dataset.fazeTourGroup,
      padding: parseInt(node.dataset.fazeTourPadding || '10', 10),
    });
  }
}

export default Tour;
