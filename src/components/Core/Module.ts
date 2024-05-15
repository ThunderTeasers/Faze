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

  // Помощник для логирования
  protected readonly logger: Logger;

  // Конфиг с настройками
  protected readonly config: any;

  // Имя плагина
  private readonly name: string;

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
    if (!data.node) {
      this.logger.error('Не задан основной DOM элемент модуля');
    }

    // Инициализируем переменные
    this.node = data.node;
    this.config = data.config;
    this.additionalParams = data.additionalParams;

    // Вычисляем CSS селектор класса
    const classNameTmp = data.node?.className;
    this.className = classNameTmp ? `.${classNameTmp.trim().replace(' ', '.')}` : undefined;

    // Вызываем стандартные методы
    this.initialize();
    this.build();
    this.bind();

    (this.node as any).self = this;
  }

  /**
   * Главный метод инициализации
   *
   * @protected
   */
  protected initialize(): void {
    // У основного DOM элемента, добавляем классы, показывающие, что данный плагин инициализирован, это необходимо для "hotInitialize"
    this.node.classList.add(`faze-${this.name.toLowerCase()}`);
    this.node.classList.add(`faze-${this.name.toLowerCase()}-initialized`);
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void {}

  /**
   * Главный метод навешивания событий
   *
   * @protected
   */
  protected bind(): void {
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  protected resize(): void {}

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node{HTMLElement} DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {}

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
    document.querySelectorAll<HTMLElement>(`[data-faze~="${name}"]`).forEach((node: HTMLElement) => {
      this.initializeByDataAttributes(node);
    });
  }
}

export default Module;
