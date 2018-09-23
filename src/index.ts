import PlarsonJS from './components/Core/PlarsonJS';
import Tooltip from './components/Tooltip/Tooltip';

// @ts-ignore
window.PlarsonJS = PlarsonJS;

/**
 * Инициализация заводских плагинов
 */
PlarsonJS.add({
  pluginName: 'Tooltip',
  callback: () => {
    PlarsonJS.Tooltip = Tooltip;
  },
});
