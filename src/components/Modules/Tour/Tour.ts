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
 *   title - Заголовок
 *   text - Контент подсказки
 *   side - Сторона где появляется подсказка
 *   node - HTML элемент куда нужно поставить подсказку
 */
interface StepData {
  index: number;
  title: string;
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
 *   headerNode - HTML элемент шапки
 *   mainNode - HTML элемент тела
 *   footerNode - HTML элемент подвала
 *   btnNextNode - HTML элемент кнопки "Следующая"
 *   btnPrevNode - HTML элемент кнопки "Предыдущая"
 *   pagesNodes - HTML элемент пагинации
 */
interface HintData {
  node: HTMLElement;
  btnCloseNode: HTMLButtonElement;
  headerNode: HTMLElement;
  mainNode: HTMLElement;
  footerNode: HTMLElement;
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
 *     created - пользовательская функция, исполняющаяся после инициализации
 *     changed - пользовательская функция, исполняющаяся после изменения шага
 *     closed - пользовательская функция, исполняющаяся после закрытия
 */
interface Config {
  group: string;
  padding: number;
  pages: boolean;
  steps: StepData[];
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    closed?: (data: CallbackData) => void;
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
  private _currentStep: StepData;

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
        created: undefined,
        changed: undefined,
        closed: undefined,
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

    // Выполнение пользовательской функции
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.changed({
          group: this.config.group,
          node: this.node,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
    }

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

    // Выполнение пользовательской функции
    if (typeof this.config.callbacks.closed === 'function') {
      try {
        this.config.callbacks.changed({
          group: this.config.group,
          node: this.node,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "closed": ${error}`);
      }
    }
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
    const headerNode: HTMLElement = Faze.Helpers.createElement('header', {}, {}, hintNode, 'faze-tour-hint-header');
    const mainNode: HTMLElement = Faze.Helpers.createElement('main', {}, {}, hintNode, 'faze-tour-hint-main');
    const footerNode: HTMLElement = Faze.Helpers.createElement('footer', {}, {}, hintNode, 'faze-tour-hint-footer');
    const btnPrevNode: HTMLButtonElement = Faze.Helpers.createElement('button', {}, {}, footerNode, 'faze-tour-hint-btn-prev');
    btnPrevNode.textContent = 'Предыдущая';
    const btnNextNode: HTMLButtonElement = Faze.Helpers.createElement('button', {}, {}, footerNode, 'faze-tour-hint-btn-next');
    btnNextNode.textContent = 'Следующая';
    this._hintData = {
      node: hintNode,
      btnCloseNode,
      headerNode,
      mainNode,
      footerNode,
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
   * Обновление позиции подсказки
   *
   * @private
   */
  private updatePosition(): void {
    if (this._currentStep.node) {
      // Позицианируем подсвеченую область
      this._hintWrapperNode.classList.remove('faze-tour-hint-wrapper-float');
      this._hintWrapperNode.style.top = `${this._currentStep.node.offsetTop - this.config.padding}px`;
      this._hintWrapperNode.style.left = `${this._currentStep.node.offsetLeft - this.config.padding}px`;
      this._hintWrapperNode.style.width = `${this._currentStep.node.offsetWidth + this.config.padding * 2}px`;
      this._hintWrapperNode.style.height = `${this._currentStep.node.offsetHeight + this.config.padding * 2}px`;
    } else {
      this._hintWrapperNode.classList.add('faze-tour-hint-wrapper-float');
      this._hintWrapperNode.style.top = `${window.innerHeight / 2 - this._hintData.node.clientHeight / 2}px`;
      this._hintWrapperNode.style.left = `${document.body.clientWidth / 2 - this._hintData.node.clientWidth / 2}px`;
    }
  }

  /**
   * Изменение текущего шага
   *
   * @private
   */
  private changeStep(): void {
    this._currentStep = this.config.steps[this._index];
    if (this._currentStep) {
      // Обновление позиции
      this.updatePosition();

      // Настраиваем подсказку
      this._hintData.node.className = `faze-tour-hint faze-tour-hint-side-${this._currentStep.node ? this._currentStep.side || 'bottom' : 'float'}`;
      this._hintData.headerNode.innerHTML = this._currentStep.title || '';
      this._hintData.mainNode.innerHTML = this._currentStep.text || '';

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
            step: this._currentStep,
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
    console.log(this._hintWrapperNode, this._hintWrapperNode.style.top);

    setTimeout(() => {
      if (!Faze.Helpers.isElementInViewport(this._hintWrapperNode, 0, true)) {
        window.scrollTo({
          top: parseInt(this._hintWrapperNode.style.top, 10) - 200,
          left: 0,
          behavior: 'smooth',
        });
      }
    }, 500);
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    super.bind();

    this.bindNextButton();
    this.bindPrevButton();
    this.bindCloseButton();
  }

  /**
   * Ресайз окна
   */
  protected resize(): void {
    this.updatePosition();
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
