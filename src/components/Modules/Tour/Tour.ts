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
 *   node - HTML элемент на который нужно ставить подсказку
 *   step - данные шага
 *   hint - данные подсказки
 */
interface CallbackData {
  group: string;
  node: HTMLElement;
  step: StepData;
  hind: HintData;
}

/**
 * Структура объекта шага
 *
 * Содержит:
 *   index - Индекс шага
 *   text - Контент подсказки
 *   side - Сторона где появляется подсказка
 *   node - HTML элемент куда нужно поставить подсказку
 */
interface StepData {
  index: number;
  text: string;
  side: 'left' | 'right' | 'bottom' | 'top';
  node: HTMLElement;
}

/**
 * Структура объекта подсказки
 *
 * Содержит:
 *   node - HTML элемент подсказки
 *   btnCloseNode - HTML элемент кнопки закрытия
 *   bodyNode - HTML элемент тела
 *   btnNextNode - HTML элемент кнопки "Следующая"
 *   btnPrevNode - HTML элемент кнопки "Предыдущая"
 *   pagesNodes - HTML элемент пагинации
 */
interface HintData {
  node: HTMLElement;
  btnCloseNode: HTMLButtonElement;
  bodyNode: HTMLElement;
  btnNextNode: HTMLButtonElement;
  btnPrevNode: HTMLButtonElement;
  pagesNodes: HTMLDivElement[];
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   group - Группа
 *   padding - Отступы подсказки
 *   pages - Показывать пагинацию
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  group: string;
  padding: number;
  pages: boolean;
  steps: StepData[];
  callbacks: {
    changed?: (data: CallbackData) => void;
  };
}

/**
 * Класс табов
 */
class Tour extends Module {
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
      pages: true,
      padding: 10,
      steps: [],
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
      pagesNodes: [],
    };

    // Если есть пагинация
    if (this.config.pages) {
      const pagesNode: HTMLDivElement = Faze.Helpers.createElement('div', {}, {}, footerNode, 'faze-tour-pages');
      this.config.steps.forEach(() => {
        const pageNode: HTMLDivElement = Faze.Helpers.createElement('div', {}, {}, pagesNode, 'faze-tour-page');
        this._hintData.pagesNodes?.push(pageNode);
      });
    }

    // Добавляем всё на страницу
    document.body.appendChild(this._hintWrapperNode);
  }

  /**
   * Изменение пагинации
   *
   * @private
   */
  private changePagination(): void {
    Faze.Helpers.activateItem(this._hintData.pagesNodes, this._index, 'faze-active');
  }

  /**
   * Изменение текущего шага
   */
  private changeStep(): void {
    const step = this.config.steps[this._index];
    if (step) {
      // Позицианируем подсвеченую область
      this._hintWrapperNode.style.top = `${step.node.offsetTop - this.config.padding}px`;
      this._hintWrapperNode.style.left = `${step.node.offsetLeft - this.config.padding}px`;
      this._hintWrapperNode.style.width = `${step.node.offsetWidth + this.config.padding * 2}px`;
      this._hintWrapperNode.style.height = `${step.node.offsetHeight + this.config.padding * 2}px`;

      // Настраиваем подсказку
      this._hintData.node.className = `faze-tour-hint faze-tour-hint-side-${step.side || 'bottom'}`;
      this._hintData.bodyNode.innerHTML = step.text;

      // Если это последний слайд, меняем надпись
      if (this._index >= this.config.steps.length - 1) {
        this._hintData.btnNextNode.textContent = 'Завершить';
      } else {
        this._hintData.btnNextNode.textContent = 'Следующая';
      }

      // Если это первый слайд, то скрываем кнопку "Назад"
      this._hintData.btnPrevNode.classList.toggle('faze-hidden', this._index === 0);

      // Проверка видимости подсказки на экране
      this.checkHintVisibility();

      // Если есть пагинация, изменяем её активный элемент
      if (this.config.pages) {
        this.changePagination();
      }

      // Выполнение пользовательской функции
      if (typeof this.config.callbacks.changed === 'function') {
        try {
          this.config.callbacks.changed({
            group: this.config.group,
            node: this.node,
            step,
            hint: this._hintData,
          });
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "changed": ${error}`);
        }
      }
    }
  }

  /**
   * Проверка видимости подсказки на экране
   */
  private checkHintVisibility(): void {
    // if (!Faze.Helpers.isElementInViewport(this._hintData.btnNextNode)) {
    //   window.scrollTo(0, parseInt(this._hintWrapperNode.style.top, 10) - 50);
    // }
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    this.bindNextButton();
    this.bindPrevButton();
    this.bindCloseButton();
  }

  /**
   * Навешивание событий на кнопку закрытия
   *
   * @private
   */
  private bindCloseButton(): void {
    Faze.Events.click(this._hintData.btnCloseNode, () => {
      this.close();
    });
  }

  /**
   * Навешивание событий на переключение шага вперед
   */
  private bindNextButton(): void {
    Faze.Events.click(this._hintData.btnNextNode, () => {
      if (this._index < this.config.steps.length - 1) {
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
    // Группа
    const group: string = node.dataset.fazeTourGroup || 'default';

    // Шаги
    const steps: StepData[] = Array.from(node.querySelectorAll<HTMLElement>(`[data-faze-tour-step="${group}"]`))
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

    new Tour(node, {
      group,
      steps,
      pages: (node.dataset.fazeTourPages || 'true') === 'true',
      padding: parseInt(node.dataset.fazeTourPadding || '10', 10),
    });
  }
}

export default Tour;
