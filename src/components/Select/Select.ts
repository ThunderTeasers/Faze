/**
 * Плагин селекта
 *
 * Селект представляет из себя "стандартный" селект, только с возможностью кастомизирования через CSS стили.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'FilterSelects',
 *     plugins: ['Select'],
 *     condition: document.querySelectorAll('.faze-select').length,
 *     callback: () => {
 *       new Faze.Select(document.querySelector('.faze-select'));
 *     }
 *   });
 *
 * В HTML:
 *   <div class="faze-select">
 *     <div class="faze-title">Селект</div>
 *      <div class="faze-body">
 *        <div class="faze-option">Выбор 1</div>
 *        <div class="faze-option">Выбор 2</div>
 *        <div class="faze-option">Выбор 3</div>
 *      </div>
 *   </div>
 */

import './Select.scss';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   positionTopOffset  - сдвиг тела от верхнего края заголовка, например для отображения там стрелочки
 *   callbacks
 *     created - пользовательская футкция, исполняющаяся при успешном создании селекта
 *     changed - пользовательская футкция, исполняющаяся при изменении значения селекта, а именно, после клика по новому значению в его теле
 *     opened  - пользовательская футкция, исполняющаяся при открытии селекта
 */
interface Config {
  default: boolean;
  positionTopOffset: number;
  callbacks: {
    created?: (data: CallbackData) => void,
    changed?: (data: CallbackData) => void,
    opened?: (data: CallbackData) => void,
  };
}

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок селекта
 *   body   - тело селекта
 */
interface CallbackData {
  title: HTMLElement | null;
  body: HTMLElement | null;
  value: string | null;
}

/**
 * Класс дропдауна
 */
class Select {
  // DOM элемент селекта
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Заголовок дропдауна
  title: HTMLElement | null;

  // Тело дропдауна
  body: HTMLElement | null;

  // Опции селекта которые можно выбирать
  options: NodeListOf<HTMLElement>;

  // Выбранное значение
  value: string | null;

  // DOM элемент изначального значения в селекте(то которое в заголовке)
  readonly initialOptionNode: HTMLDivElement;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект селекта');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      default: true,
      positionTopOffset: 0,
      callbacks: {
        created: undefined,
        changed: undefined,
        opened: undefined,
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    if (this.config.default) {
      this.initialOptionNode = document.createElement('div');
    }

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
      throw new Error('Для селекта не найдены шапка и тело');
    }

    // Если имеется первичное значение селекта
    if (this.config.default) {
      // Вставляем изначальный(тот что был в заголовке) вариант первым
      this.initialOptionNode.className = 'faze-option';
      this.initialOptionNode.setAttribute('data-faze-value', 'FAZE_INITIAL_TITLE');
      this.initialOptionNode.textContent = this.title.textContent;
      this.initialOptionNode.style.display = 'none';
      this.body.insertBefore(this.initialOptionNode, this.body.firstChild);

      // Берем все опции в селекте
      this.options = this.body.querySelectorAll('.faze-option');
    } else {
      // Если нет, то делаем выбираем первую опцию по умолчанию
      const firstOption = this.body.querySelector('.faze-option:first-child');
      if (firstOption) {
        this.title.textContent = firstOption.getAttribute('data-faze-caption') || firstOption.textContent;
        this.value = firstOption.getAttribute('data-faze-value') || firstOption.textContent;

        // Берем все опции в селекте
        this.options = this.body.querySelectorAll('.faze-option');

        this.hideOption(this.value);
      }
    }

    // Присвоение сдвига для тела
    this.body.style.top = `${this.title.offsetHeight + this.config.positionTopOffset}px`;

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // Вызываем пользовательскую функцию
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          title: this.title,
          body: this.body,
          value: this.value,
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
      throw new Error('Не заданы шапка и тело селекта');
    }

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // При нажатии на заголовок, меняем видимость тела селекта
    this.title.addEventListener('click', (event) => {
      event.preventDefault();

      if (!this.node.classList.contains('faze-disabled')) {
        this.node.classList.toggle('faze-active');
      }

      // Вызываем пользовательскую функцию при открытии селекта
      if (this.node.classList.contains('faze-active')) {
        if (typeof this.config.callbacks.opened === 'function') {
          try {
            this.config.callbacks.opened({
              title: this.title,
              body: this.body,
              value: this.value,
            });
          } catch (error) {
            console.error('Ошибка исполнения пользовательского метода "opened":', error);
          }
        }
      }
    });

    // Навешиваем события на нажатие по опциям, при нажатии нужно сделать её активной,
    // то есть её надпись поставить в заголовок селекта и запомнить выбранное значение
    this.options.forEach((option) => {
      option.addEventListener('click', (event) => {
        event.preventDefault();

        if (!this.title) {
          throw new Error('Не задана шапка селекта');
        }

        // Меняем заголовок
        this.title.textContent = option.getAttribute('data-caption') || option.textContent;
        this.value = option.getAttribute('data-faze-value') || option.textContent;

        // Закрываем селект
        this.node.classList.remove('faze-active');

        // Скрываем выбранную опцию
        this.hideOption(this.value);

        // Вызываем пользовательскую функцию
        if (typeof this.config.callbacks.changed === 'function') {
          try {
            this.config.callbacks.changed({
              title: this.title,
              body: this.body,
              value: this.value,
            });
          } catch (error) {
            console.error('Ошибка исполнения пользовательского метода "changed":', error);
          }
        }
      });
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
      throw new Error('Не задана шапка дропдауна');
    }

    const cloneTitle = this.title.cloneNode(true);
    if (this.title.parentNode) {
      this.title.parentNode.replaceChild(cloneTitle, this.title);
      this.title = <HTMLElement>cloneTitle;
    }
  }

  /**
   * Скрываем опцию с заданным значением
   *
   * @param value - значение, если у опции такое же, то скрываем её
   */
  hideOption(value: string | null) {
    this.options.forEach((option) => {
      const optionValue = option.getAttribute('data-faze-value') || option.textContent;

      if (optionValue === value) {
        option.style.display = 'none';
      } else {
        option.style.display = 'block';
      }
    });
  }
}

export default Select;
