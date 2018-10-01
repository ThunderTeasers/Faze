import './Form.scss';

interface CallbackData {
  form: HTMLFormElement;
  button: HTMLElement | null;
  response?: any;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   callbacks
 *     created  - пользовательская функция, исполняющаяся при инициализации формы
 *     success  - пользовательская функция, исполняющаяся при полученном ответе от сервера после отправки данных
 *     error    - пользовательская функция, исполняющаяся при ошибке получения ответа от сервера после отправки данных
 *   selectors
 *     button   - CSS селектор кнопки отправки
 */
interface Config {
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
  // DOM элемент при наведении на который появляется тултип
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
    try {
      if (typeof this.config.callbacks.created === 'function') {
        this.config.callbacks.created({
          form: this.node,
          button: this.button,
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

      const url = this.node.getAttribute('action') || window.location.href;

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
                form: this.node,
                button: this.button,
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
                form: this.node,
                button: this.button,
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
      this.button.setAttribute('data-initial-text', this.button.textContent || '');
      this.button.classList.add('disabled');
      this.button.textContent = this.button.getAttribute('data-loading-text') || 'Обработка...';
    }
  }

  /**
   * Разблокирует кнопку, ставя ей обратно текст который был на ней изначально, до блокировки
   */
  unlockButton() {
    if (this.button) {
      this.button.removeAttribute('disabled');
      this.button.classList.remove('disabled');
      this.button.textContent = this.button.getAttribute('data-initial-text') || 'Готово!';
    }
  }
}

export default Form;
