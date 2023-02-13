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
 *   pointsInPercent - флиг, указывающий на то, нужно ли делать первичный просчет расположения ползунков в процентах или нет
 *   callbacks
 *     created  - пользовательская функция, исполняющийся при успешном создании спойлера
 *     changed  - пользовательская функция, исполняющийся при изменении видимости спойлера
 *     stopped  - пользовательская функция, исполняющаяся после отпускания пальца/мышки
 */
interface Config {
  range: number[];
  points: number[];
  connect: boolean;
  pointsInPercent: boolean;
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

  // Отношение ширины слайдера и его возможного максимального значения
  ratio: number;

  constructor(node: HTMLElement, config: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      points: [0, 100],
      range: [0, 100],
      connect: true,
      pointsInPercent: false,
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

    // Инициализация переменных
    this.ratio = this.node.getBoundingClientRect().width / (this.config.range[1] - this.config.range[0]);
    this.pointsNodes = [];
    this.inputsNodes = [];
    this.pointSize = 10;
    this.connectNode = null;

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
      // Собираем значения
      const values = this.getValues();

      try {
        this.config.callbacks.created({
          values,
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
        inputNode.value = this.config.range[inputNode.dataset.fazeSliderInput || 0];
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
  }

  /**
   * Навешивание событий перетаскивания мышкой и пальцем на ползунки
   */
  bindPoints(): void {
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
          // Собираем значения
          const values = this.getValues();

          try {
            this.config.callbacks.changed({
              values,
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
          // Собираем значения
          const values = this.getValues();

          try {
            this.config.callbacks.stopped({
              values,
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
        this.connectNode.style.width = `${this.pointsNodes[0].offsetLeft}px`;
        this.connectNode.style.left = '0';
      } else {
        this.connectNode.style.width = `${connectWidth}px`;
        this.connectNode.style.left = `${this.pointsNodes[0].offsetLeft + halfPointWidth}px`;
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
  move(pointNode: HTMLElement, nextPointNode: HTMLElement, prevPointNode: HTMLElement, position: number, index: number) {
    let tmpPosition = position;

    // Ширина всего слайдера
    const sliderWidth = this.node.getBoundingClientRect().width;

    // Половина ширины ползунка
    const pointWidth = pointNode.getBoundingClientRect().width;

    // Проверка на заезд дальше следующего ползунка
    if (nextPointNode) {
      if (tmpPosition >= nextPointNode.offsetLeft - this.pointSize) {
        tmpPosition = nextPointNode.offsetLeft - this.pointSize;
      }
    }

    // Проверка на заезд до следующего ползунка
    if (prevPointNode && index !== 0 && this.pointsNodes.length > 1) {
      if (tmpPosition <= prevPointNode.offsetLeft + this.pointSize) {
        tmpPosition = prevPointNode.offsetLeft + this.pointSize;
      }
    }

    // Проверки на выход из границ
    if (tmpPosition <= 0) {
      tmpPosition = 0;
    } else if (position >= sliderWidth - pointWidth) {
      tmpPosition = sliderWidth - pointWidth;
    }

    // Рассчет новой позиции скролбара
    pointNode.style.left = `${tmpPosition}px`;

    // Если указаны селекторы инпутов, то обновляем их
    if (this.config.selectors.inputs) {
      this.updateInputs();
    }
  }

  /**
   * Создание ползунка
   *
   * @param position - его положение на слайдере
   */
  createPoint(position: number): void {
    // Создаем DOM элемент ползунка
    const pointNode = document.createElement('div');
    pointNode.className = 'faze-pointer';

    // Обычный рассчет позиции
    let left = position * this.ratio;

    // Рассчет позиции если необходимо считать через проценты
    if (this.config.pointsInPercent) {
      left = (this.node.getBoundingClientRect().width * position) / 100;
    }

    pointNode.style.left = `${left}px`;

    // Добавляем его в общий массив
    this.pointsNodes.push(pointNode);

    // Добавляем его в код страницы
    this.node.appendChild(pointNode);

    // Ширина всего слайдера
    const sliderWidth = this.node.getBoundingClientRect().width;

    // Размер ползунка
    this.pointSize = pointNode.getBoundingClientRect().width;

    // Ограничение для последнего ползунка
    if (pointNode.offsetLeft >= sliderWidth - this.pointSize) {
      pointNode.style.left = `${sliderWidth - this.pointSize}px`;
    }
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
   * @param inPercent - значение в процентах или нет
   */
  setValue(index: number, value: number, inPercent: boolean = false): void {
    // DOM элемент ползунка
    const pointNode = this.pointsNodes[index];
    if (pointNode) {
      // DOM элемент следующего ползунка
      const nextPointNode = <HTMLElement>pointNode.nextSibling;

      // DOM элемент предыдущего ползунка
      const prevPointNode = <HTMLElement>pointNode.previousSibling;

      // Высчитываем значение, необходимо отнять минимальное значение т.к. оно принимается за начало отсчета
      let position = value - this.config.range[0];

      // Ограничиваем выход в минус
      if (position <= 0) {
        position = 0;
      }

      // Обычный рассчет позиции
      let left = position * this.ratio;

      // Рассчет позиции если необходимо считать через проценты
      if (inPercent) {
        left = (this.node.getBoundingClientRect().width * value) / 100;
      }

      // Передвигаем ползунок на нужное место
      this.move(pointNode, nextPointNode, prevPointNode, left, index);
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
  setValues(values: number[], inPercent: boolean = false): void {
    values.forEach((value, i) => {
      this.setValue(i, value, inPercent);
    });
  }

  /**
   * Получение значений ползунков
   */
  getValues(): number[] {
    return this.pointsNodes.map((pointNode, i) => {
      // Считаем коэффициент сдвига учитывая размер ползунков
      const ratio = (this.node.getBoundingClientRect().width - this.pointSize * this.pointsNodes.length) / (this.config.range[1] - this.config.range[0]);

      // Считаем значение всех, кроме последнего
      let value = Math.round(parseFloat((pointNode.offsetLeft / ratio).toString())) + this.config.range[0];

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
    this.setValues(this.config.points, this.config.pointsInPercent);
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
    this.setValue(index, this.config.points[index], this.config.pointsInPercent);
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    const range: string | undefined = node.dataset.fazeSliderRange || node.dataset.fazeSliderPoints;

    new Slider(node, {
      points: range?.split(',').map((tmp) => parseInt(tmp, 10)) || [0, 100],
      range: range?.split(',').map((tmp) => parseInt(tmp, 10)) || [0, 100],
      connect: (node.dataset.fazeSliderConnect || 'true') === 'true',
      selectors: {
        inputs: node.dataset.fazeSliderSelectorsInputs,
      },
      pointsInPercent: (node.dataset.fazeSliderPointsOnPercent || 'false') === 'true',
    });
  }
}

export default Slider;
