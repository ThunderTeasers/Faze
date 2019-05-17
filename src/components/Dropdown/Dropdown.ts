/**
 * Плагин дропдауна
 *
 * Дропдаун из себя представляет "шапку" при нажатии на которую снизу появляется "тело". "Тело" имеет свойство "position: absolute;" то
 * есть другими словами - не сдвигает блоки находящиеся снизу.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'FilterDropdowns',
 *     plugins: ['Dropdown'],
 *     condition: document.querySelectorAll('.faze-dropdown').length,
 *     callback: () => {
 *       new Faze.Dropdown(document.querySelector('.faze-dropdown'));
 *     }
 *   });
 *
 * В HTML:
 *   <div class="faze-dropdown">
 *     <div class="faze-title">Дропдаун</div>
 *     <div class="faze-body">Тело дропдауна</div>
 *   </div>
 */

import './Dropdown.scss';
import Faze from '../Core/Faze';
import Logger from '../Core/Logger';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   positionTopOffset  - сдвиг тела от верхнего края заголовка, например для отображения там стрелочки
 *   strictPosition     - считать ли сдвиг не только снизу заголовка, но еще и со сдвигом страницы
 *   callbacks
 *     created  - пользовательский метод, исполняющийся при успешном создании дропдауна
 *     opened   - пользовательский метод, исполняющийся при открытии дропдауна
 */
interface Config {
  positionTopOffset: number;
  strictPosition: boolean;
  callbacks: {
    created?: (data: CallbackData) => void;
    opened?: (data: CallbackData) => void;
  };
}

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок дропдауна
 *   body   - тело дропдауна
 */
interface CallbackData {
  title: HTMLElement | null;
  body: HTMLElement | null;
}

/**
 * Класс дропдауна
 */
class Dropdown {
  // DOM элемент дропдауна
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // Заголовок дропдауна
  title: HTMLElement | null;

  // Тело дропдауна
  body: HTMLElement | null;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      return this.logger.error('Не задан объект дропдауна');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Dropdown:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-dropdown')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      positionTopOffset: 0,
      strictPosition: false,
      callbacks: {
        created: undefined,
        opened: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Поиск основных элементов и проверка на то что они найдены
    this.title = this.node.querySelector('.faze-title');
    this.body = this.node.querySelector('.faze-body');

    if (!this.title || !this.body) {
      return this.logger.error('Для дропдауна не найдены шапка и тело');
    }

    // Присвоение сдвига для тела
    let topOffset = this.title.offsetHeight + this.config.positionTopOffset;
    if (this.config.strictPosition) {
      const callerRect = this.node.getBoundingClientRect();
      const documentElement = document.documentElement;

      if (documentElement) {
        topOffset += (window.pageYOffset || documentElement.scrollTop) + callerRect.top;
      }
    }

    this.body.style.top = `${topOffset}px`;

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          title: this.title,
          body: this.body,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (!this.title || !this.body) {
      return this.logger.error('Не заданы шапка и тело дропдауна');
    }

    // При нажатии на заголовок, меняем видимость тела дропдауна
    this.title.addEventListener('click', () => {
      this.node.classList.toggle('faze-active');

      if (this.node.classList.contains('faze-active')) {
        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.opened === 'function') {
          try {
            this.config.callbacks.opened({
              title: this.title,
              body: this.body,
            });
          } catch (error) {
            this.logger.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
          }
        }
      }
    });

    // Проверка на нажатие за пределами селекта
    document.addEventListener('click', (event: any) => {
      const path = event.path || (event.composedPath && event.composedPath());
      if (path) {
        if (!path.find((element: any) => element === this.node)) {
          this.node.classList.remove('faze-active');
        }
      }
    });
  }

  /**
   * Пересоздание заголовка, для сброса всех биндов на нём
   * Нужно для реинициализации дропдауна
   */
  resetTitle(): void {
    if (!this.title) {
      return this.logger.error('Не задана шапка дропдауна');
    }

    const cloneTitle = this.title.cloneNode(true);
    if (this.title.parentNode) {
      this.title.parentNode.replaceChild(cloneTitle, this.title);
      this.title = <HTMLElement>cloneTitle;
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param selectNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(selectNode: HTMLElement) {
    new Faze.Dropdown(selectNode, {
      strictPosition: (selectNode.dataset.fazeDropdownStrictPosition || 'false') === 'true',
      positionTopOffset: parseInt(selectNode.dataset.fazeDropdownPositionTopOffset || '0', 10),
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="dropdown"]', (selectNode: HTMLElement) => {
      Dropdown.initializeByDataAttributes(selectNode);
    });

    document.querySelectorAll('[data-faze~="dropdown"]').forEach((selectNode: any) => {
      Dropdown.initializeByDataAttributes(selectNode);
    });
  }
}

export default Dropdown;
