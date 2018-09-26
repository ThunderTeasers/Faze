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
 *   PlarsonJS.add({
 *     pluginName: 'FilterDropdowns',
 *     plugins: ['Dropdown'],
 *     condition: document.querySelectorAll('.dropdown').length,
 *     callback: () => {
 *       new PlarsonJS.Dropdown(document.querySelector('.dropdown'));
 *     }
 *   });
 *
 * В HTML:
 *   <div class="dropdown">
 *     <div class="title">Дропдаун</div>
 *     <div class="body">Тело дропдауна</div>
 *   </div>
 */

import './Dropdown.scss';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   positionTopOffset  - сдвиг тела от верхнего края заголовка, например для отображения там стрелочки
 *   callbacks
 *     created  - пользовательский метод, исполняющийся при успешном создании дропдауна
 *     opened   - пользовательский метод, исполняющийся при открытии дропдауна
 */
interface Config {
  positionTopOffset: number;
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
  // DOM элемент при наведении на который появляется тултип
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Заголовок дропдауна
  title: HTMLElement | null;

  // Тело дропдауна
  body: HTMLElement | null;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект дропдауна');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      positionTopOffset: 0,
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
    this.title = this.node.querySelector('.title');
    this.body = this.node.querySelector('.body');

    if (!this.title || !this.body) {
      throw new Error('Для дропдауна не найдены шапка и тело');
    }

    // Присвоение сдвига для тела
    this.body.style.top = `${this.title.offsetHeight + this.config.positionTopOffset}px`;

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
        console.error('Ошибка исполнения пользовательского метода "created":', error);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (!this.title || !this.body) {
      throw new Error('Не заданы шапка и тело дропдауна');
    }

    // При нажатии на заголовок, меняем видимость тела дропдауна
    this.title.addEventListener('click', (event) => {
      event.preventDefault();

      this.node.classList.toggle('active');

      if (this.node.classList.contains('active')) {
        // Вызываем пользовательский метод
        if (typeof this.config.callbacks.opened === 'function') {
          try {
            this.config.callbacks.opened({
              title: this.title,
              body: this.body,
            });
          } catch (error) {
            console.error('Ошибка исполнения пользовательского метода "opened":', error);
          }
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
      throw new Error('Не задана шапка дропдауна');
    }

    const cloneTitle = this.title.cloneNode(true);
    if (this.title.parentNode) {
      this.title.parentNode.replaceChild(cloneTitle, this.title);
      this.title = <HTMLElement>cloneTitle;
    }
  }
}

export default Dropdown;
