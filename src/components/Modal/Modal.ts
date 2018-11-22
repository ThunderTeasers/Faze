/**
 * Плагин модального окна
 *
 * Модальное окно, содержит шапку, тело, в котором будет отображаться подгруженный конткнт с указанного адреса и подвал, в котором
 * находятся сгенерированные кнопки из конфига(если они есть)
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 25.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'ManagerModal',
 *     plugins: ['Modal'],
 *     condition: document.querySelectorAll('.modal-caller').length,
 *     callback: () => {
 *       new Faze.Tooltip(document.querySelector('.modal-caller'), {
 *         title: 'Заголовок модального окна',
 *         url: '/form.html',
 *         class: 'modal-manager',
 *         buttons: [
 *           {
 *             caption: 'Закрыть',
 *             class: 'btn btn-close',
 *             callback: ({closeButton}) => {
 *               closeButton.click();
 *             },
 *           },
 *         ],
 *       });
 *     }
 *   });
 *
 * В HTML:
 *   <div class="modal-caller">Нажмите для вызова модального окна</div>
 */

import './Modal.scss';
import Faze from '../Core/Faze';

/**
 * Структура кнопки в подвале
 *
 * Содержит:
 *   caption  - надпись на кнопке
 *   class    - CSS класс для кастомизации кнопки
 *   callback - пользовательский метод, исполняющийся после нажатия на кнопку
 */
interface Button {
  caption: string;
  class?: string;
  callback: (modalParts: Partial<ModalParts>) => void;
}

/**
 * Структура хранения кнопок в подвале
 */
interface Buttons {
  [index: number]: Button;
  length: number;
  [Symbol.iterator](): IterableIterator<Button>;
}

/**
 * Структура конфига модального окна
 *
 * Содержит:
 *   title        - заголовок окна
 *   url          - адрес с которого будет взят контент для вставки в тело
 *   class        - CSS класс модального окна для кастомизации
 *   event        - событие при вызове которого на переданный элемент(node) должно вызываться модальное окно
 *   evented      - отображать модальное окно по событию или сразу
 *   draggable    - флаг указывающий можно ли передвигать форму
 *   delayToClose - время в миллисекундах от нажатия кнопки закрытия до удаления модального окна со страницы, нужно для анимации
 *   callbacks
 *     success    - пользовательский метод, исполняющийся при успешном выполнении запроса на получение данных по url указанного выше
 *     error      - пользовательский метод, исполняющийся при неудачном получении контента по url указанному выше
 *   buttons      - массив данных для кнопок, которые будут сгенерированны в подвале модального окна, из описание см. в "interface Button"
 */
interface Config {
  title?: string;
  url: string;
  class?: string;
  event: string;
  evented: boolean;
  draggable: boolean;
  delayToClose?: number;
  callbacks: {
    success?: (parts: ModalParts) => void,
    error?: (parts: ModalParts) => void,
  };
  buttons?: Buttons;
}

/**
 * Структура модального окна
 *
 * Содержит:
 *   closeButton  - кнопка закрытия в шапке
 *   header       - шапка модального окна
 *   body         - тело модального окна, где находится подгружаемый контент
 *   footer       - подвал модального окна, содержит сгенерированные кнопки
 *   full         - само модальное окно собранное из header, body и footer'а
 *   wrapper      - элемент содержащий всё что связанно с модальным окном
 */
interface ModalParts {
  closeButtonNode: HTMLElement;
  headerNode: HTMLElement;
  bodyNode: HTMLElement;
  footerNode: HTMLElement;
  fullNode: HTMLElement;
  wrapperNode: HTMLElement;
}

/**
 * Класс модального окна
 */
class Modal {
  // DOM элемент при нажатии на который появляется модальное окно
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  modalParts: ModalParts;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект при нажатии на который должно появляться модальное окно');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      title: '',
      url: '',
      class: '',
      event: 'click',
      evented: true,
      draggable: false,
      delayToClose: 0,
      callbacks: {
        success: undefined,
        error: undefined,
      },
      buttons: [],
    };

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.bind();
  }

  /**
   * Пересоздание частей модального окна при каждом вызове
   */
  reset() {
    this.modalParts = {
      closeButtonNode: document.createElement('div'),
      headerNode: document.createElement('header'),
      bodyNode: document.createElement('main'),
      footerNode: document.createElement('footer'),
      fullNode: document.createElement('div'),
      wrapperNode: document.createElement('div'),
    };
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (this.config.evented) {
      this.node.addEventListener(this.config.event, (event) => {
        event.preventDefault();

        this.create();
      });
    } else {
      this.create();
    }
  }

  /**
   * Создание формы
   */
  create() {
    document.body.classList.add('faze-modal-opened');

    // Получение контента
    this.getContent()
      .then((responseText) => {
        this.build(responseText);

        // Исполняем пользовательский метод при успешном получении данных
        if (typeof this.config.callbacks.success === 'function') {
          try {
            this.config.callbacks.success(this.modalParts);
          } catch (e) {
            console.error('Ошибка исполнения пользовательского метода "success":', e);
          }
        }
      })
      .catch((error) => {
        console.error(`Ошибка при получении данных с сервера по адресу ${this.config.url}`, error);

        // Исполняем пользовательский метод при ошибки получения данных
        if (typeof this.config.callbacks.error === 'function') {
          try {
            this.config.callbacks.error(this.modalParts);
          } catch (e) {
            console.error('Ошибка исполнения пользовательского метода "error":', e);
          }
        }
      });
  }

  /**
   * Полное построение модального окна и добавление его на страницу
   *
   * @param content - контент для вставки в тело окна
   */
  build(content?: string): void {
    this.reset();

    this.buildHeader();
    this.buildBody(content);
    this.buildFooter();
    this.buildFull();

    this.modalParts.wrapperNode.className = 'faze-modal-wrapper';
    this.modalParts.wrapperNode.appendChild(this.modalParts.fullNode);

    document.body.appendChild(this.modalParts.wrapperNode);
  }

  /**
   * Создание шапки окна
   */
  buildHeader(): void {
    // Кнопка закрытия модульного окна
    this.buildAndBindCloseButton();

    // Заголовок
    const titleNode = document.createElement('span');
    titleNode.textContent = this.config.title || '';

    this.modalParts.headerNode = document.createElement('header');
    this.modalParts.headerNode.appendChild(titleNode);
    this.modalParts.headerNode.appendChild(this.modalParts.closeButtonNode);
  }

  /**
   * Создание кнопки закрытия и бинд на её нажатие
   */
  buildAndBindCloseButton(): void {
    this.modalParts.closeButtonNode.className = 'faze-close';

    this.modalParts.closeButtonNode.addEventListener('click', (event) => {
      event.preventDefault();

      document.body.classList.remove('faze-modal-opened');

      // Сначала навешивается класс, а потом через указанное время удаляем окно со страницы, это нужно для того чтобы анимация
      // (если она есть) успела проиграться и завершиться
      this.modalParts.fullNode.classList.add('faze-closing');
      setTimeout(() => this.modalParts.wrapperNode.remove(), this.config.delayToClose);
    });
  }

  /**
   * Создание тела
   *
   * @param content - контент для вставки в тело окна
   */
  buildBody(content?: string) {
    this.modalParts.bodyNode.innerHTML = content || '';
  }

  /**
   * Создание подвала
   */
  buildFooter(): void {
    // Создание кнопок
    this.buildButtons();
  }

  /**
   * Метод создания кнопок из конфига
   */
  buildButtons() {
    const buttonsNode = document.createElement('div');
    buttonsNode.className = 'faze-buttons';

    if (this.config.buttons && this.config.buttons.length > 0) {
      for (const buttonData of this.config.buttons) {
        const buttonNode = document.createElement('button');
        buttonNode.className = buttonData.class || '';
        buttonNode.textContent = buttonData.caption || '';

        // Исполняем пользовательский метод при нажатии на кнопку
        if (typeof buttonData.callback === 'function') {
          try {
            buttonNode.addEventListener('click', () => buttonData.callback(this.modalParts));
          } catch (e) {
            console.error(e);
          }
        }

        buttonsNode.appendChild(buttonNode);
      }

      this.modalParts.footerNode.appendChild(buttonsNode);
    }
  }

  /**
   * Компановка частей модального окна в один элемент
   */
  buildFull(): void {
    this.modalParts.fullNode.className = `faze-modal ${this.config.class}`;

    this.modalParts.fullNode.appendChild(this.modalParts.headerNode);
    this.modalParts.fullNode.appendChild(this.modalParts.bodyNode);
    this.modalParts.fullNode.appendChild(this.modalParts.footerNode);
  }

  /**
   * Получение контента со сторонней страницы, для последующей вставки в тело окна
   */
  async getContent(): Promise<string> {
    const response = await fetch(this.config.url);
    return await response.text();
  }

  /**
   * Инициализация формы по data атрибутам
   */
  static hotInitialize(): void {
    Faze.on('click', '[data-faze="modal"]', (event, callerNode) => {
      new Faze.Modal(callerNode, {
        title: callerNode.dataset.fazeModalTitle || '',
        evented: false,
        url: callerNode.dataset.fazeModalUrl || '',
        class: callerNode.dataset.fazeModalClass || '',
      });
    });
  }
}

export default Modal;
