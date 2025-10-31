/**
 * Родительский класс любого плагина, содержит базовую и необходимую информацию для интеграции плагина в систему
 */

import Faze from './Faze';
import Logger from './Logger';

/**
 * Структура конфига плагина
 *
 * Содержит:
 *   name{string} - имя плагина
 *   node{HTMLElement | undefined} - основной DOM элемент
 *   nodes{HTMLElement[] | undefined} - дополнительные DOM элементы
 *   config{any} - конфигурационные данные для плагина
 *   additionalParams{any} - дополнительные параметры
 */
interface ModuleData {
  name: string;
  node?: HTMLElement;
  nodes?: HTMLElement[];
  config: any;
  additionalParams?: any;
}

abstract class Module {
  // Основной DOM элемент
  protected readonly node: HTMLElement;

  // Основные DOM элементы
  protected readonly nodes: HTMLElement[];

  // Помощник для логирования
  protected readonly logger: Logger;

  // Конфиг с настройками
  protected readonly config: any;

  // Идентификатор плагина
  protected readonly uid: number;

  // Имя плагина
  private readonly name: string;

  // Селектор для отслеживания
  protected watchSelector?: string;

  // Префикс класса
  protected readonly classPrefix: string;

  // Префикс data атрибута
  protected readonly dataPrefix: string;

  // CSS класс главного DOM элемента
  protected readonly className?: string;

  // Дополнительные параметры
  protected additionalParams?: any;

  /**
   * Стандартный конструктор
   *
   * @param data{PluginData} Данные для создания плагина
   */
  constructor(data: ModuleData) {
    // Получаем имя плагина
    this.name = data.name;

    if (this.name === 'Carousel2') {
      this.name = 'Carousel';
    }

    // Инициализация логгера
    this.logger = new Logger(`Модуль Faze.${this.name}:`);

    // Проверяем задан ли основной DOM элемент
    if (!data.node && !data.nodes) {
      this.logger.error('Не задан основной DOM элемент модуля');
    }

    // Инициализируем переменные
    this.node = data.node!;
    this.nodes = data.nodes!;

    // Конвертируем в нужный формат переданные объекты
    if (this.nodes instanceof HTMLElement) {
      this.nodes = [this.nodes];
    } else {
      this.nodes = [...Array.from(this.nodes)];
    }

    this.config = data.config;
    this.additionalParams = data.additionalParams;
    this.classPrefix = `faze-${this.name.toLowerCase()}`;
    this.dataPrefix = `data-${this.classPrefix}`;
    this.uid = Math.floor(Math.random() * 10001);

    // Вычисляем CSS селектор класса
    const classNameTmp = data.node?.className;
    this.className = classNameTmp ? `.${classNameTmp.trim().replace(' ', '.')}` : undefined;

    // Вызываем стандартные методы
    this.initialize();
    this.build();
    this.bind();
    this.watch();

    // Добавляем ссылку на самого себя
    if (this.node) {
      (this.node as any).self = this;
    }

    if (this.nodes && Array.isArray(this.nodes) && this.nodes.length > 0) {
      this.nodes.forEach((node) => {
        (node as any).self = this;
      });
    }
  }

  /**
   * Главный метод инициализации
   *
   * @protected
   */
  protected initialize(): void {
    // У основного DOM элемента, добавляем классы, показывающие, что данный плагин инициализирован, это необходимо для "hotInitialize"
    if (this.node) {
      this.node.classList.add(this.classPrefix);
      this.node.classList.add(`${this.classPrefix}-initialized`);
      this.node.dataset.fazeUid = this.uid.toString();
    }

    if (this.nodes && Array.isArray(this.nodes) && this.nodes.length > 0) {
      this.nodes.forEach((node) => {
        node.classList.add(this.classPrefix);
        node.classList.add(`${this.classPrefix}-initialized`);
        node.dataset.fazeUid = this.uid.toString();
      });
    }
  }

  /**
   * Реинициализация
   * 
   * @param {any} data Данные для инициализации
   */
  protected reinitialize(data: any): void { }

  /**
   * Отслеживание изменений в DOM для реинициализации или других действий
   *
   * @protected
   */
  private watch(): void {
    // Если не задан селектор для отслеживания, то ничего не делаем
    if (!this.watchSelector) {
      return;
    }

    // Добавляем слушателя
    Faze.Observer.watch(this.watchSelector, (node) => {
      this.reinitialize(node);
    });
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void { }

  /**
   * Главный метод навешивания событий
   *
   * @protected
   */
  protected bind(): void {
    if (typeof this.resize === 'function') {
      window.addEventListener('resize', () => {
        this.resize();
      });
    }
  }

  protected resize(): void { }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node{HTMLElement} DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void { }

  /**
   * "Горячая" инициализация модуля через "observer"
   *
   * @param name{string} Имя модуля
   */
  static hotInitialize(name: string): void {
    // Инициализация через "observer"
    Faze.Observer.watch(`[data-faze~="${name}"]`, (node: HTMLElement) => {
      this.initializeByDataAttributes(node);
    });

    // Стандартная инициализация по data атрибутам
    document
      .querySelectorAll<HTMLElement>(`[data-faze~="${name}"]`)
      .forEach((node: HTMLElement) => {
        this.initializeByDataAttributes(node);
      });
  }
}

export default Module;
