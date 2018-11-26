interface FetchOptions {
  method: string;
  body?: any;
}

class REST {
  static ajaxRequest(method: string, type: string | null, url: string, data: any, callbackSuccess: ((response: any) => void) | null) {
    let formData: FormData = new FormData();
    let dataType: string = '';
    let testedMethod: string = '';

    // Проверка method на корректность
    if (method.toLowerCase() === 'post') {
      dataType = type ? type : 'json';
      testedMethod = 'POST';
    } else {
      dataType = type ? type : 'html';
      testedMethod = 'GET';
    }

    // Параметры запроса, вынесены в отдельную переменую, чтобы иметь возможность задать "body", если это POST запрос и не делать этого
    // если GET. Т.к. при передаче даже пустоты(пустой строки, null, undefined) fetch выдает ошибку что GET запрос не может иметь body.
    const fetchOptions: FetchOptions = {
      method: testedMethod,
    };

    // Определим тип переменной и в соответствии с ней заполняем FormData
    if (data instanceof FormData) {
      formData = data;
    } else if (data instanceof HTMLFormElement) {
      formData = new FormData(data);
    } else if (data) {
      formData = new FormData();

      for (const key of Object.keys(data)) {
        formData.append(key, data[key]);
      }
    } else {
      throw new Error('Параметр "data" функции ajaxRequest не является объектом');
    }

    // Заполняем данные, если это POST запрос
    if (method.toLowerCase() === 'post') {
      fetchOptions.body = formData;
    }

    fetch(`${url}?${(new URLSearchParams(<any>formData)).toString()}`, fetchOptions)
      .then((response) => {
        let data = null;

        // В зависимости от типа запроса нужно по разному получить ответ от сервера
        try {
          data = dataType === 'json' ? response.json() : response.text();
        } catch (error) {
          console.error(error);
        }

        return data;
      })
      .then((response) => {
        if (data['response_html'] && typeof data['response_html'] === 'string') {

          // Парсинг ответа
          const responseHTML = (new DOMParser()).parseFromString(response, 'text/html');

          document.querySelectorAll(data['response_html']).forEach((el) => {
            el.innerHTML = responseHTML.querySelector(data['response_html']).innerHTML;
          });
        }

        if (data['response_text'] && typeof data['response_text'] === 'string') {
          document.querySelectorAll(data['response_text']).forEach((el) => {
            el.innerHTML = response;
          });
        }

        if (data['response_json'] && typeof data['response_json'] === 'string') {
          document.querySelectorAll(data['response_json']).forEach((el) => {
            el.innerHTML = response.message;
          });
        }

        // Выполнение пользовательской функции
        if (typeof callbackSuccess === 'function') {
          try {
            callbackSuccess(response);
          } catch (error) {
            console.error('Ошибка исполнения пользовательского метода: ', error);
          }
        }
      })
      .catch((error) => {
        console.error('Ошибка при взаимодействии с сервером: ', error);

        // Выполнение пользовательской функции
        if (typeof callbackSuccess === 'function') {
          try {
            callbackSuccess(null);
          } catch (error) {
            console.error('Ошибка исполнения пользовательского метода: ', error);
          }
        }
      });
  }

  static ajaxFormSubmit(formNode: HTMLFormElement) {
    if (!(formNode instanceof HTMLFormElement)) {
      throw new Error('Параметр метода formSubmit не является формой');
    }

    const formData: FormData = new FormData(formNode);

    if (formNode.hasAttribute('data-json-name')) {
      const jsonObject: any = {};

      for (let i = 0; i < formNode.elements.length; i += 1) {
        const element = <any>formNode.elements[i];

        if (element instanceof NodeList) {
          continue;
        }

        let value = element.value;

        if (element.getAttribute('type') === 'checkbox' && element.hasAttribute('value') && !(element.checked)) {
          value = '';
        }

        if (element.hasAttribute('data-faze-rest-json-name')) {
          const jsonName = element.getAttribute('data-faze-restapi-json-name');

          if (jsonObject[jsonName] === undefined) {
            jsonObject[jsonName] = {};
          }

          jsonObject[jsonName][element.name] = value;

          if (formData.delete) {
            formData.delete(element.name);
          }
        }
      }

      for (const jsonName of jsonObject.keys()) {
        formData.append(jsonName, JSON.stringify(jsonObject[jsonName]));
      }
    }

    // Вычисляем URL для отправки запроса
    const url = formNode.getAttribute('action') || window.location.href;

    let callbackSuccess = (response: any) => {
      if (formNode.hasAttribute('data-faze-restapi')) {
        REST.ajaxChain(formNode.getAttribute('data-faze-restapi') || null);
      }

      // Если есть контейнер <span data-notification=""></span>
      formNode.querySelectorAll('[data-faze-rest-notification]').forEach((el) => {
        if (el.getAttribute('data-faze-rest-notification') === 'response_json') {
          el.innerHTML = response.message;

          if (response.status === 'success') {
            el.classList.remove('text-error');
            el.classList.add('text-success');
          } else if (response.status === 'fail') {
            el.classList.remove('text-success');
            el.classList.add('text-error');
          }
        }
      });
    };

    // Если пользовательская функция была написана и передана в атрибут, то заменяем стандартный колбек на неё
    const callback = formNode.getAttribute('data-faze-restapi-update');
    if (callback) {
      if (typeof (window as any)[callback] === 'function') {
        callbackSuccess = (window as any)[callback];
      }
    }

    // Добавляем специальное поле для обхода защиты от спама
    formData.append('from', window.location.href);

    // Выполняем запрос на сервер
    REST.ajaxRequest('POST', null, url, formData, callbackSuccess);
  }

  static getElementValue(element: any): string {
    if (element.nodeName === 'INPUT') {
      return element.value;
    }

    if (element.hasAttribute('contenteditable')) {
      return element.innerHTML;
    }

    if (element.nodeName === 'SELECT') {
      return element.options[element.selectedIndex].value;
    }

    return '';
  }

  static ajaxDataAttr(object: any | any[]) {
    let chain: any[] = [];
    let json: any = null;
    let element: any = null;
    const timeoutID: any[] = [];

    if (object instanceof Element) {
      // Пример вызова: ajaxDataAttr( document.querySelector('[data-restapi]') );
      element = object;

      if (!element.hasAttribute('data-faze-restapi')) {
        throw new Error('Нет дата-атрибута data-faze-restapi!');
      }

      json = element.getAttribute('data-faze-restapi') || '';
    } else if (object.constructor === Array) {
      // Пример вызова: ajaxDataAttr([{ ... }]);
      chain = object;
      json = JSON.stringify(chain);
    } else {
      throw new Error('Параметр функции ajaxDataAttr не является ни HTML элементом, ни массивом!');
    }

    // Проверяем корректность JSON
    try {
      json = JSON.parse(json);
    } catch (error) {
      throw new Error(`Ошибка парсинга JSON конфига ("${json}"), дословно: ${error}`);
    }

    // Проверяем, что JSON это массив, а не объект
    if (json.constructor === Array) {
      chain = json;
    } else {
      throw new Error('JSON не является массивом!');
    }

    // Если в массиве есть элементы
    if (chain.length) {
      // Добавим значение из инпута
      let currentValue = null;
      if (element && element.name) {
        currentValue = REST.getElementValue(element);
      }

      if (chain[0]['delay']) {
        // Назначим ID если не было
        if (!element.hasAttribute('id')) {
          element.id = Math.round(new Date().getTime() + (Math.random() * 100000));
        }

        if (timeoutID[element.id]) {
          clearTimeout(timeoutID[element.id]);
        }

        timeoutID[element.id] = setTimeout(() => {
          let newValue = null;
          if (element && element.name) newValue = REST.getElementValue(element);
          if (element && element.name) chain[0][element.name] = newValue;

          REST.ajaxChain(chain);
        }, chain[0]['delay']);
      } else {
        // Запускаем цепочку AJAX запросов
        if (element && element.name) {
          chain[0][element.name] = currentValue;
        }

        REST.ajaxChain(chain);
      }
    }
  }

  /**
   * Подготавливает запрос и выполняет цепочку вложенных AJAX запросов, работает рекурсивно, пока не останется элементов в массиве запросов
   *
   * @param chainRawData - данные предыдущей итерации ajaxChain
   */
  static ajaxChain(chainRawData: any) {
    let chainData: any = null;

    // Определяем тип цепочки и парсим её в соответствии с ним
    if (chainRawData instanceof Array) {
      chainData = chainRawData;
    } else if (typeof chainData === 'string') {
      try {
        chainData = JSON.parse(chainRawData || '');
      } catch (error) {
        console.error(`Ошибка парсинга JSON в функции ajaxChain ("${chainRawData}"), текст ошибки:`, error);
      }
    } else {
      return;
    }

    // Если длина цепочки для выполнения равна нулю, то выходим из метода
    if (chainData && chainData.length === 0) {
      return;
    }

    // Берем данные первого элемента и удаляем его из массива
    const data = chainData.shift();

    // Тип ответа от сервера
    const dataType = data.type || null;

    // Если это функция, то выполняем её, иначе - это объект, разбираем его и в любом случае снова рекурсивно запускаем ajaxChain
    if (typeof data === 'function') {
      try {
        data();
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции переданной в массиве в ajaxChain, текст ошибки:', error);
      }
      REST.ajaxChain(chainData);
    } else {
      // Если в объекте присутствует поле "function", то есть имя некой функции, пытаемся найти её и выполнить
      if ('function' in data) {
        const functionName = data['function'];

        // Проверим существование функции
        if (functionName in window && typeof (window as any)[functionName] === 'function') {
          try {
            (window as any)[functionName]();
          } catch (error) {
            console.error(`Ошибка в пользовательской функции в параметре "function" с именем ${functionName}, текст ошибки:`, error);
          }
        }

        REST.ajaxChain(chainData);
      }
      // Если в объекте присутствует поле "method" значит это объект с настройками для отправки через ajaxRequest
      else if ('method' in data) {
        const method = data['method'];
        let url = window.location.pathname;

        // Разбор параметров "page" и "module" относительно присутствия которых им присваиваются соответствующие значения
        if (data['page'] && data['module']) {
          url = /^\//.test(data['page']) ? data['page'] : `/${data['page']}.txt`;
          data['show'] = data['module'];
        } else if (data['module']) {
          url = window.location.pathname;
          data['show'] = data['module'];
        } else if (data['page']) {
          url = /^\//.test(data['page']) ? data['page'] : `/${data['page']}.txt`;
        }

        // Если это POST метод
        if (method.toLocaleString() === 'post') {
          data['update'] = data['module'];
          data['from'] = window.location.href;
          data['mime'] = 'json';
        } else if (!('mime' in data)) {
          data['mime'] = 'txt';
        }

        // Удаляем данные которые не хотим передавать на сервер
        delete data['method'];
        delete data['module'];
        delete data['page'];

        // Отправляем запрос, после выполнения которого снова вызываем ajaxChain
        REST.ajaxRequest(method, dataType, url, data, (response: any) => {
          if (typeof data['callback'] === 'function') {
            try {
              data['callback'](response);
            } catch (error) {
              console.error('Ошибка исполнения пользовательской функции переданной в ajaxChain, текст ошибки:', error);
            }
          }

          REST.ajaxChain(chainData);
        });
      } else {
        throw new Error('Не указан обязательный параметр "method" или "function" в ajaxChain');
      }
    }
  }
}

export default REST;
