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
import Faze from '../../Core/Faze';

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
  callback: (modalParts: Partial<ModalParts>, buttonNode: HTMLButtonElement) => void;
}

/**
 * Структура хранения кнопок в подвале
 */
interface Buttons {
  [index: number]: Button;

  [Symbol.iterator](): IterableIterator<Button>;

  length: number;
}

/**
 * Структура конфига модального окна
 *
 * Содержит:
 *   title        - заголовок окна
 *   url          - адрес с которого будет взят контент для вставки в тело
 *   html         - HTML код для вставки в тела модельного окна, используется вместо указания "url"
 *   class        - CSS класс модального окна для кастомизации
 *   event        - событие при вызове которого на переданный элемент(node) должно вызываться модальное окно
 *   evented      - отображать модальное окно по событию или сразу
 *   draggable    - флаг указывающий можно ли передвигать форму
 *   resizable    - флаг указывающий можно ли ресайзить форму
 *   delayToClose - время в миллисекундах от нажатия кнопки закрытия до удаления модального окна со страницы, нужно для анимации
 *   callbacks
 *     success    - пользовательский метод, исполняющийся при успешном выполнении запроса на получение данных по url указанного выше
 *     error      - пользовательский метод, исполняющийся при неудачном получении контента по url указанному выше
 *   buttons      - массив данных для кнопок, которые будут сгенерированны в подвале модального окна, из описание см. в "interface Button"
 */
interface Config {
  title?: string;
  url?: string;
  html?: string;
  class?: string;
  event: string;
  evented: boolean;
  draggable: boolean;
  resizable: boolean;
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
  resizeBorders: {
    top: HTMLDivElement;
    right: HTMLDivElement;
    bottom: HTMLDivElement;
    left: HTMLDivElement;
  };
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
      url: undefined,
      html: undefined,
      class: '',
      event: 'click',
      evented: true,
      draggable: false,
      resizable: false,
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
      resizeBorders: {
        top: document.createElement('div'),
        right: document.createElement('div'),
        bottom: document.createElement('div'),
        left: document.createElement('div'),
      },
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
      .then((responseText: string) => {
        this.build(responseText);

        if (this.config.draggable) {
          this.bindDrag();
        }

        if (this.config.resizable) {
          this.bindResize();
        }

        // Исполняем пользовательский метод при успешном получении данных
        if (typeof this.config.callbacks.success === 'function') {
          try {
            this.config.callbacks.success(this.modalParts);
          } catch (e) {
            console.error('Ошибка исполнения пользовательского метода "success":', e);
          }
        }

        // Навешиваем события при нажатии клавиш
        this.bindKeys();
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
    const titleNode: HTMLSpanElement = document.createElement('span');
    titleNode.innerHTML = this.config.title || '';

    this.modalParts.headerNode = document.createElement('header');
    this.modalParts.headerNode.appendChild(titleNode);
    this.modalParts.headerNode.appendChild(this.modalParts.closeButtonNode);
  }

  /**
   * Создание кнопки закрытия и бинд на её нажатие
   */
  buildAndBindCloseButton(): void {
    this.modalParts.closeButtonNode.className = 'faze-close';

    this.modalParts.closeButtonNode.addEventListener('click', (event: Event) => {
      event.preventDefault();

      // Закрываем окно
      this.close();
    });
  }

  /**
   * Закрытие модального окна
   */
  close(): void {
    document.body.classList.remove('faze-modal-opened');

    // Сначала навешивается класс, а потом через указанное время удаляем окно со страницы, это нужно для того чтобы анимация
    // (если она есть) успела проиграться и завершиться
    this.modalParts.fullNode.classList.add('faze-closing');
    setTimeout(() => this.modalParts.wrapperNode.remove(), this.config.delayToClose);

    // Снимаем слушатели на нажатие кнопки
    this.unbindKeys();
  }

  /**
   * Создание тела
   *
   * @param content - контент для вставки в тело окна
   */
  buildBody(content?: string): void {
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
   * Создания кнопок из конфига
   */
  buildButtons(): void {
    const buttonsNode: HTMLDivElement = document.createElement('div');
    buttonsNode.className = 'faze-buttons';

    if (this.config.buttons && this.config.buttons.length > 0) {
      for (const buttonData of this.config.buttons) {
        const buttonNode: HTMLButtonElement = document.createElement('button');
        buttonNode.className = buttonData.class || '';
        buttonNode.textContent = buttonData.caption || '';

        // Исполняем пользовательский метод при нажатии на кнопку
        if (typeof buttonData.callback === 'function') {
          try {
            buttonNode.addEventListener('click', () => buttonData.callback(this.modalParts, buttonNode));
          } catch (error) {
            console.error(error);
          }
        }

        buttonsNode.appendChild(buttonNode);
      }

      this.modalParts.footerNode.appendChild(buttonsNode);
    }
  }

  /**
   * Колбек на нажатие клавиш
   */
  keyUpCallback(event: KeyboardEvent): void {
    // По нажатию на "Escape" закрываем окно
    if (event.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Навешивание событий на нажатие клавиш
   */
  bindKeys(): void {
    document.addEventListener('keyup', this.keyUpCallback.bind(this));
  }

  /**
   * Удаление событий на нажатие клавиш
   */
  unbindKeys(): void {
    document.removeEventListener('keyup', this.keyUpCallback.bind(this));
  }

  /**
   * Компановка частей модального окна в один элемент
   */
  buildFull(): void {
    this.modalParts.fullNode.className = `faze-modal ${this.config.class}`;

    // Если окно можно перетаскивать проставляем дополнительный класс
    if (this.config.draggable) {
      this.modalParts.fullNode.classList.add('faze-modal-draggable');
    }

    this.modalParts.fullNode.appendChild(this.modalParts.headerNode);
    this.modalParts.fullNode.appendChild(this.modalParts.bodyNode);
    this.modalParts.fullNode.appendChild(this.modalParts.footerNode);

    // Если поставлен флаг на ресайз создаем границы для навешивания событий и проставляем класс
    if (this.config.resizable) {
      this.modalParts.fullNode.classList.add('faze-modal-resizable');
      this.buildBordersForResize();
    }
  }

  /**
   * Построение невидимых элементов по границам для возможности вешать на них события для ресайза окна
   */
  buildBordersForResize(): void {
    this.modalParts.resizeBorders.top.className = 'faze-modal-resize-border faze-modal-resize-border-top';
    this.modalParts.fullNode.appendChild(this.modalParts.resizeBorders.top);

    this.modalParts.resizeBorders.right.className = 'faze-modal-resize-border faze-modal-resize-border-right';
    this.modalParts.fullNode.appendChild(this.modalParts.resizeBorders.right);

    this.modalParts.resizeBorders.bottom.className = 'faze-modal-resize-border faze-modal-resize-border-bottom';
    this.modalParts.fullNode.appendChild(this.modalParts.resizeBorders.bottom);

    this.modalParts.resizeBorders.left.className = 'faze-modal-resize-border faze-modal-resize-border-left';
    this.modalParts.fullNode.appendChild(this.modalParts.resizeBorders.left);
  }

  /**
   * Получение контента со сторонней страницы, для последующей вставки в тело окна
   */
  async getContent(): Promise<string> {
    if (this.config.url) {
      const response = await fetch(this.config.url, {credentials: 'same-origin'});
      return await response.text();
    } else {
      return await this.config.html || '';
    }
  }

  /**
   * Навешивание событий и управление ресайзом окна
   */
  bindResize(): void {
    // Текущие границы модального окна(на момент нажатия)
    const currentRect = {
      top: this.modalParts.fullNode.getBoundingClientRect().top,
      right: this.modalParts.fullNode.getBoundingClientRect().right,
      bottom: this.modalParts.fullNode.getBoundingClientRect().bottom,
      left: this.modalParts.fullNode.getBoundingClientRect().left,
    };

    /**
     * Обновление текущей позиции модального окна
     */
    const updateCurrentRect = () => {
      currentRect.top = this.modalParts.fullNode.getBoundingClientRect().top;
      currentRect.right = this.modalParts.fullNode.getBoundingClientRect().right;
      currentRect.bottom = this.modalParts.fullNode.getBoundingClientRect().bottom;
      currentRect.left = this.modalParts.fullNode.getBoundingClientRect().left;
    };

    /**
     * Расчет изменения размера модального окна при растягивании вверх
     *
     * @param event - событие мыши
     */
    const resizeTopBorder = (event: MouseEvent) => {
      const offset = currentRect.bottom - event.clientY;

      this.modalParts.fullNode.style.top = `${event.clientY}px`;
      this.modalParts.fullNode.style.height = `${offset}px`;
    };

    /**
     * Расчет изменения размера модального окна при растягивании вниз
     *
     * @param event - событие мыши
     */
    const resizeBottomBorder = (event: MouseEvent) => {
      const offset = event.clientY - currentRect.top;

      this.modalParts.fullNode.style.top = `${currentRect.top}px`;
      this.modalParts.fullNode.style.height = `${offset}px`;
    };

    /**
     * Расчет изменения размера модального окна при растягивании направо
     *
     * @param event - событие мыши
     */
    const resizeRightBorder = (event: MouseEvent) => {
      const offset = event.clientX - currentRect.left;

      this.modalParts.fullNode.style.left = `${currentRect.left}px`;
      this.modalParts.fullNode.style.width = `${offset}px`;
    };

    /**
     * Расчет изменения размера модального окна при растягивании налево
     *
     * @param event - событие мыши
     */
    const resizeLeftBorder = (event: MouseEvent) => {
      const offset = currentRect.right - event.clientX;

      this.modalParts.fullNode.style.left = `${event.clientX}px`;
      this.modalParts.fullNode.style.width = `${offset}px`;
    };

    /**
     * Остановка ресайза, происходит при отпускании ЛКМ, необходимо удалить все обработчики связанные с этим
     */
    const stopResize = () => {
      // Обновляем границы модального окна
      updateCurrentRect();

      document.removeEventListener('mousemove', resizeTopBorder);
      document.removeEventListener('mousemove', resizeBottomBorder);
      document.removeEventListener('mousemove', resizeRightBorder);
      document.removeEventListener('mousemove', resizeLeftBorder);
      document.removeEventListener('mouseup', stopResize);
    };

    /**
     * Инициализация резайза, происходит при нажатии на ЛКМ по границе модального окна
     *
     * @param borderCallback - функция для работы в момент движения мыши
     */
    const initResize = (borderCallback: (event: MouseEvent) => void) => {
      // Обновляем границы модального окна
      updateCurrentRect();

      document.addEventListener('mousemove', borderCallback);
      document.addEventListener('mouseup', stopResize);
    };

    // Верхняя граница
    this.modalParts.resizeBorders.top.addEventListener('mousedown', () => {
      initResize(resizeTopBorder);
    });

    // Нижняя граница
    this.modalParts.resizeBorders.bottom.addEventListener('mousedown', () => {
      initResize(resizeBottomBorder);
    });

    // Правая граница
    this.modalParts.resizeBorders.right.addEventListener('mousedown', () => {
      initResize(resizeRightBorder);
    });

    // Левая граница
    this.modalParts.resizeBorders.left.addEventListener('mousedown', () => {
      initResize(resizeLeftBorder);
    });
  }

  /**
   * Навешивание событий и управление перетаскиванием модального окна
   */
  bindDrag(): void {
    // Начальная позиция мыши
    const startMousePosition = {
      x: 0,
      y: 0,
    };

    // КОнечная позиция мыши
    const endMousePosition = {
      x: 0,
      y: 0,
    };

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      // Получение позиции курсора при нажатии на элемент
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: MouseEvent) => {
      event.preventDefault();

      // Рассчет новой позиции курсора
      endMousePosition.x = startMousePosition.x - event.clientX;
      endMousePosition.y = startMousePosition.y - event.clientY;
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Рассчет новой позиции окна
      this.modalParts.fullNode.style.left = `${(this.modalParts.fullNode.offsetLeft - endMousePosition.x)}px`;
      this.modalParts.fullNode.style.top = `${(this.modalParts.fullNode.offsetTop - endMousePosition.y)}px`;
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    this.modalParts.headerNode.addEventListener('mousedown', dragMouseDown);
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    Faze.on('click', '[data-faze="modal"]', (event, callerNode) => {
      // HTML контент модального окна
      let html = null;

      // Если есть данный data атрибут
      if (callerNode.dataset.fazeModalHtml) {
        // Пытаемся получить DOM элемент по заданному селектору
        const dataNode = document.querySelector(callerNode.dataset.fazeModalHtml);
        if (dataNode) {
          // Если получается, получаем его внутренности
          html = dataNode.innerHTML;
        }
      }

      new Faze.Modal(callerNode, {
        html,
        title: callerNode.dataset.fazeModalTitle || '',
        evented: false,
        draggable: callerNode.dataset.fazeModalDraggable === 'true',
        resizable: callerNode.dataset.fazeModalResizable === 'true',
        url: callerNode.dataset.fazeModalUrl || '',
        class: callerNode.dataset.fazeModalClass || '',
      });
    });
  }
}

export default Modal;
