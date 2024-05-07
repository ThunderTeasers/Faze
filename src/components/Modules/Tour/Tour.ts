/**
 * Плагин табов
 *
 * Модуль табов представляет собой набор "заголовков" связанных с набором "тел" через data атрибут. Одновременно может отображаться
 * только одно "тело", какое именно отображается, зависит от того, на какой "заголовок" нажали. По умолчанию отображается первый.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/Модуль-Tab
 */

import './Tour.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   currentStep - Текущий шаг
 */
interface CallbackData {
  currentStep: number;
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   headerActiveClass - CSS класс активного таба
 *   useHash - использовать ли window.location.hash при переключении и инициализации
 *   removeEmpty - удалять ли пустые табы с их шапками
 *   maxBodies - максимальное количество тел которые нужно показывать
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  callbacks: {
    changed?: (activeTabData: CallbackData) => void;
  };
}

/**
 * Класс табов
 */
class Tour extends Module {
  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент на который навешивается модуль
   * @param config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      callbacks: {
        changed: undefined,
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
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {}
}

export default Tour;
