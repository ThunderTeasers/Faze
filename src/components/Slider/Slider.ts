/**
 * Плагин слайдера
 *
 * Слайдер представляет из себя UI элемент с одним или несколькими ползунками которые можно двигать мышкой для изменения значения
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 08.03.2018
 */

import './Slider.scss';
import Logger from './../Core/Logger';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок селекта
 *   body   - тело селекта
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
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    stopped?: (data: CallbackData) => void;
  };
}

/**
 * Класс слайдера
 */
class Slider {
  // DOM элемент селекта
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Помощник для логирования
  readonly logger: Logger;

  // DOM элементы ползунков
  readonly pointsNodes: HTMLElement[];

  // DOM элемент соединительной полоски
  connectNode: HTMLElement | null;

  // Отношение ширины слайдера и его возможного максимального значения
  ratio: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект слайдера!');
    }

    // Инициализация переменных из конфига
    let points = [0];
    if (node && node.dataset.fazeSliderPoints) {
      points = node.dataset.fazeSliderPoints.split(',').map(point => parseInt(point, 10));
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      points,
      range: [parseInt(node.dataset.fazeSliderMin || '0', 10), parseInt(node.dataset.fazeSliderMax || '100', 10)],
      connect: true,
      pointsInPercent: node.dataset.fazeSliderPointsInPercent === 'true',
      callbacks: {
        created: undefined,
        changed: undefined,
        stopped: undefined,
      },
    };

    this.config = {...defaultConfig, ...config};
    this.node = node;
    this.logger = new Logger('Модуль Faze.Slider:');

    // Проверка конфига
    this.checkConfig();

    // Инициализация переменных
    this.ratio = this.node.getBoundingClientRect().width / (this.config.range[1] - this.config.range[0]);
    this.pointsNodes = [];
    this.connectNode = null;

    // Инициализация
    this.initialize();

    // Навешивание событий
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка класса, если этого не было сделано руками
    this.node.classList.add('faze-slider');

    // Инициализируем соединительную полоску, если необходимо
    if (this.config.connect) {
      this.createConnect();
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
        this.logger.error(`Ошибка исполнения пользовательского метода "created", дословно: ${error}!`);
      }
    }
  }

  /**
   * Инициализация ползунков
   */
  initializePoints(): void {
    // Создаем ползунки
    this.config.points.forEach((point) => {
      this.createPoint(point);
    });
  }

  /**
   * Навешивание событий
   */
  bind(): void {
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

      /**
       * Функция перетаскивания ползунка
       *
       * @param event - событие мыши
       */
      const elementDrag = (event: any) => {
        // Рассчет новой позиции курсора
        endMousePosition = startMousePosition - (event.clientX || (event.touches ? event.touches[0].clientX : 0));
        startMousePosition = (event.clientX || (event.touches ? event.touches[0].clientX : 0));

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
            this.logger.error(`Ошибка исполнения пользовательского метода "changed", дословно: ${error}!`);
          }
        }
      };

      /**
       * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
       */
      const endDragElement = () => {
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
            this.logger.error(`Ошибка исполнения пользовательского метода "stopped", дословно: ${error}!`);
          }
        }
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
      if (tmpPosition >= nextPointNode.offsetLeft) {
        tmpPosition = nextPointNode.offsetLeft;
      }
    }

    // Проверка на заезд до следующего ползунка
    if (prevPointNode && index !== 0 && this.pointsNodes.length > 1) {
      if (tmpPosition <= prevPointNode.offsetLeft) {
        tmpPosition = prevPointNode.offsetLeft;
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
      left = this.node.getBoundingClientRect().width * position / 100;
    }

    pointNode.style.left = `${left}px`;

    // Добавляем его в общий массив
    this.pointsNodes.push(pointNode);

    // Добавляем его в код страницы
    this.node.appendChild(pointNode);

    // Ширина всего слайдера
    const sliderWidth = this.node.getBoundingClientRect().width;

    // Половина ширины ползунка
    const halfPointWidth = pointNode.getBoundingClientRect().width / 2;

    // Ограничение для последнего ползунка
    if (pointNode.offsetLeft >= sliderWidth - halfPointWidth) {
      pointNode.style.left = `${sliderWidth - halfPointWidth}px`;
    }
  }

  /**
   * Проверка конфига на кооректность
   */
  checkConfig(): void {
    this.checkRange();
  }

  /**
   * Проверка диапазона
   */
  checkRange(): void {
    // Если не задан диапазон
    if (!this.config.range) {
      this.logger.error('Не задан диапазон значений для слайдера!');
    }

    // Если только одно значение
    if (this.config.range.length !== 2) {
      this.logger.error('Необходимо задать два значения в поле "range"!');
    }
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
        left = this.node.getBoundingClientRect().width * value / 100;
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
      let value = Math.round(parseFloat((pointNode.offsetLeft / this.ratio).toString())) + this.config.range[0];

      // Для последнего ползунка необходимо добавить значение равное половине его ширины
      if (i === this.pointsNodes.length - 1 && this.pointsNodes.length > 1) {
        value += Math.round(parseFloat((pointNode.getBoundingClientRect().width / this.ratio).toString()));
      }

      return value;
    });
  }

  /**
   * Сброс слайдера в первоначальное положение
   */
  reset() {
    this.setValues(this.config.points, this.config.pointsInPercent);
  }

  /**
   * Сброс значения ползунка
   *
   * @param index - индекс ползунка
   */
  resetValue(index: number) {
    // Проверка на валидность
    if (index > this.config.points.length - 1 && index < 0) {
      this.logger.error(`Попытка сбросить несуществующий ползунок с индексом ${index}`);
    }

    // Сброс значения
    this.setValue(index, this.config.points[index], this.config.pointsInPercent);
  }
}

export default Slider;
