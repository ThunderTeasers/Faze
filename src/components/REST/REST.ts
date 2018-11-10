interface Window {
  [key: string]: any;
}

class REST {
  static request(method: string, url: string, data: any, callbackSuccess: (response: any) => void) {
    let formData: FormData = new FormData();
    let dataType: string = '';
    let testedMethod: string = '';

    // Определим тип переменной
    if (data instanceof FormData) {
      formData = data;
    } else if (data instanceof HTMLFormElement) {
      formData = new FormData(data);
    } else if (data instanceof Object) {
      formData = new FormData();

      for (const key of data.keys()) {
        formData.append(key, data[key]);
      }
    } else {
      throw new Error('Параметр "data" функции ajaxRequest не является объектом');
    }

    // Проверка method на корректность
    if (method.toLowerCase() === 'post') {
      dataType = 'json';
      testedMethod = 'POST';
    } else {
      dataType = 'html';
      testedMethod = 'GET';
    }

    fetch(`${url}?${(new URLSearchParams(<any>formData)).toString()}`, {
      method: testedMethod,
      body: formData,
    })
      .then((response) => {
        // В зависимости от типа запроса нужно по разному получить ответ от сервера
        return dataType === 'json' ? response.json() : response.text();
      })
      .then((response) => {
        if (data['response-text'] && typeof data['response-text'] === 'string') {
          document.querySelectorAll(data['response-text']).forEach((el) => {
            el.innerHTML = response;
          });
        }

        if (data['response-json'] && typeof data['response-json'] === 'string') {
          document.querySelectorAll(data['response-json']).forEach((el) => {
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
      });
  }

  static formSubmit(formNode: HTMLFormElement) {
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
          const jsonName = element.getAttribute('data-faze-rest-json-name');

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
      if (formNode.hasAttribute('data-faze-rest')) {
        REST.chain(formNode.getAttribute('data-faze-rest') || null);
      }

      // Если есть контейнер <span data-notification=""></span>
      formNode.querySelectorAll('[data-faze-rest-notification]').forEach((el) => {
        if (el.getAttribute('data-faze-rest-notification') === 'response-json') {
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
    const callback = formNode.getAttribute('data-faze-rest-update');
    if (callback) {
      if (typeof window[callback] === 'function') {
        callbackSuccess = window[callback];
      }
    }

    // Добавляем специальное поле для обхода защиты от спама
    formData.append('from', window.location.href);

    // Выполняем запрос на сервер
    REST.request('POST', url, formData, callbackSuccess);
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

  static ajaxDataAttr(object: any) {
    let chain: any[] = [];
    let json: any = null;
    let element: any = null;
    const timeoutID: any[] = [];

    if (object instanceof Element) {
      // ajaxDataAttr( document.querySelector('[data-restapi]') );
      element = object;
    } else if (object instanceof Array) {
      // ajaxDataAttr([{ ... }]);
      chain = object;
      json = JSON.stringify(chain);
    } else {
      throw new Error('Параметр функции ajaxDataAttr не является ни HTML элементом, ни массивом!');
    }

    if (element) {
      if (!element.hasAttribute('data-faze-restapi')) {
        throw new Error('Нет дата-атрибута data-faze-restapi!');
      }

      json = element.getAttribute('data-faze-restapi') || '';
    }

    // проверяем корректность JSON
    try {
      json = JSON.parse(json);
    } catch (error) {
      throw new Error(`Ошибка парсинга JSON конфига ("${json}"), дословно: ${error}`);
    }

    if (json instanceof Array) {
      chain = json;
    } else {
      throw new Error('JSON не является массивом!');
    }

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

          REST.chain(chain);
        }, chain[0]['delay']);
      } else {
        // Запускаем цепочку AJAX запросов без задержки
        if (element && element.name) {
          chain[0][element.name] = currentValue;
        }

        REST.chain(chain);
      }
    }
  }

  static chain(chainRawData: any) {
    let chainData: any = null;

    // Определяем тип цепочки и парсим её в соответствии с ним
    if (chainRawData instanceof Array) {
      chainData = chainRawData;
    } else if (typeof chainData === 'string') {
      try {
        chainData = JSON.parse(chainRawData || '');
      } catch (error) {
        console.error(`Ошибка парсинга JSON в функции ajaxChain ("${chainRawData}"):`, error);
      }
    } else {
      return;
    }

    // Если длина цепочки для выполнения равна нулю, то выходим из метода
    if (chainData.length === 0) {
      return;
    }

    const data = chainData.shift();

    if (typeof data === 'function') {
      data();
      REST.chain(chainData);
    } else if ((typeof data === 'string') && (data in window && window[data]) && (typeof window[data] === 'function')) {
      window[data]();
    } else if (data instanceof Object) {
      if ('function' in data) {
        const functionName = data['function'];

        // Проверим существование функции
        if (functionName in window && typeof window[functionName] === 'function') {
          window[functionName]();
        }

        REST.chain(chainData);
      } else if ('method' in data) {
        const method = data['method'];
        let url = window.location.pathname;

        if (data['page'] && data['module']) {
          url = /^\//.test(data['page']) ? data['page'] : `/${data['page']}.txt`;
          data['show'] = data['module'];
        } else if (data['module']) {
          url = window.location.pathname;
          data['show'] = data['module'];

        } else if (data['page']) {
          url = /^\//.test(data['page']) ? data['page'] : `/${data['page']}.txt`;
        }

        // Если метод POST или post
        if (method.toLocaleString() === 'post') {
          data['update'] = data['module'];
          data['from'] = window.location.href;
          data['mime'] = 'json';
        } else if (!('mime' in data)) {
          data['mime'] = 'txt';
        }

        delete data['method'];
        delete data['module'];
        delete data['page'];

        REST.request(method, url, data, () => {
          REST.chain(chainData);
        });
      } else {
        throw new Error('Не указан обязательный параметр "method" в ajaxChain');
      }
    }
  }
}
