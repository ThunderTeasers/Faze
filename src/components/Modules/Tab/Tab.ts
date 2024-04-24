/**
 * Плагин табов
 *
 * Модуль табов представляет собой набор "заголовков" связанных с набором "тел" через data атрибут. Одновременно может отображаться
 * только одно "тело", какое именно отображается, зависит от того, на какой "заголовок" нажали. По умолчанию отображается первый.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 * Документация: https://github.com/ThunderTeasers/Faze/wiki/Модуль-Tab
 */

import './Tab.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   head - DOM элемент выбранной шапки
 *   body - DOM Элемент выбранного тела
 */
interface CallbackData {
  headNode: HTMLElement | undefined;
  bodyNode: HTMLElement | undefined;
}

/**
 * Структура конфига табов
 *
 * Содержит:
 *   headerActiveClass - CSS класс активного таба
 *   useHash - использовать ли window.location.hash при переключении и инициализации
 *   removeEmpty - удалять ли пустые табы с их шапками
 *   maxBodies - максимальное количество тел которые нужно показывать
 *   callbacks
 *     changed - пользовательская функция, исполняющаяся после изменения таба
 */
interface Config {
  headerActiveClass?: string;
  bodyActiveType: string;
  useHash: boolean;
  removeEmpty: boolean;
  maxBodies: number;
  callbacks: {
    changed?: (activeTabData: CallbackData) => void;
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

  // Содержат ли заголовки табов текущий хэш на странице
  containsHash: boolean;

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент на который навешивается модуль
   * @param config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      headerActiveClass: undefined,
      bodyActiveType: 'block',
      useHash: false,
      removeEmpty: false,
      maxBodies: 1,
      callbacks: {
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'Tab',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    super.initialize();

    // Инициализация шапок и тел табов
    this.initializeTabs();

    // Проверяем содержат ли заголовки табов текущий хэш
    this.containsHash = this.headersNodes.some((headerNode) => headerNode.dataset.fazeTabBody === window.location.hash.substring(1) || headerNode.dataset.fazeTabHead === window.location.hash.substring(1));

    // Текущий ключ
    let key: string;

    // Открытие тел табов если у шапки задан класс "faze-active"
    const alreadyActiveTabNode: HTMLElement | undefined = Array.from(this.headersNodes).find((headerNode) => headerNode.classList.contains('faze-active'));
    if (alreadyActiveTabNode) {
      key = alreadyActiveTabNode.dataset.fazeTabHead || alreadyActiveTabNode.dataset.fazeTabBody || '';
    } else {
      key = this.headersNodes[0].dataset.fazeTabHead || this.headersNodes[0].dataset.fazeTabBody || '';
    }

    // Открытие таба если есть hash и его разрешено использовать
    if (this.config.useHash && window.location.hash && this.containsHash) {
      key = window.location.hash.substring(1);
    }

    // Активация первой вкладки по умолчанию
    this.activateTab(key, true);
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    super.bind();

    this.headersNodes.forEach((header: HTMLElement) => {
      header.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        this.activateTab(header.dataset.fazeTabHead || header.dataset.fazeTabBody || '');
      });
    });

    this.bindHashChange();
  }

  /**
   * Навешивание событий на изменение хэша
   *
   * @private
   */
  private bindHashChange() {
    window.addEventListener('hashchange', () => {
      this.activateTab(window.location.hash.substring(1));
    });
  }

  /**
   * Инициализация шапок и тел табов
   */
  private initializeTabs(): void {
    const className = this.className ? `, ${this.className}` : '';

    // Получаем шапки
    this.headersNodes = Array.from(this.node.querySelectorAll<HTMLElement>('.faze-tab-header, [data-faze-tab="header"], [data-faze-tab-head]')).filter((headerNode: HTMLElement) => headerNode.closest(`.faze-tabs, [data-faze~="tab"] ${className}`) === this.node);

    // Получаем тела
    this.bodiesNodes = Array.from(this.node.querySelectorAll<HTMLElement>('.faze-tab-body, [data-faze-tab="body"], [data-faze-tab-body]:not([data-faze-tab="header"]):not(.faze-tab-header)')).filter(
      (bodyNode: HTMLElement) => bodyNode.closest(`.faze-tabs, [data-faze~="tab"] ${className}`) === this.node
    );

    // Удаляем пустые табы
    if (this.config.removeEmpty) {
      this.checkAndRemoveEmptyTabs();
    }
  }

  /**
   * Активация таба, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param key{string} - ключ в data атрибутах по которому ищем шапку и тело
   * @param isFirstTime{boolean} - первый ли раз запускаем данную функцию
   */
  activateTab(key: string, isFirstTime: boolean = false): void {
    if (!this.headersNodes.some((headerNode) => key === headerNode.dataset.fazeTabBody || key === headerNode.dataset.fazeTabHead)) {
      return;
    }

    // Активные DOM Элементы таба
    let activeHeadNode: HTMLElement | undefined;
    let activeBodyNode: HTMLElement | undefined;

    // Активируем шапку
    this.headersNodes.forEach((headerNode: HTMLElement) => {
      // Является ли заголовок активным
      const isActive = key === headerNode.dataset.fazeTabBody || key === headerNode.dataset.fazeTabHead;

      // Проставляем стандартный класс активности
      headerNode.classList.toggle('faze-active', isActive);

      // Проставляем пользовательский класс
      if (this.config.headerActiveClass) {
        headerNode.classList.toggle(this.config.headerActiveClass, isActive);
      }

      // Берём активную шапку
      if (isActive) {
        activeHeadNode = headerNode;
      }
    });

    // Получаем все ключи для выбора нужных тел, т.к. их может быть несколько через пробел
    const keys = key.split(' ');

    // Количество уже показанных тел
    let shownBodies = 0;

    // Активируем тела
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      const isActive = keys.includes(bodyNode.dataset.fazeTabBody || '');

      bodyNode.style.display = isActive && shownBodies < this.config.maxBodies ? this.config.bodyActiveType : 'none';
      bodyNode.classList.toggle('faze-active', isActive);

      // Берём активное тело
      if (isActive) {
        activeBodyNode = bodyNode;

        shownBodies++;
      }
    });

    // Прописываем hash если необходимо
    if (this.config.useHash && !isFirstTime) {
      window.location.hash = key;
    }

    // Вызываем пользовательский метод
    if (typeof this.config.callbacks.changed === 'function') {
      try {
        this.config.callbacks.changed({
          headNode: activeHeadNode,
          bodyNode: activeBodyNode,
        });
      } catch (error) {
        console.error(`Ошибка исполнения пользовательского метода "opened": ${error}`);
      }
    }
  }

  /**
   * Проверяем и удаляем пустые табы
   *
   * @private
   */
  private checkAndRemoveEmptyTabs() {
    // Проверяем, есть ли тела у шапок в принцип и, если нет, то удаляем шапку
    this.headersNodes.forEach((headerNode) => {
      const body = this.bodiesNodes.find((bodyNode) => bodyNode.dataset.fazeTabBody === headerNode.dataset.fazeTabBody || bodyNode.dataset.fazeTabBody === headerNode.dataset.fazeTabHead);
      if (!body) {
        headerNode.remove();
      }
    });

    // Проверяем пустые ли тела у шапок
    this.bodiesNodes.forEach((bodyNode: HTMLElement) => {
      // Проверяем, если тело таба пустое
      if (bodyNode.textContent?.trim() === '') {
        // То скрываем и шапку и само тело
        const headerNode: HTMLElement | undefined = this.headersNodes.find((tmpHeaderNode: HTMLElement) => tmpHeaderNode.dataset.fazeTabBody === bodyNode.dataset.fazeTabBody || tmpHeaderNode.dataset.fazeTabHead === bodyNode.dataset.fazeTabBody);
        if (headerNode) {
          headerNode.remove();
        }

        bodyNode.remove();
      }
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Tab(node, {
      headerActiveClass: node.dataset.fazeTabHeaderActiveClass,
      bodyActiveType: node.dataset.fazeTabBodyActiveType || 'block',
      useHash: (node.dataset.fazeTabUseHash || 'false') === 'true',
      removeEmpty: (node.dataset.fazeTabRemoveEmpty || 'false') === 'true',
      maxBodies: parseInt(node.dataset.fazeTabMaxBodies || '1', 10),
    });
  }
}

export default Tab;
