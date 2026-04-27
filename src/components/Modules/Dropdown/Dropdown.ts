/**
 * Плагин дропдауна
 *
 * Дропдаун из себя представляет "шапку" при нажатии на которую снизу появляется "тело".
 *
 * Автор: Ерохин Максим
 * Дата: 26.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Select
 */

import './Dropdown.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   positionTopOffset  - сдвиг тела от верхнего края заголовка, например для отображения там стрелочки
 *   strictPosition     - считать ли сдвиг не только снизу заголовка, но еще и со сдвигом страницы
 *   closeWhenClickOutside - закрывать ли дропдаун при клике вне его
 *   callbacks
 *     created  - пользовательский метод, исполняющийся при успешном создании дропдауна
 *     opened   - пользовательский метод, исполняющийся при открытии дропдауна
 *     closed   - пользовательский метод, исполняющийся при закрытии дропдауна
 */
interface Config {
  positionTopOffset: number;
  strictPosition: boolean;
  closeWhenClickOutside: boolean;
  callbacks: {
    created?: (data: CallbackData) => void;
    opened?: (data: CallbackData) => void;
    closed?: (data: CallbackData) => void;
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
class Dropdown extends Module {
  // Заголовок дропдауна
  title: HTMLElement | null;

  // Тело дропдауна
  body: HTMLElement | null;

  // Флаг открытости дропдауна
  isOpen: boolean;

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      positionTopOffset: 0,
      strictPosition: false,
      closeWhenClickOutside: true,
      callbacks: {
        created: undefined,
        opened: undefined,
        closed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Dropdown',
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();

    // Инициализация переменных
    this.isOpen = false;
    this.title = this.node.querySelector('.faze-title, [data-faze-dropdown="title"]');
    this.body = this.node.querySelector('.faze-body, [data-faze-dropdown="body"]');

    if (!this.title || !this.body) {
      this.logger.error('initialize', 'Для дропдауна не найдены шапка и тело');
    }

    // Вычисляем позицию тела относительно заголовка
    this.calculatePosition();

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // Вызываем пользовательский метод
    super.call(this.config.callbacks.created, { title: this.title, body: this.body }, 'created');
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    if (!this.title || !this.body) {
      this.logger.error('bind', 'Не заданы шапка и тело дропдауна');
    }

    // При нажатии на заголовок, меняем видимость тела дропдауна
    Faze.Events.click(this.title, () => {
      this.isOpen ? this.close() : this.open();
    }, false);

    // Проверка на нажатие за пределами селекта
    if (this.config.closeWhenClickOutside) {
      document.documentElement.addEventListener('click', (event: Event) => {
        if (!Faze.Helpers.isMouseOverlapsNode(event, this.node)) {
          this.close();
        }
      });
    }
  }

  /**
   * Вычисление позиции тела относительно заголовка
   * Считает позицию тела от верхнего края заголовка, с учетом сдвига страницы, если это указано в конфиге
   */
  private calculatePosition(): void {
    // Присвоение сдвига для тела
    let topOffset: number = this.title!.offsetHeight + this.config.positionTopOffset;
    if (this.config.strictPosition) {
      const callerRect: DOMRect = this.node.getBoundingClientRect();
      const { documentElement } = document;

      if (documentElement) {
        topOffset += (window.pageYOffset || documentElement.scrollTop) + callerRect.top;
      }
    }

    this.body!.style.top = `${topOffset}px`;
  }

  /**
   * Открытие дропдауна
   */
  open(): void {
    this.isOpen = true;

    this.node.classList.add('faze-active');
    super.call(this.config.callbacks.opened, { title: this.title, body: this.body }, 'opened');
  }

  /**
   * Закрытие дропдауна
   */
  close(): void {
    this.isOpen = false;

    this.node.classList.remove('faze-active');
    super.call(this.config.callbacks.closed, { title: this.title, body: this.body }, 'closed');
  }

  /**
   * Пересоздание заголовка, для сброса всех биндов на нём
   * Нужно для реинициализации дропдауна
   */
  resetTitle(): void {
    if (!this.title) {
      this.logger.error('resetTitle', 'Не задана шапка дропдауна');
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
      closeWhenClickOutside: (dropdownNode.dataset.fazeDropdownCloseWhenClickOutside || 'true') === 'true',
      positionTopOffset: parseInt(dropdownNode.dataset.fazeDropdownPositionTopOffset || '0', 10),
    });
  }
}

export default Dropdown;
