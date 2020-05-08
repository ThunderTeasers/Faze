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
import Faze from '../../Core/Faze';

/**
 * Структура конфига табов
 *
 * Содержит:
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  callbacks: {
    changed?: () => void;
  };
}

/**
 * Класс табов
 */
class Tab extends Module {
  // DOM элементы заголовков табов
  headersNodes: HTMLElement[];

  // DOM элементы тел табов
  bodiesNodes: HTMLElement[];

  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
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
    const alreadyActiveTabNode: HTMLElement | undefined = Array.from(this.headersNodes).find(headerNode => headerNode.classList.contains('faze-active'));
    if (alreadyActiveTabNode) {
      key = alreadyActiveTabNode.dataset.fazeTabHead || alreadyActiveTabNode.dataset.fazeTabBody || '';
    } else {
      key = this.headersNodes[0].dataset.fazeTabHead || this.headersNodes[0].dataset.fazeTabBody || '';
    }

    // Активация первой вкладки по умолчанию
    this.activateTab(key);
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.headersNodes.forEach((header: HTMLElement) => {
      header.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        this.activateTab(header.dataset.fazeTabHead || header.dataset.fazeTabBody || '');
      });
    });
  }

  /**
   * Инициализация шапок и тел табов
   */
  private initializeTabs(): void {
    // Получаем шапки
    this.headersNodes = Array.from(this.node.querySelectorAll<HTMLElement>('.faze-tab-header, [data-faze-tab="header"], [data-faze-tab-head]'))
      .filter((headerNode: HTMLElement) => headerNode.closest('.faze-tabs, [data-faze~="tab"]') === this.node);

    // Получаем тела
    this.bodiesNodes = Array.from(this.node.querySelectorAll<HTMLElement>('.faze-tab-body, [data-faze-tab="body"], [data-faze-tab-body]:not([data-faze-tab="header"]):not(.faze-tab-header)'))
      .filter((bodyNode: HTMLElement) => bodyNode.closest('.faze-tabs, [data-faze~="tab"]') === this.node);
  }

  /**
   * Активация таба, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param key{string} - ключ в data атрибутах по которому ищем шапку и тело
   */
  activateTab(key: string): void {
    // Активируем шапку
    this.headersNodes.forEach((headerNode: HTMLElement) => {
      headerNode.classList.toggle('faze-active', key === headerNode.dataset.fazeTabBody || key === headerNode.dataset.fazeTabHead);
    });

    // Получаем все ключи для выбора нужных тел, т.к. их может быть несколько через пробел
    const keys = key.split(' ');

    // Активируем тела
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      bodyNode.style.display = keys.includes(bodyNode.dataset.fazeTabBody || '') ? 'block' : 'none';
      bodyNode.classList.toggle('faze-active', keys.includes(bodyNode.dataset.fazeTabBody || ''));
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
    new Tab(node);
  }

  /**
   * "Горячая" инициализация модуля через "observer"
   */
  static hotInitialize(): void {
    // Инициализация через "observer"
    Faze.Observer.watch('[data-faze~="tab"]', (node: HTMLElement) => {
      this.initializeByDataAttributes(node);
    });

    // Стандартная инициализация по data атрибутам
    document.querySelectorAll<HTMLElement>('[data-faze~="tab"]').forEach((node: HTMLElement) => {
      this.initializeByDataAttributes(node);
    });
  }
}

export default Tab;
