/**
 * Плагин формы
 *
 * Автор: Ерохин Максим
 * Дата: 06.12.2024
 */

import './Form.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   node - DOM элемент где происходит работа модуля
 *   inputsNode - DOM элементы инпутов
 */
interface CallbackData {
  node: HTMLElement;
  inputsNode: NodeListOf<HTMLInputElement>;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после сабмита формы
 */
interface Config {
  callbacks: {
    created?: (data: CallbackData) => void;
    submitted?: (data: CallbackData) => void;
  };
}

/**
 * Класс
 */
class Form extends Module {
  /**
   * Стандартный конструктор
   *
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Config} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      callbacks: {
        created: undefined,
        submitted: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Form',
    });
  }

  /**
   * Инициализация
   *
   * @protected
   */
  protected initialize(): void {
    super.initialize();
  }

  /**
   * Навешивание событий
   *
   * @protected
   */
  protected bind(): void {
    super.bind();
  }

  /**
   * Построение необходимых DOM элементов
   *
   * @protected
   */
  protected build(): void {
    super.build();
  }
}

export default Form;
