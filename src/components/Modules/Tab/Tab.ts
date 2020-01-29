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
import Module from '../../Core/Module';

/**
 * Структура конфига табов
 *
 * Содержит:
 *   group - группа табов
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  group: string;
  callbacks: {
    changed?: () => void;
  };
}

/**
 * Класс табов
 */
class Tab extends Module {
  // DOM элементы заголовков табов
  headersNodes: NodeListOf<HTMLElement>;

  // DOM элементы тел табов
  bodiesNodes: NodeListOf<HTMLElement>;

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      group: 'default',
      callbacks: {
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config,
      defaultConfig,
      name: 'Tab',
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    super.initialize();

    // Инициализация шапок и тел табов
    this.initializeTabs();

    let key: string;
    let group: string;
    const alreadyActiveTabNode: HTMLElement | undefined = Array.from(this.headersNodes).find(headerNode => headerNode.classList.contains('faze-active'));
    if (alreadyActiveTabNode) {
      key = alreadyActiveTabNode.dataset.fazeTabBody || '';
      group = alreadyActiveTabNode.dataset.fazeTabGroup || 'default';
    } else {
      key = this.headersNodes[0].dataset.fazeTabBody || '';
      group = this.headersNodes[0].dataset.fazeTabGroup || 'default';
    }

    // Активация первой вкладки по умолчанию
    this.activateTab(key, group);
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.headersNodes.forEach((header: HTMLElement) => {
      header.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        this.activateTab(header.dataset.fazeTabBody || '', header.dataset.fazeTabGroup || 'default');
      });
    });
  }

  /**
   * Инициализация шапок и тел табов
   */
  private initializeTabs(): void {
    // Получаем шапки
    this.headersNodes = this.node.querySelectorAll('.faze-tab-header');

    // Проставляем группу, если её нет
    this.headersNodes.forEach((headerNode: HTMLElement) => {
      if (!headerNode.dataset.fazeTabGroup) {
        headerNode.dataset.fazeTabGroup = 'default';
      }
    });

    // Получаем тела
    this.bodiesNodes = this.node.querySelectorAll('.faze-tabs-bodies [data-faze-tab-body]');

    // Проставляем группу, если её нет
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      if (!bodyNode.dataset.fazeTabGroup) {
        bodyNode.dataset.fazeTabGroup = 'default';
      }
    });
  }

  /**
   * Активация таба, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param key{string} - ключ в data атрибутах по которому ищем шапку и тело
   * @param group{string} - группа вкладок
   */
  activateTab(key: string, group: string): void {
    // Активируем шапку
    this.headersNodes.forEach((headerNode: HTMLElement) => {
      headerNode.classList.toggle('faze-active', key === headerNode.dataset.fazeTabBody && headerNode.dataset.fazeTabGroup === group);
    });

    // Получаем все ключи для выбора нужных тел, т.к. их может быть несколько через пробел
    const keys = key.split(' ');

    // Активируем тела
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      bodyNode.style.display = keys.includes(bodyNode.dataset.fazeTabBody || '') ? 'block' : 'none';
      bodyNode.classList.toggle('faze-active', keys.includes(bodyNode.dataset.fazeTabBody || '') && bodyNode.dataset.fazeTabGroup === group);
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
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    super.initializeByDataAttributes(node);

    new Tab(node, {
      group: node.dataset.fazeTabGroup || 'default',
    });
  }
}

export default Tab;
