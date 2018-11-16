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
import Spoiler from './components/Spoiler/Spoiler';
import Gallery from './components/Gallery/Gallery';

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
  pluginName: 'Spoiler',
  callback: () => {
    Faze.Spoiler = Spoiler;
  },
});

Faze.add({
  pluginName: 'Filter',
  callback: () => {
    Faze.Filter = Filter;
  },
});

Faze.add({
  pluginName: 'Gallery',
  callback: () => {
    Faze.Gallery = Gallery;
  },
});

// Тесты
Faze.add({
  pluginName: 'TooltipTest',
  plugins: ['Page', 'Gallery', 'Form', 'Spoiler', 'Scroll', 'Zoom', 'Carousel', 'Select', 'Dropdown', 'Tab', 'Modal', 'Tooltip'],
  condition: document.querySelectorAll('#button').length > 0,
  callback: () => {
    new Faze.Tooltip(document.querySelector('#button'), {
      text: '123',
      side: 'right',
    });

    new Faze.Modal(document.querySelector('#button'), {
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

    new Faze.Tab(document.querySelector('.faze-tabs'));

    new Faze.Dropdown(document.querySelector('.faze-dropdown'), {
      strictPosition: true,
    });

    new Faze.Select(document.querySelector('.faze-select'), {
      default: false,
      callbacks: {
        created: (data: any) => {
          console.log(data);
        },
        opened: (data: any) => {
          console.log('opened', data);
        },
      },
    });

    new Faze.Carousel(document.querySelector('.carousel-test'), {
      autoplay: false,
      pages: true,
      arrows: true,
      counter: false,
      animation: {
        type: 'slide',
        time: 1000,
        direction: 'vertical',
      },
      callbacks: {
        created: (data: any) => {
          console.log(data);
        },
      },
    });

    new Faze.Zoom(document.querySelector('.image'), {
      side: 'right',
    });

    new Faze.Spoiler(document.querySelector('.spoiler-test'));

    new Faze.Scroll(document.querySelector('.for-scroll'), {
      height: 100,
    });

    new Faze.Form(document.querySelector('.form-order'), {
      callbacks: {
        error: (data: any) => {
          console.log(data);
        },
      },
    });

    new Faze.Page(document.querySelector('.news .items'), {
      offset: 10,
      quantity: 10,
      tableName: 'list',
      modules: {
        get: 111222,
      },
    });

    new Faze.Gallery(document.querySelectorAll('.image-product'), {

    });

    Faze.on('click', '.test-on', () => {
      console.log(1);
    });
  },
});
