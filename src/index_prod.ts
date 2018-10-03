import PlarsonJS from './components/Core/PlarsonJS';
import Tooltip from './components/Tooltip/Tooltip';
import Modal from './components/Modal/Modal';
import Tab from './components/Tab/Tab';
import Dropdown from './components/Dropdown/Dropdown';
import Select from './components/Select/Select';
import Carousel from './components/Carousel/Carousel';
import Zoom from './components/Zoom/Zoom';
import Scroll from './components/Scroll/Scroll';
import Form from './components/Form/Form';
import Page from './components/Page/Page';
import Filter from './components/Filter/Filter';

// @ts-ignore
window.PlarsonJS = PlarsonJS;

/**
 * Регистрация заводских плагинов
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

PlarsonJS.add({
  pluginName: 'Tab',
  callback: () => {
    PlarsonJS.Tab = Tab;
  },
});

PlarsonJS.add({
  pluginName: 'Dropdown',
  callback: () => {
    PlarsonJS.Dropdown = Dropdown;
  },
});

PlarsonJS.add({
  pluginName: 'Select',
  callback: () => {
    PlarsonJS.Select = Select;
  },
});

PlarsonJS.add({
  pluginName: 'Carousel',
  callback: () => {
    PlarsonJS.Carousel = Carousel;
  },
});

PlarsonJS.add({
  pluginName: 'Zoom',
  callback: () => {
    PlarsonJS.Zoom = Zoom;
  },
});

PlarsonJS.add({
  pluginName: 'Scroll',
  callback: () => {
    PlarsonJS.Scroll = Scroll;
  },
});

PlarsonJS.add({
  pluginName: 'Form',
  callback: () => {
    PlarsonJS.Form = Form;
  },
});

PlarsonJS.add({
  pluginName: 'Page',
  callback: () => {
    PlarsonJS.Page = Page;
  },
});

PlarsonJS.add({
  pluginName: 'Filter',
  callback: () => {
    PlarsonJS.Filter = Filter;
  },
});
