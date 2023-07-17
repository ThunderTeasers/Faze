/**
 * Плагин слайдера
 *
 * Слайдер представляет из себя UI элемент с одним или несколькими ползунками которые можно двигать мышкой для изменения значения
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 08.03.2018
 */

import './Slider.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   values - Текущие значения
 */
interface CallbackData {
  values: number[];
}

/**
 * Структура конфига слайдера
 *
 * Содержит:
 *   range    - диапазон значений слайдера
 *   points   - координаты ползунков на слайдере
 *   connect  - флаг, указывающий на то, нужно ли заполнять пространство между точками или нет
 *   changeDelay - время задержки отправки события "changed" в миллисекундах
 *   callbacks
 *     created  - пользовательская функция, исполняющийся при успешном создании спойлера
 *     changed  - пользовательская функция, исполняющийся при изменении видимости спойлера
 *     stopped  - пользовательская функция, исполняющаяся после отпускания пальца/мышки
 */
interface Config {
  range: number[];
  points: number[];
  connect: boolean;
  changeDelay: number;
  selectors: {
    inputs?: string;
  };
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    stopped?: (data: CallbackData) => void;
  };
}

/**
 * Класс слайдера
 */
class Slider extends Module {
  // DOM элементы ползунков
  pointsNodes: HTMLElement[];

  // DOM элементы инпутов
  inputsNodes: HTMLInputElement[];

  // Размер ползунка
  pointSize: number;

  // DOM элемент соединительной полоски
  connectNode: HTMLElement | null;

  // Значения слайдера
  values: number[];

  // Отношение ширины слайдера и его возможного максимального значения
  ratio: number;

  constructor(node: HTMLElement, config: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      points: [0, 100],
      range: [0, 100],
      connect: true,
      changeDelay: 1000,
      selectors: {
        inputs: undefined,
      },
      callbacks: {
        created: undefined,
        changed: undefined,
        stopped: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Slider',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    super.initialize();

    // Проверка конфига
    this.checkConfig();

    // Рассчитываем относительную величину
    this.recalculateRatio();

    // Инициализация переменных
    this.pointsNodes = [];
    this.inputsNodes = [];
    this.pointSize = 10;
    this.connectNode = null;
    this.values = this.config.points;

    // Простановка класса, если этого не было сделано руками
    this.node.classList.add('faze-slider');

    // Инициализируем соединительную полоску, если необходимо
    if (this.config.connect) {
      this.createConnect();
    }

    // Инициализируем инпуты, если необходимо
    if (this.config.selectors.inputs) {
      this.initializeInputs();
    }

    // Инициализируем ползунки
    this.initializePoints();

    // Делаем просчёт позиции и размера полоски после инициализации точек
    if (this.config.connect) {
      this.calculateConnect();
    }

    // Вызываем пользовательскую функцию
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          values: this.getValues(),
        });
      } catch (error) {
        return this.logger.error(`Ошибка исполнения пользовательского метода "created", дословно: ${error}!`);
      }
    }
  }

  /**
   * Переинициализация
   */
  reinitialize(config: Partial<Config> = {}) {
    // Очищаем внутренности
    this.node.innerHTML = '';

    // Сборка конфига
    const newConfig = Object.assign(this.config, config);

    // Инициализация
    new Slider(this.node, newConfig);
  }

  /**
   * Инициализация инпутов для вывода значений ползунков
   */
  private initializeInputs(): void {
    this.config.selectors.inputs.split(',').forEach((selector: string) => {
      const inputNode: HTMLInputElement | null = document.querySelector<HTMLInputElement>(selector);
      if (inputNode) {
        this.inputsNodes.push(inputNode);

        // Проставляем начальные значения
        inputNode.value = this.config.points[inputNode.dataset.fazeSliderInput || 0];
      }
    });
  }

  /**
   * Инициализация ползунков
   *
   * @private
   */
  private initializePoints(): void {
    // Создаем ползунки
    this.config.points.forEach((point: number) => {
      this.createPoint(point);
    });
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    super.bind();

    this.bindPoints();
    this.bindInputChange();
  }

  /**
   * Навешивание события на изменение инпута
   */
  private bindInputChange() {
    this.inputsNodes.forEach((inputNode, index) => {
      let timeout: number;

      inputNode.addEventListener('keyup', () => {
        this.setValue(index, parseInt(inputNode.value, 10));

        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          // Вызываем пользовательскую функцию
          if (typeof this.config.callbacks.changed === 'function') {
            try {
              this.config.callbacks.changed({
                values: this.getValues(),
              });
            } catch (error) {
              return this.logger.error(`Ошибка исполнения пользовательского метода "changed", дословно: ${error}!`);
            }
          }
        }, this.config.changeDelay);
      });
    });
  }

  /**
   * Навешивание событий перетаскивания мышкой и пальцем на ползунки
   *
   * @private
   */
  private bindPoints(): void {
    this.pointsNodes.forEach((pointNode, i) => {
      // Начальная позиция мыши
      let startMousePosition = 0;

      // КОнечная позиция мыши
      let endMousePosition = 0;

      // DOM элемент следующего ползунка
      const nextPointNode = <HTMLElement>pointNode.nextSibling;

      // DOM элемент предыдущего ползунка
      const prevPointNode = <HTMLElement>pointNode.previousSibling;

      /**
       * Функция перетаскивания ползунка
       *
       * @param event - событие мыши
       */
      const elementDrag = (event: any): void => {
        // Рассчет новой позиции курсора
        endMousePosition = startMousePosition - (event.clientX || (event.touches ? event.touches[0].clientX : 0));
        startMousePosition = event.clientX || (event.touches ? event.touches[0].clientX : 0);

        // Передвижение ползунка
        this.move(pointNode, nextPointNode, prevPointNode, pointNode.offsetLeft - endMousePosition, i);

        // Просчёт положения и размера соединительной полоски
        if (this.config.connect) {
          this.calculateConnect();
        }

        // Вызываем пользовательскую функцию
        if (typeof this.config.callbacks.changed === 'function') {
          try {
            this.config.callbacks.changed({
              values: this.getValues(),
            });
          } catch (error) {
            return this.logger.error(`Ошибка исполнения пользовательского метода "changed", дословно: ${error}!`);
          }
        }
      };

      /**
       * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
       */
      const endDragElement = (): void => {
        document.removeEventListener('mouseup', <any>endDragElement);
        document.removeEventListener('touchend', <any>endDragElement);

        document.removeEventListener('mousemove', <any>elementDrag);
        document.removeEventListener('touchmove', <any>elementDrag);

        // Просчёт положения и размера соединительной полоски
        if (this.config.connect) {
          this.calculateConnect();
        }

        // Вызываем пользовательскую функцию
        if (typeof this.config.callbacks.stopped === 'function') {
          try {
            this.config.callbacks.stopped({
              values: this.getValues(),
            });
          } catch (error) {
            return this.logger.error(`Ошибка исполнения пользовательского метода "stopped", дословно: ${error}!`);
          }
        }
      };

      /**
       * Функция нажатия на ползунок для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
       *
       * @param event - событие мыши
       */
      const dragMouseDown = (event: MouseEvent) => {
        // Получение позиции курсора при нажатии на элемент
        startMousePosition = event.clientX;

        document.addEventListener('mouseup', <any>endDragElement);
        document.addEventListener('touchend', <any>endDragElement);

        document.addEventListener('mousemove', <any>elementDrag);
        document.addEventListener('touchmove', <any>elementDrag);
      };

      // Навешиваем событие перетаскивания
      pointNode.addEventListener('mousedown', <any>dragMouseDown);
      pointNode.addEventListener('touchstart', <any>dragMouseDown);
    });
  }

  /**
   * Создание соединительной полоски
   */
  createConnect(): void {
    this.connectNode = document.createElement('div');
    this.connectNode.className = 'faze-connect';

    this.node.appendChild(this.connectNode);
  }

  /**
   * Расчет положения и ширины соединительной полоски
   */
  calculateConnect(): void {
    if (this.connectNode) {
      // Ширина - это расстояние между самыми крайними точками
      const width = this.pointsNodes[this.pointsNodes.length - 1].offsetLeft - this.pointsNodes[0].offsetLeft;

      // Половина ширины ползунка
      const halfPointWidth = this.pointsNodes[0].getBoundingClientRect().width / 2;

      // Проверка чтобы размер линии не ушел в минус
      let connectWidth = width - halfPointWidth;
      if (connectWidth < 0) {
        connectWidth = 0;
      }

      // Если только один ползунок, тогда считаем от левого края до него, если несколько то между первым и последним
      if (this.pointsNodes.length === 1) {
        this.connectNode.style.width = `${this.calculateSizeInPercent(this.pointsNodes[0].offsetLeft + halfPointWidth, false)}%`;
        this.connectNode.style.left = '0';
      } else {
        this.connectNode.style.width = `${this.calculateSizeInPercent(connectWidth + halfPointWidth, false)}%`;
        this.connectNode.style.left = `${this.calculateSizeInPercent(this.pointsNodes[0].offsetLeft + halfPointWidth, false)}%`;
      }
    }
  }

  /**
   * Передвижение ползунка
   *
   * @param pointNode     - DOM элемент ползунка
   * @param nextPointNode - DOM элемент следующего ползунка
   * @param prevPointNode - DOM элемент предыдущего ползунка
   * @param position      - новое значение ползунка
   * @param index         - индекс ползунка
   */
  move(pointNode: HTMLElement, nextPointNode: HTMLElement, prevPointNode: HTMLElement, position: number, index: number, needToUpdateInputs: boolean = true) {
    let tmpPosition = position;

    // Ширина всего слайдера
    const sliderWidth = this.node.getBoundingClientRect().width;

    let isCollideNext = false;
    let isCollidePrev = false;

    // Проверка на заезд дальше следующего ползунка
    if (nextPointNode) {
      if (tmpPosition >= nextPointNode.offsetLeft - this.pointSize) {
        tmpPosition = nextPointNode.offsetLeft - this.pointSize;
        isCollideNext = true;
      } else {
        isCollideNext = false;
      }
    }

    // Проверка на заезд до следующего ползунка
    if (prevPointNode && index !== 0 && this.pointsNodes.length > 1) {
      if (tmpPosition <= prevPointNode.offsetLeft + this.pointSize) {
        tmpPosition = prevPointNode.offsetLeft + this.pointSize;
        isCollidePrev = true;
      } else {
        isCollidePrev = false;
      }
    }

    // Проверки на выход из границ
    if (tmpPosition <= 0) {
      tmpPosition = 0;
    } else if (position >= sliderWidth - this.pointSize) {
      tmpPosition = sliderWidth - this.pointSize;
    }

    // Рассчет новой позиции скролбара
    pointNode.style.left = `${(tmpPosition * 100) / sliderWidth}%`;

    let pointWidthFactor = 0;
    if (index !== 0) {
      pointWidthFactor = this.pointSize;
    }

    if (isCollideNext) {
      pointWidthFactor = this.pointSize * 2;
    } else if (isCollidePrev) {
      pointWidthFactor = -this.pointSize * 2;
    }

    const valueWidth = this.config.range[1] - this.config.range[0];
    this.values[index] = Math.min(Math.max(0, Math.round(((tmpPosition + pointWidthFactor) * valueWidth) / sliderWidth)), this.config.range[1]);

    // Если указаны селекторы инпутов, то обновляем их
    if (this.config.selectors.inputs && needToUpdateInputs) {
      this.updateInputs();
    }
  }

  /**
   * Создание ползунка
   *
   * @param position Значение ползунка
   */
  createPoint(position: number): void {
    // Создаем DOM элемент ползунка
    const pointNode = document.createElement('div');
    pointNode.className = 'faze-pointer';

    // Проставляем позицию ползунка
    pointNode.style.left = `${this.calculatePercent(position)}%`;

    // Добавляем его в общий массив
    this.pointsNodes.push(pointNode);

    // Добавляем его в код страницы
    this.node.appendChild(pointNode);

    // Размер ползунка
    this.pointSize = pointNode.getBoundingClientRect().width;

    // Ограничение для последнего ползунка
    if (pointNode.offsetLeft >= this.node.getBoundingClientRect().width - this.pointSize) {
      pointNode.style.left = `${this.calculateSizeInPercent(this.pointSize)}%`;
    }

    (pointNode as any).fazeOffset = pointNode.style.left;
  }

  /**
   * Рассчёт процентов заданного размера относительна общей ширины слайдера
   *
   * @param value Значение от которого считаем процент
   *
   * @returns Процент относительно ширины слайдера
   */
  private calculateSizeInPercent(value: number, isInvert = true): number {
    let result = (100 * value) / this.node.getBoundingClientRect().width;
    if (isInvert) {
      result = 100 - result;
    }

    return result;
  }

  /**
   * Рассчёт процента сдвига ползунка относительно слайдера
   *
   * @param value Значение от которого считаем процент
   *
   * @returns Процент сдвига ползунка
   */
  private calculatePercent(value: number): number {
    const sliderWidth = this.node.getBoundingClientRect().width - 32;

    return (-((sliderWidth * (this.config.range[0] - value)) / (this.config.range[1] - this.config.range[0])) * 100) / sliderWidth;
  }

  /**
   * Проверка конфига на кооректность
   *
   * @private
   */
  private checkConfig(): void {
    this.checkRange();
  }

  /**
   * Проверка диапазона
   *
   * @private
   */
  private checkRange(): void {
    // Если не задан диапазон
    if (!this.config.range) {
      return this.logger.error('Не задан диапазон значений для слайдера!');
    }

    // Если только одно значение
    if (this.config.range.length !== 2) {
      return this.logger.error('Необходимо задать два значения в поле "range"!');
    }
  }

  /**
   * Обновление значений инпутов, если указаны их селекторы
   *
   * @private
   */
  private updateInputs(): void {
    this.getValues().forEach((value: number, index: number) => {
      if (this.inputsNodes[index]) {
        this.inputsNodes[index].value = value.toString();
      }
    });
  }

  /**
   * Простановка значения для точки с указанным индексом
   *
   * @param index     - индекс ползунка
   * @param value     - значение
   */
  setValue(index: number, value: number): void {
    // DOM элемент ползунка
    const pointNode = this.pointsNodes[index];
    if (pointNode && index >= 0 && index < this.values.length) {
      // DOM элемент следующего ползунка
      const nextPointNode = <HTMLElement>pointNode.nextSibling;

      // DOM элемент предыдущего ползунка
      const prevPointNode = <HTMLElement>pointNode.previousSibling;

      // Высчитываем значение, необходимо отнять минимальное значение т.к. оно принимается за начало отсчета
      let position = value - this.config.range[0];

      // Обновляем значение
      this.values[index] = value;

      // Ограничиваем выход в минус
      if (position <= 0) {
        position = 0;
      }

      // Передвигаем ползунок на нужное место
      this.move(pointNode, nextPointNode, prevPointNode, position * this.ratio, index, false);
    }

    // Пересчёт соединительной полосы
    this.calculateConnect();
  }

  /**
   * Простановка значений для точек
   *
   * @param values - массив значений, где индекс значения равен индексу точки
   * @param inPercent - значение в процентах или нет
   */
  setValues(values: number[]): void {
    values.forEach((value, index) => {
      this.setValue(index, value);
    });
  }

  /**
   * Получение значений ползунков
   */
  getValues(): number[] {
    return this.values;

    return this.pointsNodes.map((pointNode, i) => {
      // Считаем коэффициент сдвига учитывая размер ползунков
      const ratio = (this.node.getBoundingClientRect().width - this.pointSize * this.pointsNodes.length) / (this.config.range[1] - this.config.range[0]);

      // Считаем значение всех, кроме последнего
      let value: number = Math.round(parseFloat((pointNode.offsetLeft / ratio).toString())) + this.config.range[0];

      // Для последнего ползунка необходимо добавить значение равное половине его ширины
      if (i === this.pointsNodes.length - 1 && this.pointsNodes.length > 1) {
        value += Math.round(parseFloat(((pointNode.getBoundingClientRect().width - this.pointSize * this.pointsNodes.length) / ratio).toString()));
      }

      return value;
    });
  }

  /**
   * Перерасчёт модификатора движения
   */
  recalculateRatio(): void {
    this.ratio = this.node.getBoundingClientRect().width / (this.config.range[1] - this.config.range[0]);
  }

  /**
   * Сброс слайдера в первоначальное положение
   */
  reset(): void {
    this.setValues(this.config.points);
  }

  /**
   * Сброс значения ползунка
   *
   * @param index - индекс ползунка
   */
  resetValue(index: number): void {
    // Проверка на валидность
    if (index > this.config.points.length - 1 && index < 0) {
      return this.logger.error(`Попытка сбросить несуществующий ползунок с индексом ${index}`);
    }

    // Сброс значения
    this.setValue(index, this.config.points[index]);
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    const range: string | undefined = node.dataset.fazeSliderRange || node.dataset.fazeSliderPoints;
    const points: string | undefined = node.dataset.fazeSliderPoints || node.dataset.fazeSliderRange;

    new Slider(node, {
      points: points?.split(',').map((tmp) => parseInt(tmp, 10)) || [0, 100],
      range: range?.split(',').map((tmp) => parseInt(tmp, 10)) || [0, 100],
      connect: (node.dataset.fazeSliderConnect || 'true') === 'true',
      changeDelay: parseInt(node.dataset.fazeChangeDelay || '1000', 10),
      selectors: {
        inputs: node.dataset.fazeSliderSelectorsInputs,
      },
    });
  }
}

export default Slider;
