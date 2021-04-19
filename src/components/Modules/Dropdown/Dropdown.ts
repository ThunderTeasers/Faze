/**
 * Плагин дропдауна
 *
 * Дропдаун из себя представляет "шапку" при нажатии на которую снизу появляется "тело".
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Select
 */

import './Dropdown.scss';
import Faze from '../../Core/Faze';
import Logger from '../../Core/Logger';

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
    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Dropdown:');

    // Проверяем задан ли основной DOM элемент
    if (!node) {
      return this.logger.error('Не задан объект дропдауна');
    }

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-dropdown-initialized')) {
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
    // Простановка стандартных классов
    this.node.classList.add('faze-dropdown');
    this.node.classList.add('faze-dropdown-initialized');

    // Поиск основных элементов и проверка на то что они найдены
    this.title = this.node.querySelector('.faze-title, [data-faze-dropdown="title"]');
    this.body = this.node.querySelector('.faze-body, [data-faze-dropdown="body"]');

    if (!this.title || !this.body) {
      return this.logger.error('Для дропдауна не найдены шапка и тело');
    }

    // Присвоение сдвига для тела
    let topOffset: number = this.title.offsetHeight + this.config.positionTopOffset;
    if (this.config.strictPosition) {
      const callerRect: DOMRect = this.node.getBoundingClientRect();
      const {documentElement} = document;

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
    document.addEventListener('click', (event: Event) => {
      const path = (<any>event).path || (event.composedPath && event.composedPath());
      if (path) {
        if (!path.find((element: HTMLElement) => element === this.node)) {
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
   * @param dropdownNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(dropdownNode: HTMLElement): void {
    new Faze.Dropdown(dropdownNode, {
      strictPosition: (dropdownNode.dataset.fazeDropdownStrictPosition || 'false') === 'true',
      positionTopOffset: parseInt(dropdownNode.dataset.fazeDropdownPositionTopOffset || '0', 10),
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="dropdown"]', (dropdownNode: HTMLElement) => {
      Dropdown.initializeByDataAttributes(dropdownNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="dropdown"]').forEach((dropdownNode: HTMLElement) => {
      Dropdown.initializeByDataAttributes(dropdownNode);
    });
  }
}

export default Dropdown;
