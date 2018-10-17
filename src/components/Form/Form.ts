/**
 * Плагин формы
 *
 * Модуль формы представляет из себя легкую обертку над стандартными формами с предоставлением функционала отправления POST запроса к
 * серверу и возможностью задать пользовательские функции колбеки для работы с ответом от сервера.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 01.10.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'OrderForm',
 *     plugins: ['Form'],
 *     condition: document.querySelectorAll('.form-order').length,
 *     callback: () => {
 *       new Faze.Form(document.querySelector('.form-order'), {
 *         callbacks: {
 *           success: (data) => {
 *             console.log(data.response);
 *           },
 *         },
 *       });
 *     },
 *   });
 *
 * В HTML:
 *   <form class="form-order">
 *     <input type="text" name="name" placeholder="ФИО">
 *     <input type="email" name="email" placeholder="email">
 *     <button type="submit">
 *       Отправить
 *     </button>
 *   </form>
 */

import './Form.scss';

/**
 * Структура возвращаемого объекта в пользовательских функциях
 *
 * Содержит:
 *   form     - DOM элемент формы
 *   button   - DOM элемент кнопки submit
 *   response - ответ от сервера после передачи запроса, так же может содержать ошибку, в случае, если сервер не ответил
 */
interface CallbackData {
  formNode: HTMLFormElement;
  buttonNode: HTMLElement | null;
  response?: any;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   url        - адрес на который отправлять POST запрос
 *   texts
 *     buttonLoading    - текст на кнопке в момент отправки запроса
 *     buttonCompleted  - текст на кнопке после выполнения запроса, если изначально его не было
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся при инициализации формы
 *     success  - пользовательская функция, исполняющаяся при полученном ответе от сервера после отправки данных
 *     error    - пользовательская функция, исполняющаяся при ошибке получения ответа от сервера после отправки данных
 *   selectors
 *     button   - CSS селектор кнопки отправки
 */
interface Config {
  url?: string;
  texts: {
    buttonLoading: string;
    buttonCompleted: string;
  };
  callbacks: {
    created?: (data: CallbackData) => void;
    success?: (data: CallbackData) => void;
    error?: (data: CallbackData) => void;
  };
  selectors: {
    button: string;
  };
}

/**
 * Класс форм
 */
class Form {
  // DOM элемент формы
  readonly node: HTMLFormElement;

  // Конфиг с настройками
  readonly config: Config;

  // Кнопка сабмита формы(может не быть)
  readonly button: HTMLElement | null;

  constructor(node: HTMLFormElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект скрола');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      url: undefined,
      texts: {
        buttonLoading: 'Обработка...',
        buttonCompleted: 'Готово!',
      },
      callbacks: {
        created: undefined,
        success: undefined,
        error: undefined,
      },
      selectors: {
        button: '[type="submit"]',
      },
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    // Инициализация переменных
    this.button = this.node.querySelector(this.config.selectors.button);

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Присваиваем особый класс для стилей
    this.node.classList.add('faze-form');

    // Выполняем пользовательскую фукнции
    try {
      if (typeof this.config.callbacks.created === 'function') {
        this.config.callbacks.created({
          formNode: this.node,
          buttonNode: this.button,
          response: undefined,
        });
      }
    } catch (error) {
      console.error('Ошибка исполнения пользовательской функции "created":', error);
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.node.addEventListener('submit', (event) => {
      const formData = new FormData(this.node);

      // Блокировка кнопки от повторного нажатия
      this.lockButton();

      // Получение URL куда отправляем запрос
      const url = this.config.url || this.node.getAttribute('action') || window.location.href;

      // Отправка данных на сервер
      fetch(url, {
        method: 'POST',
        body: formData,
      })
        .then(response => response.json())
        .then((response) => {
          // Успешная отправка
          // Выполнение кастомной функции
          if (typeof this.config.callbacks.success === 'function') {
            try {
              this.config.callbacks.success({
                response,
                formNode: this.node,
                buttonNode: this.button,
              });
            } catch (error) {
              console.log('Ошибка исполнения пользовательской функции "success":', error);
            }
          }

          // Разблокировка кнопки
          this.unlockButton();
        })
        .catch((error) => {
          // Неудача отправки
          // Выполнение кастомной функции
          if (typeof this.config.callbacks.error === 'function') {
            try {
              this.config.callbacks.error({
                formNode: this.node,
                buttonNode: this.button,
                response: error,
              });
            } catch (error) {
              console.error('Ошибка исполнения пользовательской функции "error":', error);
            }
          }

          // Разблокировка кнопки
          this.unlockButton();
        });

      // Отменяем стандартную отправку, т.к. необходима только валидация
      event.preventDefault();
    });
  }

  /**
   * Блокирует кнопку от нажатия, так же запоминает оригинальный тест
   */
  lockButton() {
    if (this.button) {
      this.button.setAttribute('disabled', 'disabled');
      this.button.setAttribute('data-faze-initial-text', this.button.textContent || '');
      this.button.classList.add('faze-disabled');
      this.button.textContent = this.button.getAttribute('data-faze-loading-text') || this.config.texts.buttonLoading;
    }
  }

  /**
   * Разблокирует кнопку, ставя ей обратно текст который был на ней изначально, до блокировки
   */
  unlockButton() {
    if (this.button) {
      this.button.removeAttribute('disabled');
      this.button.classList.remove('faze-disabled');
      this.button.textContent = this.button.getAttribute('data-faze-initial-text') || this.config.texts.buttonCompleted;
    }
  }
}

export default Form;
