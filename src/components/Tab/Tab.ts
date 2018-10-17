/**
 * Плагин табов
 *
 * Модуль табов представляет из себя набор "заголовков" связанных с набором "тел" через data атрибут. Одновременно может отображаться
 * только одно "тело", какое именно отображается, зависит от того, на какой "заголовок" нажали. По умолчанию отображается первый.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 26.09.2018
 *
 *
 * Пример использования
 * В JS:
 *   Faze.add({
 *     pluginName: 'ProductsTabs',
 *     plugins: ['Tab'],
 *     condition: document.querySelectorAll('.faze-tabs').length,
 *     callback: () => {
 *       new Faze.Tab(document.querySelector('.faze-tabs'));
 *     }
 *   });
 *
 * В HTML:
 *   <div class="faze-tabs">
 *     <div class="faze-tabs-headers">
 *       <div class="faze-tab-header" data-faze-tab-body="1">Таб 1</div>
 *       <div class="faze-tab-header" data-faze-tab-body="2">Таб 2</div>
 *     </div>
 *     <div class="faze-tabs-bodies">
 *       <div class="faze-tab-body" data-faze-tab-body="1">Тело 1</div>
 *       <div class="faze-tab-body" data-faze-tab-body="2">Тело 2</div>
 *     </div>
 *   </div>
 */

import './Tab.scss';

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

  // Заголовки табов
  headers: NodeListOf<HTMLElement>;

  // Тела табов
  bodies: NodeListOf<HTMLElement>;

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

    this.config = Object.assign(defaultConfig, config);
    this.node = node;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.headers = this.node.querySelectorAll(this.config.selectors.headers);
    this.bodies = this.node.querySelectorAll(this.config.selectors.bodies);

    // Активация первой вкладки по умолчанию
    this.activateTab(this.headers[0].getAttribute('data-faze-tab-body'));
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.headers.forEach((header) => {
      header.addEventListener('click', (event) => {
        event.preventDefault();

        this.activateTab(header.getAttribute('data-faze-tab-body'));
      });
    });
  }

  /**
   * Активация таба, посредством проставления активному телу и шапке класс 'active' и убирая его у всех остальных
   *
   * @param key - ключ в data атрибутах по которому ищем шапку и тело
   */
  activateTab(key: string | null): void {
    this.headers.forEach((head) => {
      if (head.getAttribute('data-faze-tab-body') === key) {
        head.classList.add('faze-active');
      } else {
        head.classList.remove('faze-active');
      }
    });

    this.bodies.forEach((body) => {
      if (body.getAttribute('data-faze-tab-body') === key) {
        body.style.display = 'block';
      } else {
        body.style.display = 'none';
      }
    });
  }
}

export default Tab;
