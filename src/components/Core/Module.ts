/**
 * Родительский класс любого плагина, содержит базовую и необходимую информацию для интеграции плагина в систему
 */

import Logger from './Logger';
import Faze from './Faze';

/**
 * Структура конфига плагина
 *
 * Содержит:
 *   name{string} - имя плагина
 *   node{HTMLElement | undefined} - основной DOM элемент
 *   nodes{HTMLElement[] | undefined} - дополнительные DOM элементы
 *   config{any} - конфигурационные данные для плагина
 *   defaultConfig{any} - конфигурационные данные для плагина по умолчанию
 */
interface ModuleData {
  name: string;
  node?: HTMLElement;
  nodes?: HTMLElement[];
  config: any;
  defaultConfig: any;
}

class Module {
  // Основной DOM элемент
  protected readonly node: HTMLElement;

  // Помощник для логирования
  protected readonly logger: Logger;

  // Конфиг с настройками
  protected readonly config: any;

  // Имя плагина
  private readonly name: string;

  /**
   * Стандартный конструктор
   *
   * @param data{PluginData} - данные для создания плагина
   */
  constructor(data: ModuleData) {
    // Получаем имя плагина
    this.name = data.name;

    // Инициализация логгера
    this.logger = new Logger(`Модуль Faze.${this.name}:`);

    // Проверяем задан ли основной DOM элемент
    if (!data.node) {
      this.logger.error('Не задан основной DOM элемент модуля');
    }

    // Инициализируем переменные
    this.node = data.node;
    console.log(data.defaultConfig, data.config);
    this.config = Object.assign(data.defaultConfig, data.config);

    // Вызываем стандартные методы
    this.initialize();
    this.bind();
  }

  /**
   * Главный метод инициализации
   */
  public initialize(): void {
    // У основного DOM элемента, добавляем классы, показывающие, что данный плагин инициализирован, это необходимо для "hotInitialize"
    this.node.classList.add('faze-tabs');
    this.node.classList.add('faze-tabs-initialized');
  }

  /**
   * Главный метод навешивания событий
   */
  public bind(): void {}

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {}

  /**
   * "Горячая" инициализация модуля через "observer"
   */
  static hotInitialize(): void {
    // Инициализация через "observer"
    Faze.Observer.watch(`[data-faze~="${this.name.toLowerCase()}"]`, (node: HTMLElement) => {
      this.initializeByDataAttributes(node);
    });

    // Стандартная инициализация по data атрибутам
    document.querySelectorAll<HTMLElement>(`[data-faze~="${this.name.toLowerCase()}"]`).forEach((node: HTMLElement) => {
      this.initializeByDataAttributes(node);
    });
  }
}

export default Module;
