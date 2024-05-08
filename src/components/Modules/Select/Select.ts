/**
 * Плагин селекта
 *
 * Селект представляет из себя стандартный селект, но с дополнительным функционалом + с возможностью стилизации
 *
 * Автор: Ерохин Максим
 * Дата: 26.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/%D0%9C%D0%BE%D0%B4%D1%83%D0%BB%D1%8C-Select
 */

import './Select.scss';
import Logger from '../../Core/Logger';
import Faze from '../../Core/Faze';

/**
 * Структура конфига дропдауна
 *
 * Содержит:
 *   name - имя для скрытого инпута
 *   positionTopOffset  - сдвиг тела от верхнего края заголовка, например для отображения там стрелочки
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при успешном создании селекта
 *     changed - пользовательская функция, исполняющаяся при изменении значения селекта, а именно, после клика по новому значению в его теле
 *     opened  - пользовательская функция, исполняющаяся при открытии селекта
 */
interface Config {
  name?: string;
  default: boolean;
  positionTopOffset: number;
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    opened?: (data: CallbackData) => void;
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
  selectedOption?: HTMLElement;
}

/**
 * Класс дропдауна
 */
class Select {
  // DOM элемент селекта
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // Помощник для логирования
  readonly logger: Logger;

  // Заголовок дропдауна
  titleNode: HTMLElement | null;

  // Тело дропдауна
  bodyNode: HTMLElement | null;

  // Опции селекта которые можно выбирать
  optionsNodes: NodeListOf<HTMLElement>;

  // DOM элемент срытого инпута с значением
  readonly valueInputNode: HTMLInputElement;

  // Выбранное значение
  value: string | null;

  // DOM элемент изначального значения в селекте(то которое в заголовке)
  readonly initialOptionNode: HTMLDivElement;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект селекта!');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Select:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-select-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      name: node.dataset.fazeSelectName,
      default: true,
      positionTopOffset: 0,
      callbacks: {
        created: undefined,
        changed: undefined,
        opened: undefined,
      },
    };

    this.config = { ...defaultConfig, ...config };
    this.node = node;

    // Инициализация переменных
    if (this.config.default) {
      this.initialOptionNode = document.createElement('div');
    }

    if (this.config.name) {
      this.valueInputNode = document.createElement('input');
    }

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка класса, если этого не было сделано руками
    this.node.classList.add('faze-select');

    // Поиск основных элементов и проверка на то что они найдены
    this.titleNode = this.node.querySelector('.faze-title');
    this.bodyNode = this.node.querySelector('.faze-body');

    if (!this.titleNode || !this.bodyNode) {
      return this.logger.error('Для селекта не найдены шапка и тело!');
    }

    // Если имеется первичное значение селекта
    if (this.config.default) {
      // Вставляем изначальный(тот что был в заголовке) вариант первым
      this.initialOptionNode.className = 'faze-option';
      this.initialOptionNode.dataset.fazeSelectValue = 'FAZE_INITIAL_TITLE';
      this.initialOptionNode.textContent = this.titleNode.textContent;
      this.initialOptionNode.style.display = 'none';
      this.bodyNode.insertBefore(this.initialOptionNode, this.bodyNode.firstChild);

      // Берем все опции в селекте
      this.optionsNodes = this.bodyNode.querySelectorAll('.faze-option');
    } else {
      // Если нет, то делаем выбираем первую опцию по умолчанию
      const firstOption = <HTMLElement>this.bodyNode.querySelector('.faze-option:first-child');
      if (firstOption) {
        this.titleNode.textContent = firstOption.getAttribute('data-faze-caption') || firstOption.textContent;
        this.value = firstOption.dataset.fazeSelectValue || firstOption.textContent;

        // Берем все опции в селекте
        this.optionsNodes = this.bodyNode.querySelectorAll('.faze-option');

        this.hideOption(this.value);
      }
    }

    // Присвоение сдвига для тела
    this.bodyNode.style.top = `${this.titleNode.offsetHeight + this.config.positionTopOffset}px`;

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // Инициализация скрытого инпута
    if (this.valueInputNode) {
      this.valueInputNode.type = 'hidden';
      this.valueInputNode.name = this.config.name || '';
      this.valueInputNode.value = this.value || '';

      this.node.appendChild(this.valueInputNode);
    }

    // Простановка заданного значения
    this.setValue(this.node.dataset.fazeSelectInitialValue || '');

    // Вызываем пользовательскую функцию
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          title: this.titleNode,
          body: this.bodyNode,
          value: this.value,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created", дословно: ${error}`);
      }
    }
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    if (!this.titleNode || !this.bodyNode) {
      return this.logger.error('Не заданы шапка и тело селекта');
    }

    // Пересоздаем заголовок чтобы удалить с него все бинды
    this.resetTitle();

    // При нажатии на заголовок, меняем видимость тела селекта
    this.titleNode.addEventListener('click', (event) => {
      event.preventDefault();

      if (!this.node.classList.contains('faze-disabled')) {
        this.node.classList.toggle('faze-active');
      }

      // Вызываем пользовательскую функцию при открытии селекта
      if (this.node.classList.contains('faze-active')) {
        if (typeof this.config.callbacks.opened === 'function') {
          try {
            this.config.callbacks.opened({
              title: this.titleNode,
              body: this.bodyNode,
              value: this.value,
            });
          } catch (error) {
            this.logger.error(`Ошибка исполнения пользовательского метода "opened", дословно: ${error}`);
          }
        }
      }
    });

    // Навешиваем события на нажатие по опциям, при нажатии нужно сделать её активной,
    // то есть её надпись поставить в заголовок селекта и запомнить выбранное значение
    this.optionsNodes.forEach((optionNode) => {
      optionNode.addEventListener('click', (event) => {
        event.preventDefault();

        // Выбранное значение, сначала проверяем дата атрибут, если его нет, то берем текст внутри
        const value = optionNode.dataset.fazeSelectValue ? optionNode.dataset.fazeSelectValue || '' : optionNode.textContent || '';

        this.setValue(value);

        // Вызываем пользовательскую функцию
        if (typeof this.config.callbacks.changed === 'function') {
          try {
            this.config.callbacks.changed({
              title: this.titleNode,
              body: this.bodyNode,
              value: this.value,
              selectedOption: optionNode,
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
   * Присвоение нового значение селекта
   *
   * @param value - значение опции которую нужно выбрать
   */
  setValue(value: string): void {
    if (!this.titleNode) {
      return this.logger.error('Не задана шапка селекта');
    }

    // Ищем нужную опцию
    const optionNode = Array.from(this.optionsNodes).find((option) => option.dataset.fazeSelectValue === value || option.textContent === value);

    // Если нет такой опции
    if (!optionNode) {
      return;
    }

    // Меняем заголовок
    this.titleNode.textContent = optionNode.dataset.caption || optionNode.textContent;
    this.value = optionNode.dataset.fazeSelectValue || optionNode.textContent;

    // Закрываем селект
    this.node.classList.remove('faze-active');

    // Скрываем выбранную опцию
    this.hideOption(this.value);

    // Присваиваем выбранное значение инпуту, если он есть
    if (this.valueInputNode) {
      this.valueInputNode.value = this.value || '';
    }
  }

  /**
   * Пересоздание заголовка, для сброса всех биндов на нём
   * Нужно для реинициализации дропдауна
   */
  resetTitle(): void {
    if (!this.titleNode) {
      return this.logger.error('Не задана шапка дропдауна');
    }

    const cloneTitle = this.titleNode.cloneNode(true);
    if (this.titleNode.parentNode) {
      this.titleNode.parentNode.replaceChild(cloneTitle, this.titleNode);
      this.titleNode = <HTMLElement>cloneTitle;
    }
  }

  /**
   * Скрываем опцию с заданным значением
   *
   * @param value - значение, если у опции такое же, то скрываем её
   */
  hideOption(value: string | null) {
    this.optionsNodes.forEach((optionNode) => {
      const optionValue = optionNode.dataset.fazeSelectValue || optionNode.textContent;

      if (optionValue === value) {
        optionNode.style.display = 'none';
      } else {
        optionNode.style.display = 'block';
      }
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param selectNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(selectNode: HTMLElement): void {
    new Faze.Select(selectNode, {
      name: selectNode.dataset.fazeSelectName,
      default: (selectNode.dataset.fazeSelectDefault || 'false') === 'true',
      positionTopOffset: parseInt(selectNode.dataset.fazeSelectPositionTopOffset || '0', 10),
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="select"]', (selectNode: HTMLElement) => {
      Select.initializeByDataAttributes(selectNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="select"]').forEach((selectNode: HTMLElement) => {
      Select.initializeByDataAttributes(selectNode);
    });
  }
}

export default Select;
