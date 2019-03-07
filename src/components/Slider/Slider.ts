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
 * Структура конфига слайдера
 *
 * Содержит:
 *   range  - диапазон значений слайдера
 *   points - координаты ползунков на слайдере
 *   callbacks
 *     created  - пользовательская функция, исполняющийся при успешном создании спойлера
 *     changed  - пользовательская функция, исполняющийся при изменении видимости спойлера
 */
interface Config {
  range: number[];
  points: number[];
  callbacks: {
    created?: () => void;
    changed?: () => void;
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

  // Отношение ширины слайдера и его возможного максимального значения
  ratio: number;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект слайдера!');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      range: [0, 100],
      points: [50],
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    this.config = {...defaultConfig, ...config};
    this.node = node;
    this.logger = new Logger('Модуль Faze.Slider:');

    // Проверка конфига
    this.checkConfig();

    // Инициализация переменных
    this.ratio = this.node.getBoundingClientRect().width / this.config.range[1];
    this.pointsNodes = [];

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

    // Инициализируем ползунки
    this.initializePoints();
  }

  /**
   * Инициализация ползунков
   */
  initializePoints() {
    // Создаем ползунки
    this.config.points.forEach((point) => {
      this.createPoint(point);
    });
  }

  /**
   * Навешивание событий
   */
  bind() {
    this.bindPoints();
  }

  /**
   * Навешивание событий перетаскивания мышкой и пальцем на ползунки
   */
  bindPoints() {
    this.pointsNodes.forEach((pointNode) => {
      // Начальная позиция мыши
      let startMousePosition = 0;

      // КОнечная позиция мыши
      let endMousePosition = 0;

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
        endMousePosition = startMousePosition - (event.clientX || event.touches[0].clientX);
        startMousePosition = (event.clientX || event.touches[0].clientX);

        const sliderWidth = this.node.getBoundingClientRect().width;

        let position = pointNode.offsetLeft - endMousePosition;
        if (position <= 0) {
          position = 0;
        } else if (position >= sliderWidth) {
          position = sliderWidth;
        }

        // Рассчет новой позиции скролбара
        pointNode.style.left = `${position}px`;
      };

      /**
       * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
       */
      const endDragElement = () => {
        document.removeEventListener('mouseup', <any>endDragElement);
        document.removeEventListener('touchend', <any>endDragElement);

        document.removeEventListener('mousemove', <any>elementDrag);
        document.removeEventListener('touchmove', <any>elementDrag);
      };

      // Навешиваем событие перетаскивания
      pointNode.addEventListener('mousedown', <any>dragMouseDown);
      pointNode.addEventListener('touchstart', <any>dragMouseDown);
    });
  }

  /**
   * Создание ползунка
   *
   * @param position - его положение на слайдере
   */
  createPoint(position: number) {
    // Создаем DOM элемент ползунка
    const pointNode = document.createElement('div');
    pointNode.className = 'faze-pointer';
    pointNode.style.left = `${position * this.ratio}px`;

    // Добавляем его в общий массив
    this.pointsNodes.push(pointNode);

    // Добавляем его в код страницы
    this.node.appendChild(pointNode);
  }

  /**
   * Проверка конфига на кооректность
   */
  checkConfig() {
    this.checkRange();
  }

  /**
   * Проверка диапазона
   */
  checkRange() {
    // Если не задан диапазон
    if (!this.config.range) {
      this.logger.error('Не задан диапазон значений для слайдера!');
    }

    // Если только одно значение
    if (this.config.range.length !== 2) {
      this.logger.error('Необходимо задать два значения в поле "range"!');
    }
  }
}

export default Slider;
