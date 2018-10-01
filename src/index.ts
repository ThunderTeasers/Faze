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
  pluginName: 'Page',
  callback: () => {
    PlarsonJS.Filter = Filter;
  },
});

// Тесты
PlarsonJS.add({
  pluginName: 'TooltipTest',
  plugins: ['Page', 'Form', 'Scroll', 'Zoom', 'Carousel', 'Select', 'Dropdown', 'Tab', 'Modal', 'Tooltip'],
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

    new PlarsonJS.Carousel(document.querySelector('.carousel-test'), {
      autoplay: false,
      pages: true,
      arrows: true,
      counter: true,
      animation: {
        type: 'fade',
        time: 1000,
        direction: 'horizontal',
      },
    });

    new PlarsonJS.Zoom(document.querySelector('.image'), {
      side: 'bottom',
    });

    new PlarsonJS.Scroll(document.querySelector('.for-scroll'), {
      height: 100,
    });

    new PlarsonJS.Form(document.querySelector('.form-order'), {
      callbacks: {
        error: (data: any) => {
          console.log(data);
        },
      },
    });

    new PlarsonJS.Page(document.querySelector('.news .items'), {
      offset: 10,
      quantity: 10,
      tableName: 'list',
      modules: {
        get: 111222,
      },
    });
  },
});
