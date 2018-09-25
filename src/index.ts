import PlarsonJS from './components/Core/PlarsonJS';
import Tooltip from './components/Tooltip/Tooltip';
import Modal from './components/Modal/Modal';

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

PlarsonJS.add({
  pluginName: 'Modal',
  callback: () => {
    PlarsonJS.Modal = Modal;
  },
});
