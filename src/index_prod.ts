import Faze from './components/Core/Faze';
import Helpers from './components/Helpers/Helpers';
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
window.Faze = Faze;

/**
 * Регистрация заводских плагинов
 */
Faze.add({
  pluginName: 'Helpers',
  callback: () => {
    Faze.Helpers = Helpers;
  },
});

Faze.add({
  pluginName: 'Tooltip',
  callback: () => {
    Faze.Tooltip = Tooltip;
  },
});

Faze.add({
  pluginName: 'Modal',
  callback: () => {
    Faze.Modal = Modal;
  },
});

Faze.add({
  pluginName: 'Tab',
  callback: () => {
    Faze.Tab = Tab;
  },
});

Faze.add({
  pluginName: 'Dropdown',
  callback: () => {
    Faze.Dropdown = Dropdown;
  },
});

Faze.add({
  pluginName: 'Select',
  callback: () => {
    Faze.Select = Select;
  },
});

Faze.add({
  pluginName: 'Carousel',
  callback: () => {
    Faze.Carousel = Carousel;
  },
});

Faze.add({
  pluginName: 'Zoom',
  callback: () => {
    Faze.Zoom = Zoom;
  },
});

Faze.add({
  pluginName: 'Scroll',
  callback: () => {
    Faze.Scroll = Scroll;
  },
});

Faze.add({
  pluginName: 'Form',
  callback: () => {
    Faze.Form = Form;
  },
});

Faze.add({
  pluginName: 'Page',
  callback: () => {
    Faze.Page = Page;
  },
});

Faze.add({
  pluginName: 'Filter',
  callback: () => {
    Faze.Filter = Filter;
  },
});
