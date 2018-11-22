import Faze from './components/Core/Faze';

// Инициализация плагинов по data атрибутам
Faze.hotInitialize();

// @ts-ignore
window.Faze = Faze;

new Faze.Modal(document.querySelector('#button'), {
  title: 'Тестирование модального окна',
  url: 'https://jsonplaceholder.typicode.com/todos/1',
  draggable: true,
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

// Тесты
Faze.add({
  pluginName: 'TooltipTest',
  plugins: ['Page', 'Gallery', 'Form', 'Spoiler', 'Scroll', 'Zoom', 'Carousel', 'Select', 'Dropdown', 'Tab', 'Tooltip'],
  condition: document.querySelectorAll('#button').length > 0,
  callback: () => {
    new Faze.Tooltip(document.querySelector('#button'), {
      text: '123',
      side: 'right',
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
        direction: 'horizontal',
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
