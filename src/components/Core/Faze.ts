/**
 * Ядро фреймворка Faze
 *
 * Работа с фреймворком представляет собой создание так называемых плагинов(модулей) для модульного представления кодовой базы сайта.
 *
 * Плагины могут исполнятся мгновенно после создания, если выполняется условие, например страница содержит нужный DOM элемент,
 * либо содержать класс котороый инициализируется при вызове плагина из другого, посредством "plugins: [...]" и будет доступен через
 * интерфейс plugins.ИМЯ_ПЛАГИНА.МЕТОД_ПЛАГИНА
 *
 * Автор: Ерохин Максим
 * Дата: 23.09.2018
 */

import './Faze.scss';
import Logger from './Logger';

/**
 * Импорты всех плагинов
 */
import Modal from '../Modules/Modal/Modal';
import Helpers from '../Helpers/Helpers';
import Globals from '../Core/Globals';
import Events from './Events';
import Constants from '../Core/Constants';
import URL from '../Helpers/URL';
import DOM from '../Helpers/DOM';
import Date from './Date';
import Animations from '../Animations/Animations';
import Placeholder from '../Modules/Placeholder/Placeholder';
import Tooltip from '../Modules/Tooltip/Tooltip';
import Tour from '../Modules/Tour/Tour';
import Tab from '../Modules/Tab/Tab';
import Drag from '../Modules/Drag/Drag';
import Dropdown from '../Modules/Dropdown/Dropdown';
import Select from '../Modules/Select/Select';
import SmartSelect from '../Modules/SmartSelect/SmartSelect';
import Carousel from '../Modules/Carousel/Carousel';
import Carousel2 from '../Modules/Carousel2/Carousel2';
import ThumbGallery from '../Modules/ThumbGallery/ThumbGallery';
import Finder from '../Modules/Finder/Finder';
import TableSorter from '../Modules/TableSorter/TableSorter';
import Sorter from '../Modules/Sorter/Sorter';
import Scroller from '../Modules/Scroller/Scroller';
import Zoom from '../Modules/Zoom/Zoom';
import ZoomBox from '../Modules/ZoomBox/ZoomBox';
import Look from '../Modules/Look/Look';
import Scroll from '../Modules/Scroll/Scroll';
import Form from '../Helpers/Form';
import ColorChanger from '../Modules/ColorChanger/ColorChanger';
import Page from '../Modules/Page/Page';
import Filter from '../Modules/Filter/Filter';
import Spoiler from '../Modules/Spoiler/Spoiler';
import Gallery from '../Modules/Gallery/Gallery';
import Slider from '../Modules/Slider/Slider';
import Steps from '../Modules/Steps/Steps';
import LazyLoad from '../Modules/LazyLoad/LazyLoad';
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

  // Версия
  static VERSION: number;

  // Переменная, содержащая в себе всю информацию о плагинах, а так же их тела для дальнейшего исполнения
  static plugins: PluginsData = {};

  // Резервирование статических переменных под заводские плагины
  static Globals: any = Globals;

  static Carousel: any = Carousel;

  static Carousel2: any = Carousel2;

  static Tooltip: any = Tooltip;

  static Tour: any = Tour;

  static Modal: any = Modal;

  static Tab: any = Tab;

  static Zoom: any = Zoom;

  static ZoomBox: any = ZoomBox;

  static Gallery: any = Gallery;

  static Helpers: any = Helpers;

  static Events: any = Events;

  static Constants: any = Constants;

  static TableSorter: any = TableSorter;

  static Finder: any = Finder;

  static Sorter: any = Sorter;

  static URL: any = URL;

  static DOM: any = DOM;

  static Date: any = Date;

  static ThumbGallery: any = ThumbGallery;

  static Animations: any = Animations;

  static Placeholder: any = Placeholder;

  static Scroller: any = Scroller;

  static Scroll: any = Scroll;

  static Spoiler: any = Spoiler;

  static Page: any = Page;

  static Form: any = Form;

  static Filter: any = Filter;

  static Drag: any = Drag;

  static Dropdown: any = Dropdown;

  static ColorChanger: any = ColorChanger;

  static Select: any = Select;

  static Look: any = Look;

  static SmartSelect: any = SmartSelect;

  static Slider: any = Slider;

  static Steps: any = Steps;

  static LazyLoad: any = LazyLoad;

  static LazyImage: any = LazyImage;

  static LazyImageController: any = new LazyImageController();

  static Observer: Observer = new Observer();

  static REST: any = REST;

  static FAZE_RESOLUTION_MOBILE: number = 768;

  constructor() {
    // Инициализация логгера
    Faze.logger = new Logger();
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
      'Look',
      'ZoomBox',
      'TableSorter',
      'Tooltip',
      'Tour',
      'Carousel',
      'Page',
      'Gallery',
      'SmartSelect',
      'Form',
      'Spoiler',
      'Select',
      'Scroll',
      'Tab',
      'Dropdown',
      'Slider',
      'Steps',
      'Events',
      'Helpers',
      'Constants',
      'URL',
      'Observer',
      'Modal',
      'Filter',
      'REST',
      'Logger',
      'ColorChanger',
      'Finder',
      'Scroller',
    ];

    // Проверка на ошибки
    if (!config) {
      throw new Error('Не задана конфигурация плагина!');
    }

    if (!('pluginName' in config) || config.pluginName === undefined) {
      throw new Error('Не задано имя плагина!');
    }

    // Если у плагина стоит имя "Global", то кладём всё что он возвращяет в глобальную область видимости
    if (config.pluginName.toLowerCase() === 'global') {
      if (typeof config.callback === 'function') {
        Object.assign(window, config.callback());
      }
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
          console.error(
            `Плагин: '${pluginName}' не найден, его конфиг:`,
            config
          );
          continue;
        }

        // Загружаем нужный модуль, если он еще не был загружен
        if (Faze.plugins[pluginName].body === undefined) {
          try {
            Faze.plugins[pluginName].body =
              Faze.plugins[pluginName].config.callback;
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
          console.error(
            `Error in plugin "${config.pluginName}", exception:`,
            error
          );
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
  static on(
    eventName: string,
    childSelector: string,
    callback: (event: Event, child: HTMLElement) => void
  ): void {
    eventName
      .split(',')
      .map((tmpEventName) => tmpEventName.trim())
      .forEach((tmpEventName: string) => {
        window.addEventListener(tmpEventName, (event: Event) => {
          const clickedElement: HTMLElement | null =
            event.target as HTMLElement;
          if (clickedElement) {
            const matchingChild: HTMLElement | null =
              clickedElement.closest(childSelector);
            if (matchingChild) {
              callback(event, matchingChild);
            }
          }
        });
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
        this.logger.error(
          `Модуль Faze.${moduleName}: Ошибка исполнения пользовательского метода "${callback.name}": ${error}`
        );
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
   * Инициализация плагинов по data атрибутам
   */
  static hotInitialize(): void {
    Faze.Modal.hotInitialize();
    Faze.Gallery.hotInitialize();
    Faze.Page.hotInitialize();
    Faze.Tab.hotInitialize('tab');
    Faze.ColorChanger.hotInitialize('colorchanger');
    Faze.ThumbGallery.hotInitialize('thumbgallery');
    Faze.SmartSelect.hotInitialize('smartselect');
    Faze.TableSorter.hotInitialize('tablesorter');
    Faze.Sorter.hotInitialize('sorter');
    Faze.Slider.hotInitialize('slider');
    Faze.Placeholder.hotInitialize('placeholder');
    Faze.Spoiler.hotInitialize();
    Faze.Carousel2.hotInitialize('carousel2');
    Faze.Carousel.hotInitialize();
    Faze.Tooltip.hotInitialize();
    Faze.Tour.hotInitialize('tour');
    Faze.Finder.hotInitialize('finder');
    Faze.Scroller.hotInitialize('scroller');
    Faze.Zoom.hotInitialize();
    Faze.ZoomBox.hotInitialize();
    Faze.Select.hotInitialize();
    Faze.Filter.hotInitialize();
    Faze.Look.hotInitialize('look');
    Faze.Steps.hotInitialize();
    Faze.Drag.hotInitialize();
    Faze.Dropdown.hotInitialize();
    Faze.LazyLoad.hotInitialize();
    Faze.LazyImage.hotInitialize();
  }
}

export default Faze;
