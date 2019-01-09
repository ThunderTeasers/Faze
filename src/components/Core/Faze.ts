/**
 * Ядро фреймворка Plarson
 *
 * Работа с фреймворком представляет собой создание так называемых плагинов(модулей) для модульного представления кодовой базы сайта.
 * Плагины могут исполнятся мгновенно после создания, если выполняется условие, например страница содержит нужный DOM элемент,
 * либо содержать класс котороый инициализируется при вызове плагина из другого, посредством "plugins: [...]" и будет доступен через
 * интерфейс plugins.ИМЯ_ПЛАГИНА.МЕТОД_ПЛАГИНА
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 23.09.2018
 */

import './Faze.scss';

/**
 * Импорты всех плагинов
 */
import Modal from '../Modal/Modal';
import Helpers from '../Helpers/Helpers';
import Tooltip from '../Tooltip/Tooltip';
import Tab from '../Tab/Tab';
import Dropdown from '../Dropdown/Dropdown';
import Select from '../Select/Select';
import Carousel from '../Carousel/Carousel';
import Zoom from '../Zoom/Zoom';
import Scroll from '../Scroll/Scroll';
import Form from '../Form/Form';
import Page from '../Page/Page';
import Filter from '../Filter/Filter';
import Spoiler from '../Spoiler/Spoiler';
import Gallery from '../Gallery/Gallery';
import REST from '../REST/REST';
import Observer from './Observer';

/**
 * Структура конфигурации плагина при его инициализации
 *
 * Содержит:
 *   pluginName - имя плагина
 *   plugins    - список подключаемых плагинов
 *   condition  - условие, при котором плагин будет исполняться, если условия нет, плагин считается "закрытым", то есть выполнится только
 *                при вызове его в другом плагине через plugins
 *   callback   - метод исполняющийся при инициализации(или вызове, см. condition) плагина
 */
interface PluginConfig {
  pluginName: string;
  plugins: string[];
  condition: boolean;
  callback: (modules?: InnerPluginsData) => void;
}

/**
 * Структура данных плагина, в таком формате все плагины хранятся в памяти
 *
 * Содержит:
 *   config - Корфигурацию, которая была передана при создании плагина, описана в PluginConfig
 *   body   - Тело плагина, содержащее код который необходимо исполнить при вызове плагина
 */
interface PluginData {
  config: Partial<PluginConfig>;
  body?: any;
}

/**
 * Структура хранения данных всех плагинов
 */
interface PluginsData {
  [name: string]: PluginData;
}

/**
 * Структура списка плагинов для передачи её в метод, при вызове плагина с plugins[...]
 */
interface InnerPluginsData {
  [name: string]: any;
}

/**
 * Класс для управления модулями, а именно содержит хэш таблицу всех загруженных ранее модулей,
 * для их удобного подключения в другие модули без повторной загрузки
 */
class Faze {
  // Переменная, содержащая в себе всю информацию о плагинах, а так же их тела для дальнейшего исполнения
  static plugins: PluginsData = {};

  // Резервирование статических переменных под заводские плагины
  static Tooltip: any = Tooltip;
  static Modal: any = Modal;
  static Tab: any = Tab;
  static Carousel: any = Carousel;
  static Zoom: any = Zoom;
  static Gallery: any = Gallery;
  static Helpers: any = Helpers;
  static Scroll: any = Scroll;
  static Spoiler: any = Spoiler;
  static Page: any = Page;
  static Form: any = Form;
  static Filter: any = Filter;
  static Dropdown: any = Dropdown;
  static Select: any = Select;
  static Observer: any = new Observer();
  static REST: any = REST;

  /**
   * Метод добавления нового плагина по предоставленному конфигу.
   * Метод 'callback' будет выполняться только если указанный селектор присутствует на странице,
   * то есть если 'document.querySelectorAll(selector).length > 0'.
   *
   * Пример создания плагина:
   *   Faze.add({
   *     pluginName: 'foo',
   *     plugins: ['Page', 'Carousel'],
   *     selector: '.some-class',
   *     callback: () => {
   *       console.log('Этот код выполнится только если на странице есть .some-class');
   *     },
   *   });
   *
   * Конфиг включает в себя:
   *   pluginName  - имя модуля
   *   plugins      - модули которые надо загрузить для его работы
   *   condition    - условие, если оно true, модуль выполняется
   *   callback     - метод который исполнится при инициализации модуля
   *
   * @param config - конфиг нового модуля
   */
  static add(config: Partial<PluginConfig>): void {
    const currentPlugins: InnerPluginsData = {};

    // Зарезервированные имена
    const predefinedNames = [
      'Zoom',
      'Tooltip',
      'Carousel',
      'Page',
      'Gallery',
      'Form',
      'Spoiler',
      'Select',
      'Scroll',
      'Tab',
      'Dropdown',
      'Helpers',
      'Modal',
      'Filter',
      'REST',
    ];

    // Проверка на ошибки
    if (!config) {
      throw new Error('Не задана конфигурация плагина!');
    }

    if (!('pluginName' in config) || config.pluginName === undefined) {
      throw new Error('Не задано имя плагина!');
    }

    // Сначала просто записываем модуль в таблицу, если его еще нет в хэше, но не загружаем его
    if (!(config.pluginName in Faze.plugins)) {
      Faze.plugins[config.pluginName] = {
        config,
        body: undefined,
      };
    }

    // Если есть подключаемые модули
    if (config.plugins && config.plugins.length > 0) {
      for (const pluginName of config.plugins) {
        if (predefinedNames.includes(pluginName)) {
          continue;
        }

        // Проверка на существование такого модуля, если его не существует, загружаем следующий
        if (!Faze.plugins[pluginName]) {
          console.error(`Плагин: '${pluginName}' не найден, его конфиг:`, config);
          continue;
        }

        // Загружаем нужный модуль, если он еще не был загружен
        if (Faze.plugins[pluginName].body === undefined) {
          try {
            Faze.plugins[pluginName].body = Faze.plugins[pluginName].config.callback;
            Faze.plugins[pluginName].body = Faze.plugins[pluginName].body();
          } catch (e) {
            console.error(`Ошибка в плагине '${pluginName}':`, e);
          }
        }

        // Добавляем нужный модуль в массив для передачи в метод
        currentPlugins[pluginName] = Faze.plugins[pluginName].body;
      }
    }

    // Если это обычный модуль(с условием на выполнение) то просто выполняем его
    if (config.condition) {
      if (typeof config.callback === 'function') {
        try {
          config.callback(currentPlugins);
        } catch (e) {
          console.error(`Error in plugin "${config.pluginName}", exception:`, e);
        }
      }
    }
  }

  /**
   * Отслеживание событий для элементов которые только могут появиться в DOM дереве, аналог jQuery.on(...)
   *
   * @param eventName     - имя события
   * @param childSelector - CSS селектор элемента на который вешаем событие
   * @param callback      - пользовательская функция которая будет исполнена после срабатывания события
   */
  static on(eventName: string, childSelector: string, callback: (event: Event, child: HTMLElement) => void) {
    window.addEventListener(eventName, (event) => {
      const clickedElement = <any>event.target;
      if (clickedElement) {
        const matchingChild = clickedElement.closest(childSelector);

        if (matchingChild) {
          callback(event, matchingChild);
        }
      }
    });
  }

  /**
   * Удаление плагина
   *
   * @param name - ключ по которому удаляем
   */
  static remove(name: string) {
    delete Faze.plugins[name];
  }

  /**
   * Инициализация плагинов по data атрибутам
   */
  static hotInitialize() {
    Faze.Modal.hotInitialize();
    Faze.Gallery.hotInitialize();
    Faze.Page.hotInitialize();
    Faze.Tab.hotInitialize();
    Faze.Spoiler.hotInitialize();
    Faze.Carousel.hotInitialize();
    Faze.Tooltip.hotInitialize();
  }
}

export default Faze;
