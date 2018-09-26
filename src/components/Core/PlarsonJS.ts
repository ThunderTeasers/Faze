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
class PlarsonJS {
  // Переменная, содержащая в себе всю информацию о плагинах, а так же их тела для дальнейшего исполнения
  static plugins: PluginsData = {};

  // Резервирование статических переменных под заводские плагины
  static Tooltip: any;
  static Modal: any;
  static Tab: any;
  static Carousel: any;
  static Zoom: any;
  static Gallery: any;
  static Scroll: any;
  static Page: any;
  static Filter: any;
  static Dropdown: any;

  /**
   * Метод добавления нового плагина по предоставленному конфигу.
   * Метод 'callback' будет выполняться только если указанный селектор присутствует на странице,
   * то есть если 'document.querySelectorAll(selector).length > 0'.
   *
   * Пример создания плагина:
   *   PlarsonJS.add({
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

    // Проверка на ошибки
    if (!config) {
      throw new Error('Config does not set');
    }

    if (!('pluginName' in config) || config.pluginName === undefined) {
      throw new Error('Plugin name does not set');
    }

    // Сначала просто записываем модуль в таблицу, если его еще нет в хэше, но не загружаем его
    if (!(config.pluginName in PlarsonJS.plugins)) {
      PlarsonJS.plugins[config.pluginName] = {
        config,
        body: undefined,
      };
    }

    // Если есть подключаемые модули
    if (config.plugins && config.plugins.length > 0) {
      for (const pluginName of config.plugins) {
        // Проверка на существование такого модуля, если его не существует, загружаем следующий
        if (!PlarsonJS.plugins[pluginName]) {
          console.error(`Plugin with name: '${pluginName}' does not found, config:`, config);
          continue;
        }

        // Загружаем нужный модуль, если он еще не был загружен
        if (PlarsonJS.plugins[pluginName].body === undefined) {
          try {
            PlarsonJS.plugins[pluginName].body = PlarsonJS.plugins[pluginName].config.callback;
            PlarsonJS.plugins[pluginName].body = PlarsonJS.plugins[pluginName].body();
          } catch (e) {
            console.error(`Plugin ${pluginName} has an error in their callback function:`, e);
          }
        }

        // Добавляем нужный модуль в массив для передачи в метод
        currentPlugins[pluginName] = PlarsonJS.plugins[pluginName].body;
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
   * Удаление плагина
   *
   * @param name - ключ по которому удаляем
   */
  static remove(name: string) {
    delete PlarsonJS.plugins[name];
  }
}

export default PlarsonJS;
