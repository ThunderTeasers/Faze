import PlarsonJS from './components/Core/PlarsonJS';
import Tooltip from './components/Tooltip/Tooltip';
import Modal from './components/Modal/Modal';
import Tab from './components/Tab/Tab';
import Dropdown from './components/Dropdown/Dropdown';
import Select from './components/Select/Select';
import Carousel from './components/Carousel/Carousel';

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

// Тесты
PlarsonJS.add({
  pluginName: 'TooltipTest',
  plugins: ['Carousel', 'Select', 'Dropdown', 'Tab', 'Modal', 'Tooltip'],
  condition: document.querySelectorAll('#button').length > 0,
  callback: () => {
    new PlarsonJS.Tooltip(document.querySelector('#button'), {
      text: '123',
      side: 'right',
    });

    new PlarsonJS.Modal(document.querySelector('#button'), {
      title: 'Тестирование модального окна',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      buttons: [
        {
          caption: 'Закрыть',
          class: 'btn btn-close',
          callback: (parts: any) => {
            parts.closeButton.click();
          },
        },
      ],
    });

    new PlarsonJS.Tab(document.querySelector('.tabs'));

    new PlarsonJS.Dropdown(document.querySelector('.dropdown'));

    new PlarsonJS.Select(document.querySelector('.select'));

    new PlarsonJS.Carousel(document.querySelector('.carousel-test'));
  },
});
