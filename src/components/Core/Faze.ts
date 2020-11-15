/**
 * Ядро фреймворка Faze
 *
 * Работа с фреймворком представляет собой создание так называемых плагинов(модулей) для модульного представления кодовой базы сайта.
 *
 * Плагины могут исполнятся мгновенно после создания, если выполняется условие, например страница содержит нужный DOM элемент,
 * либо содержать класс котороый инициализируется при вызове плагина из другого, посредством "plugins: [...]" и будет доступен через
 * интерфейс plugins.ИМЯ_ПЛАГИНА.МЕТОД_ПЛАГИНА
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 23.09.2018
 */

import './Faze.scss';
import Logger from './Logger';

// Версии
enum Version {
  FAZE_1,
  FAZE_2
}

/**
 * Импорты всех плагинов
 */
import Modal from '../Modules/Modal/Modal';
import Helpers from '../Helpers/Helpers';
import Animations from '../Animations/Animations';
import Tooltip from '../Modules/Tooltip/Tooltip';
import Tab from '../Modules/Tab/Tab';
import Drag from '../Modules/Drag/Drag';
import Dropdown from '../Modules/Dropdown/Dropdown';
import Select from '../Modules/Select/Select';
import Carousel from '../Modules/Carousel/Carousel';
import Carousel2 from '../Modules/Carousel2/Carousel2';
import Zoom from '../Modules/Zoom/Zoom';
import ZoomBox from '../Modules/ZoomBox/ZoomBox';
import Scroll from '../Modules/Scroll/Scroll';
import Form from '../Modules/Form/Form';
import Page from '../Modules/Page/Page';
import Filter from '../Modules/Filter/Filter';
import Spoiler from '../Modules/Spoiler/Spoiler';
import Gallery from '../Modules/Gallery/Gallery';
import Slider from '../Modules/Slider/Slider';
import Steps from '../Modules/Steps/Steps';
import LazyImage from '../Modules/LazyImage/LazyImage';
import LazyImageController from '../Modules/LazyImage/LazyImageController';
import REST from '../Modules/REST/REST';
import Observer from './Observer';

/**
 * Структура конфигурации плагина при его инициализации
 *
 * Содержит:
 *   pluginName - имя плагина
 *   plugins    - список подключаемых плагинов
 *   condition  - условие, при котором плагин будет исполняться, если условия нет, плагин считается "закрытым", то есть выполнится только
 *                при вызове его в другом плагине через plugins
 *   observableSelector - наблюдаемый CSS селектор, если указан то выполняем этот модель при появлении DOM элемента с этим селектором
 *   callback   - метод исполняющийся при инициализации(или вызове, см. condition) плагина
 */
interface PluginConfig {
  pluginName: string;
  plugins: string[];
  condition: boolean;
  observableSelector: string;
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
  // Помощник для логирования
  private static logger: Logger;

  // Версия фреймворка
  static version: Version;

  // Переменная, содержащая в себе всю информацию о плагинах, а так же их тела для дальнейшего исполнения
  static plugins: PluginsData = {};

// Резервирование статических переменных под заводские плагины
  static Carousel: any = Carousel;
  static Carousel2: any = Carousel2;
  static Tooltip: any = Tooltip;
  static Modal: any = Modal;
  static Tab: any = Tab;
  static Zoom: any = Zoom;
  static ZoomBox: any = ZoomBox;
  static Gallery: any = Gallery;
  static Helpers: any = Helpers;
  static Animations: any = Animations;
  static Scroll: any = Scroll;
  static Spoiler: any = Spoiler;
  static Page: any = Page;
  static Form: any = Form;
  static Filter: any = Filter;
  static Drag: any = Drag;
  static Dropdown: any = Dropdown;
  static Select: any = Select;
  static Slider: any = Slider;
  static Steps: any = Steps;
  static LazyImage: any = LazyImage;
  static LazyImageController: any = new LazyImageController();
  static Observer: any = new Observer();
  static REST: any = REST;

  constructor() {
    // Инициализация логгера
    Faze.logger = new Logger();

    // Версия фреймворка
    Faze.version = Faze.getVersion();

    // Определение версий модулей отностельно фреймворка
    if (Faze.version === Version.FAZE_2) {
      Faze.Carousel = Carousel2;
    } else {
      Faze.Carousel = Carousel;
    }
  }

  /**
   * Навешивание общих событий
   */
  static bind() {
    Faze.LazyImageController.bind();
  }

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
    const predefinedNames: string[] = [
      'Plugin',
      'Module',
      'Zoom',
      'ZoomBox',
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
      'Slider',
      'Steps',
      'Helpers',
      'Observer',
      'Modal',
      'Filter',
      'REST',
      'Logger',
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

          // Если присутствует селектор для отслеживания модуля, то ставим его на отслеживание
          if (config.observableSelector) {
            Faze.Observer.watch(config.observableSelector, config.callback);
          }
        } catch (error) {
          console.error(`Error in plugin "${config.pluginName}", exception:`, error);
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
  static on(eventName: string, childSelector: string, callback: (event: Event, child: HTMLElement) => void): void {
    window.addEventListener(eventName, (event: Event) => {
      const clickedElement: HTMLElement | null = event.target as HTMLElement;
      if (clickedElement) {
        const matchingChild: HTMLElement | null = clickedElement.closest(childSelector);
        if (matchingChild) {
          callback(event, matchingChild);
        }
      }
    });
  }

  /**
   * Запуск функции с проверкой на ошибки
   *
   * @param callback{() => void} Функция для исполнения
   * @param moduleName{string} Название модуля
   */
  static callFunction(callback: () => void, moduleName: string = 'Core') {
    if (typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        this.logger.error(`Модуль Faze.${moduleName}: Ошибка исполнения пользовательского метода "${callback.name}": ${error}`);
      }
    }
  }

  /**
   * Удаление плагина
   *
   * @param name - ключ по которому удаляем
   */
  static remove(name: string): void {
    delete Faze.plugins[name];
  }

  /**
   * Парсинг и получение версии фреймворка в нужном формате(enum) из строки
   *
   * @param{string | null} versionString Строка с версией
   *
   * @return{Version} Версия в формате Faze
   *
   * @private
   */
  private static parseVersion(versionString: string | null): Version {
    let version: Version;
    switch (versionString) {
      case '1':
        version = Version.FAZE_1;
        break;
      case '2':
        version = Version.FAZE_2;
        break;
      default:
        version = Version.FAZE_1;
    }

    return version;
  }

  /**
   * Получение нужной версии фреймворка
   *
   * @return{Version} Версия фреймворка
   */
  static getVersion(): Version {
    // Путь к файлу, для получения GET параметров
    const src = (<HTMLScriptElement>document.currentScript)?.src;

    // Итоговая версия
    let version: Version = Version.FAZE_1;

    // "search" строка пути к файлу
    const search = src.split('?');

    // Если есть GET параметры, то определяем версию
    if (search[1]) {
      const params = new URLSearchParams(search[1]);
      version = Faze.parseVersion(params.get('version'));
    }

    return version;
  }

  /**
   * Инициализация плагинов по data атрибутам
   */
  static hotInitialize(): void {
    Faze.Modal.hotInitialize();
    Faze.Gallery.hotInitialize();
    Faze.Page.hotInitialize();
    Faze.Tab.hotInitialize('tab');
    Faze.Spoiler.hotInitialize();

    if (Faze.getVersion() === Version.FAZE_2) {
      Faze.Carousel2.hotInitialize('carousel');
    } else {
      Faze.Carousel.hotInitialize();
    }

    Faze.Tooltip.hotInitialize();
    Faze.Zoom.hotInitialize();
    Faze.ZoomBox.hotInitialize();
    Faze.Select.hotInitialize();
    Faze.Filter.hotInitialize();
    Faze.Steps.hotInitialize();
    Faze.Drag.hotInitialize();
    Faze.Dropdown.hotInitialize();
    Faze.LazyImage.hotInitialize();
  }
}

export default Faze;
