/**
 * Плагин табов
 *
 * Модуль табов представляет из себя набор "заголовков" связанных с набором "тел" через data атрибут. Одновременно может отображаться
 * только одно "тело", какое именно отображается, зависит от того, на какой "заголовок" нажали. По умолчанию отображается первый.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/Модуль-Tab
 */

import './Tab.scss';
import Faze from '../../Core/Faze';
import Logger from '../../Core/Logger';

/**
 * Структура конфига табов
 *
 * Содержит:
 *   removeEmpty - удалять ли пустые табы
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  removeEmpty: boolean;
  callbacks: {
    changed?: () => void;
  };
}

/**
 * Класс табов
 */
class Tab {
  // DOM элемент табов
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элементы заголовков табов
  headersNodes: HTMLElement[];

  // DOM элементы тел табов
  bodiesNodes: HTMLElement[];

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Tab:');

    // Проверяем задан ли основной DOM элемент
    if (!node) {
      this.logger.error('Не задан основной DOM элемент модуля');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      removeEmpty: true,
      callbacks: {
        changed: undefined,
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
    this.node.classList.add('faze-tabs');

    // Инициализация шапок и тел табов
    this.initializeTabs();

    // Удаляем пустые табы
    if (this.config.removeEmpty) {
      this.checkEmptyTabs();
    }

    let fazeBody: string;
    const alreadyActiveTabNode: HTMLElement | undefined = Array.from(this.headersNodes).find(headerNode => headerNode.classList.contains('faze-active'));
    if (alreadyActiveTabNode) {
      fazeBody = alreadyActiveTabNode.dataset.fazeTabBody || '';
    } else {
      fazeBody = this.headersNodes[0].dataset.fazeTabBody || '';
    }

    // Активация первой вкладки по умолчанию
    this.activateTab(fazeBody);
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.headersNodes.forEach((header: HTMLElement) => {
      header.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        this.activateTab(header.dataset.fazeTabBody || '');
      });
    });
  }

  /**
   * Инициализация шапок и тел табов
   */
  private initializeTabs(): void {
    // Получаем шапки
    const headersNode: HTMLElement | null = this.node.querySelector('.faze-tabs-headers');
    if (headersNode) {
      this.headersNodes = <any>Array.from(headersNode.children).filter(childNode => childNode.classList.contains('faze-tab-header'));
    } else {
      throw new Error('Не задан объект с шапками для табов!');
    }

    // Получаем тела
    const bodiesNode: HTMLElement | null = this.node.querySelector('.faze-tabs-bodies');
    if (bodiesNode) {
      this.bodiesNodes = <any>Array.from(bodiesNode.children).filter(childNode => childNode.classList.contains('faze-tab-body'));
    } else {
      throw new Error('Не задан объект с телами для табов!');
    }
  }

  /**
   * Проверка на табы без контента
   */
  private checkEmptyTabs(): void {
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      if (!bodyNode.innerHTML.trim()) {
        this.removeTab(bodyNode.dataset.fazeTabBody || '');
      }
    });

    // Инициализация шапок и тел табов
    this.initializeTabs();
  }

  /**
   * Удаление таба(полностью, то есть и заголовка и тела)
   *
   * @param name - название таба
   */
  private removeTab(name: string): void {
    // Удаляем заголовок
    this.headersNodes.forEach((headerNode: HTMLElement) => {
      if (headerNode.dataset.fazeTabBody === name) {
        headerNode.remove();
      }
    });

    // Удаляем тело
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      if (bodyNode.dataset.fazeTabBody === name) {
        bodyNode.remove();
      }
    });
  }

  /**
   * Активация таба, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param key - ключ в data атрибутах по которому ищем шапку и тело
   */
  activateTab(key: string | null): void {
    this.headersNodes.forEach((headerNode: HTMLElement) => {
      headerNode.classList.toggle('faze-active', headerNode.dataset.fazeTabBody === key);
    });

    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      bodyNode.style.display = bodyNode.dataset.fazeTabBody === key ? 'block' : 'none';
      bodyNode.classList.toggle('faze-active', bodyNode.dataset.fazeTabBody === key);
    });

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed();
      } catch (error) {
        console.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
      }
    }
  }

  /**
   * Инициализация модуля по data атрибутам
   */
  static hotInitialize(): void {
    document.querySelectorAll('[data-faze="tab"]').forEach((tabsNode) => {
      new Faze.Tab(tabsNode);
    });
  }
}

export default Tab;
