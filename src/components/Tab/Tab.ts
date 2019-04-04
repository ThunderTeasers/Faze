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
import Faze from '../Core/Faze';

/**
 * Структура конфига табов
 *
 * Содержит:
 *   selectors
 *     headers  - CSS селекторы заголовков табов
 *     bodies   - CSS селекторы тел табов
 */
interface Config {
  selectors: {
    headers: string;
    bodies: string;
  };
}

/**
 * Класс табов
 */
class Tab {
  // DOM элемент табов
  readonly node: HTMLElement;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элементы заголовков табов
  headersNodes: NodeListOf<HTMLElement>;

  // DOM элементы тел табов
  bodiesNodes: NodeListOf<HTMLElement>;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      throw new Error('Не задан объект внутри которого лежат шапки и тела табов');
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      selectors: {
        headers: '.faze-tabs-headers .faze-tab-header',
        bodies: '.faze-tabs-bodies .faze-tab-body',
      },
    };

    this.config = {...defaultConfig, ...config};
    this.node = node;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.node.classList.add('faze-tabs');
    this.headersNodes = this.node.querySelectorAll(this.config.selectors.headers);
    this.bodiesNodes = this.node.querySelectorAll(this.config.selectors.bodies);

    // Активация первой вкладки по умолчанию
    this.activateTab(this.headersNodes[0].dataset.fazeTabBody || '');
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.headersNodes.forEach((header) => {
      header.addEventListener('click', (event) => {
        event.preventDefault();

        this.activateTab(header.dataset.fazeTabBody || '');
      });
    });
  }

  /**
   * Активация таба, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param key - ключ в data атрибутах по которому ищем шапку и тело
   */
  activateTab(key: string | null): void {
    this.headersNodes.forEach((headerNode) => {
      headerNode.classList.toggle('faze-active', headerNode.dataset.fazeTabBody === key);
    });

    this.bodiesNodes.forEach((bodyNode) => {
      bodyNode.style.display = bodyNode.dataset.fazeTabBody === key ? 'block' : 'none';
      bodyNode.classList.toggle('faze-active', bodyNode.dataset.fazeTabBody === key);
    });
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
