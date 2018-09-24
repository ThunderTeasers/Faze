import './Modal.scss';

interface Button {
  caption: string;
  class?: string;
  callback: (modalParts: Partial<ModalParts>) => void;
}

interface Config {
  title?: string;
  url: string;
  class?: string;
  delayToClose?: number;
  callbacks: {
    success?: () => void,
    error?: () => void,
  };
  buttons?: Button[];
}

interface ModalParts {
  closeButton: HTMLElement;
  header: HTMLElement;
  body: HTMLElement;
  footer: HTMLElement;
  full: HTMLElement;
  wrapper: HTMLElement;
}

class Modal {
  // DOM элемент при нажатии на который появляется модальное окно
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  readonly modalParts: ModalParts;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект при нажатии на который должно появляться модальное окно');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      title: '',
      url: '',
      class: '',
      delayToClose: 0,
      callbacks: {
        success: undefined,
        error: undefined,
      },
      buttons: [],
    };

    this.config = Object.assign(defaultConfig, config);

    this.node = node;
    this.modalParts = {
      closeButton: document.createElement('div'),
      header: document.createElement('header'),
      body: document.createElement('main'),
      footer: document.createElement('footer'),
      full: document.createElement('div'),
      wrapper: document.createElement('div'),
    };

    this.bind();
  }

  bind(): void {
    this.node.addEventListener('click', (event) => {
      event.preventDefault();

      document.body.classList.add('modal-opened');

      this.getContent()
        .then((responseText) => {
          console.log(responseText);
          this.build();
        })
        .catch((error) => {
          console.error(`Ошибка при получении данных с сервера по адресу ${this.config.url}`, error);
        });
    });
  }

  build(content?: string): void {
    this.buildHeader();
    this.buildBody(content);
    this.buildFooter();
    this.buildFull();

    this.modalParts.wrapper.className = 'modal-wrapper';
    this.modalParts.wrapper.appendChild(this.modalParts.full);

    document.body.appendChild(this.modalParts.wrapper);
  }

  buildHeader(): void {
    // Кнопка закрытия модульного окна
    this.buildAndBindCloseButton();

    // Заголовок
    const titleNode = document.createElement('span');
    titleNode.textContent = this.config.title || '';

    this.modalParts.header = document.createElement('header');
    this.modalParts.header.appendChild(titleNode);
    this.modalParts.header.appendChild(this.modalParts.closeButton);
  }

  buildAndBindCloseButton(): void {
    this.modalParts.closeButton.className = 'close';

    this.modalParts.closeButton.addEventListener('click', (event) => {
      event.preventDefault();

      this.modalParts.full.classList.add('closing');
      setTimeout(() => this.modalParts.wrapper.remove(), this.config.delayToClose);
    });
  }

  /**
   * Создание тела
   *
   * @param content - конткнт для вставки внутрь
   */
  buildBody(content?: string) {
    this.modalParts.body.innerHTML = content || '';
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
    buttonsNode.className = 'buttons';

    if (this.config.buttons && this.config.buttons.length > 0) {
      for (const buttonData of this.config.buttons) {
        const buttonNode = document.createElement('button');
        buttonNode.className = buttonData.class || '';
        buttonNode.textContent = buttonData.caption || '';

        if (typeof buttonData.callback === 'function') {
          buttonNode.addEventListener('click', () => buttonData.callback(this.modalParts));
        }

        buttonsNode.appendChild(buttonNode);
      }

      this.modalParts.footer.appendChild(buttonsNode);
    }
  }

  buildFull(): void {
    this.modalParts.full.className = 'modal';

    this.modalParts.full.appendChild(this.modalParts.header);
    this.modalParts.full.appendChild(this.modalParts.body);
    this.modalParts.full.appendChild(this.modalParts.footer);
  }

  async getContent(): Promise<string> {
    const response = await fetch(this.config.url);
    return await response.text();
  }
}

export default Modal;
