/**
 * Плагин зума
 *
 * Модуль зума, позволяет просматривать увеличенное изображение исходной картинки в отдельном окне расположенного в указанной стороне от неё
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 29.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Zoom
 */

import './Zoom.scss';
import Faze from '../Core/Faze';
import Logger from '../Core/Logger';

/**
 * Структура конфига
 *
 * Содержит:
 *   image  - путь к картинке оригинального размера
 *   side   - сторона с которой должно появится окно с увеличенной картиной, может быть: 'left', 'right', 'top', 'bottom'
 *   width  - ширина окна с увеличенной картинкой в пикселях
 *   height - высота окна с увеличенной картинкой в пикселях
 */
interface Config {
  image?: string;
  side: string;
  width: number;
  height: number;
  callbacks: {
    created?: () => void;
  };
}

/**
 * Класс зума
 */
class Zoom {
  // DOM элемент зума
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элемент обертки для зума
  readonly wrapperNode: HTMLDivElement;

  // DOM элемент указателя который двигается вместе с мышкой
  readonly pointerNode: HTMLDivElement;

  // DOM элемент обертки большого изображения, которое показывается сбоку
  readonly bigImageWrapperNode: HTMLDivElement;

  // DOM элемент большой картинки
  readonly bigImageNode: HTMLImageElement;

  readonly bigImageSize: {
    width: number;
    height: number;
  };

  // Флаг показывающий активен ли зум в настоящее время
  isEnabled: boolean;

  // Минимальное число из соотношений сторон между большой и маленькой картинкой по вертикали и горизонтали
  ratio: number;

  // Соотношение между сторонами большой и маленькой картинки по горизонтали
  ratioX: number;

  // Соотношение между сторонами большой и маленькой картинки по вертикали
  ratioY: number;

  // Размер указателя в пикселях
  pointerSize: {
    width: number;
    height: number;
  };

  // Позицианирование указателя, все размеры в пикселях
  position: {
    x: number;
    realX: number;
    xMin: number;
    xMax: number;
    xMaxOffset: number;

    y: number;
    realY: number;
    yMin: number;
    yMax: number;
    yMaxOffset: number;
  };

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект зума');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Zoom:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-zoom-initialized')) {
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      image: undefined,
      side: 'right',
      width: 300,
      height: 300,
      callbacks: {
        created: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    this.wrapperNode = document.createElement('div');
    this.pointerNode = document.createElement('div');
    this.bigImageWrapperNode = document.createElement('div');
    this.bigImageNode = document.createElement('img');
    this.isEnabled = true;
    this.bigImageSize = {
      width: 0,
      height: 0,
    };

    this.initialize();
    this.bind();
    this.calculate();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка стандартных классов
    this.node.classList.add('faze-zoom-initialized');

    // Создаем обертку
    this.wrapperNode.className = 'faze-zoom';

    // Перемещаем исходный элемент в обертку для дальнейшей работы
    if (!this.node.parentNode) {
      throw new Error('У DOM элемента зума нет родителя');
    }
    this.node.parentNode.insertBefore(this.wrapperNode, this.node);
    this.node.classList.add('faze-zoom-initial-image');
    this.wrapperNode.appendChild(this.node);

    // Создаем указатель который находится в центре мышки и показывает область которую
    // увеличиваем в данный момент времени
    this.pointerNode.className = 'faze-zoom-pointer';
    this.wrapperNode.appendChild(this.pointerNode);

    // Создаем большую картинку и обертку для неё
    this.bigImageWrapperNode.className = 'faze-zoom-image-wrapper';
    this.bigImageWrapperNode.style.width = `${this.config.width}px`;
    this.bigImageWrapperNode.style.height = `${this.config.height}px`;

    // Позиционирование окна для увеличения в соответствии с выбранной стороной
    switch (this.config.side) {
      case 'bottom':
        this.bigImageWrapperNode.style.left = '0';
        this.bigImageWrapperNode.style.bottom = `-${this.config.height}px`;
        break;
      case 'top':
        this.bigImageWrapperNode.style.left = '0';
        this.bigImageWrapperNode.style.top = `${this.config.height}px`;
        break;
      case 'left':
        this.bigImageWrapperNode.style.top = '0';
        this.bigImageWrapperNode.style.right = `${this.config.width}px`;
        break;
      case 'right':
      default:
        this.bigImageWrapperNode.style.top = '0';
        this.bigImageWrapperNode.style.right = `-${this.config.width}px`;
        break;
    }

    this.bigImageNode.className = 'faze-zoom-big-image';
    const bigImageSource = this.config.image || this.node.dataset.fazeFullImage;
    if (bigImageSource) {
      const bigImage = new Image();
      bigImage.src = bigImageSource;
      bigImage.onload = () => {
        this.bigImageNode.src = bigImageSource;
        this.bigImageWrapperNode.appendChild(this.bigImageNode);
        this.wrapperNode.appendChild(this.bigImageWrapperNode);

        this.bigImageSize.width = bigImage.width;
        this.bigImageSize.height = bigImage.height;

        this.calculate();
      };
    }

    // Выполняем пользовательскую фукнции
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created();
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции "created"', error);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    // Если навели на изображение, показываем элементы зума и делаем первичный рассчет
    this.wrapperNode.addEventListener('mouseover', () => {
      this.bigImageWrapperNode.style.display = 'block';
      this.pointerNode.style.display = 'block';

      this.calculate();
    });

    // Если вывели курсор за пределы, то скрываем элементы зума
    this.wrapperNode.addEventListener('mouseout', () => {
      this.bigImageWrapperNode.style.display = 'none';
      this.pointerNode.style.display = 'none';
    });

    // Отслеживание движения курсора внутри
    this.wrapperNode.addEventListener('mousemove', (event) => {
      this.move(event);
    });
  }

  /**
   * Метод для отслеживания перемещений курсора по исходному изображению
   *
   * @param event - JS событие, требуется для получения координат курсора
   */
  move(event: any): void {
    if (this.isEnabled) {
      // Определяем положение курсора относительно изображения, а не экрана
      this.position.x = event.clientX - this.node.getBoundingClientRect().left;
      this.position.y = event.clientY - this.node.getBoundingClientRect().top;

      // Вычисляем максимальные границы на которые может сдвинутся увеличенное изображение
      this.position.realX = Math.max(Math.min(this.position.x - this.position.xMin, this.position.xMax - this.position.xMin), 0) / this.ratioX;
      this.position.realY = Math.max(Math.min(this.position.y - this.position.yMin, this.position.yMax - this.position.yMin), 0) / this.ratioY;

      // Смещаем увеличенную картинку относительно положения курсора мыши на исходном изображении
      this.bigImageNode.style.left = `-${Math.min(this.position.realX, this.position.xMaxOffset)}px`;
      this.bigImageNode.style.top = `-${Math.min(this.position.realY, this.position.yMaxOffset)}px`;

      // Позицианируем указатель
      const pointerCenterX = this.position.x - this.pointerSize.width / 2;
      const pointerCenterY = this.position.y - this.pointerSize.height / 2;

      // Перемещение указателя
      this.pointerNode.style.left = `${Math.max(Math.min(pointerCenterX, this.node.getBoundingClientRect().width - this.pointerSize.width), 0)}px`;
      this.pointerNode.style.top = `${Math.max(Math.min(pointerCenterY, this.node.getBoundingClientRect().height - this.pointerSize.height), 0)}px`;

      // Отслеживаем, если курсор начал двигаться по увеличенному изображению, то это значит,
      // что пользователь вышел за границы исходного изображения, а значит необходимо
      // завершить работу с зумом
      const path = event.path || (event.composedPath && event.composedPath());
      if (path) {
        if (path.find((element: HTMLElement) => element === this.bigImageWrapperNode)) {
          this.bigImageWrapperNode.style.display = 'none';
          this.pointerNode.style.display = 'none';
        }
      }
    } else {
      this.bigImageWrapperNode.style.display = 'none';
      this.pointerNode.style.display = 'none';
    }
  }

  /**
   * Рассчет переменных, требуемых для корректной работы
   */
  calculate(): void {
    // Данные о размере большого изображения
    const bigImageWidth = this.bigImageSize.width;
    const bigImageHeight = this.bigImageSize.height;

    if ((bigImageWidth <= this.config.width && bigImageWidth !== 0) || (bigImageHeight <= this.config.height && bigImageHeight !== 0)) {
      this.isEnabled = false;
    }

    // Данные о размере исходного изображения
    const imageWidth = this.node.getBoundingClientRect().width;
    const imageHeight = this.node.getBoundingClientRect().height;

    // Вычисление соотношения сторон между изображениями
    this.ratioX = imageWidth / bigImageWidth;
    this.ratioY = imageHeight / bigImageHeight;

    // Вычисление общего соотношения между изображениями
    this.ratio = Math.min(this.ratioX, this.ratioY);

    // Рассчитываем размеры указателя
    this.pointerSize = {
      width: this.config.width * this.ratio,
      height: this.config.height * this.ratio,
    };

    // Присваиваем размеры указателя
    this.pointerNode.style.width = `${this.pointerSize.width}px`;
    this.pointerNode.style.height = `${this.pointerSize.height}px`;

    // Рассчет позиционирования
    this.position = {
      x: 0,
      realX: 0,
      xMin: Math.round(this.pointerSize.width / 2),
      xMax: Math.round(imageWidth - this.pointerSize.width / 2),
      xMaxOffset: Math.round(bigImageWidth - this.config.width),

      y: 0,
      realY: 0,
      yMin: Math.round(this.pointerSize.height / 2),
      yMax: Math.round(imageHeight - this.pointerSize.height / 2),
      yMaxOffset: Math.round(bigImageHeight - this.config.height),
    };
  }

  /**
   * Обновление картинки для зума
   *
   * @param source - путь до картинки
   */
  setImage(source: string | null): void {
    if (source) {
      const bigImage = new Image();
      bigImage.src = source;
      bigImage.onload = () => {
        this.isEnabled = true;

        this.bigImageNode.src = source;
        this.bigImageWrapperNode.appendChild(this.bigImageNode);
        this.wrapperNode.appendChild(this.bigImageWrapperNode);

        this.bigImageSize.width = bigImage.width;
        this.bigImageSize.height = bigImage.height;

        this.calculate();
      };
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param zoomNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(zoomNode: HTMLElement) {
    new Faze.Zoom(zoomNode, {
      image: zoomNode.dataset.fazeZoomImage,
      side: zoomNode.dataset.fazeZoomSide || 'right',
      width: parseInt(zoomNode.dataset.fazeZoomWidth || '300', 10),
      height: parseInt(zoomNode.dataset.fazeZoomHeight || '300', 10),
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="zoom"]', (zoomNode: HTMLElement) => {
      Zoom.initializeByDataAttributes(zoomNode);
    });

    document.querySelectorAll('[data-faze~="zoom"]').forEach((zoomNode: any) => {
      Zoom.initializeByDataAttributes(<HTMLElement>zoomNode);
    });
  }
}

export default Zoom;
