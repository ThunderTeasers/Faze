/**
 * Плагин умного селекта
 *
 * Модуль умного селекта представляет собой инпут, при вводе в который снизу выводятся данные полученные через ajax с сервера.
 * Из них можно выбрать один или несколько значений, которые будут запомнены в инпут.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 10.06.2022
 */

import './ThumbGallery.scss';
import Module from '../../Core/Module';

/**
 * Структура конфига умного селекта
 *
 * Содержит:
 *   url - адрес для запросов к серверу
 */
interface Config {
  url?: string;
}

class SmartSelect extends Module {
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      url: undefined,
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'SmartSelect',
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();
  }
}

export default SmartSelect;
