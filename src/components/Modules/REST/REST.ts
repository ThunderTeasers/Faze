import Faze from '../../Core/Faze';
import Helpers from '../../Helpers/Helpers';

class REST {
  static request(method: string, type: string | null, url: string, data: any, callbackSuccess: ((response: any) => void) | null, node?: HTMLElement): void {
    let formData: FormData = new FormData();
    let dataType: string = '';
    let testedMethod: string = '';
    let currentURL = url;

    // Проверка method на корректность
    if (method.toLowerCase() === 'post') {
      dataType = type || 'json';
      testedMethod = 'POST';
    } else {
      dataType = type || 'html';
      testedMethod = 'GET';
    }

    // Параметры запроса, вынесены в отдельную переменную, чтобы иметь возможность задать "body", если это POST запрос и не делать этого
    // если GET. Т.к. при передаче даже пустоты(пустой строки, null, undefined) fetch выдает ошибку, что GET запрос не может иметь body.
    const fetchOptions: RequestInit = {
      method: testedMethod,
      credentials: 'same-origin',
    };

    // Определим тип переменной и в соответствии с ней заполняем FormData
    if (data instanceof FormData) {
      formData = data;
    } else if (data instanceof HTMLFormElement) {
      formData = new FormData(data);
    } else if (data) {
      for (const key of Object.keys(data)) {
        // Проверяем массив ли это, если да, то добавляем все его элементы в FormData в цикле
        if (data[key] instanceof Array) {
          for (const value of data[key]) {
            formData.append(key, value);
          }
        } else {
          // Если нет, просто добавляем
          formData.append(key, data[key]);
        }
      }
    } else {
      throw new Error('Параметр "data" функции ajaxRequest не является объектом');
    }

    // Заполняем "from", если его нет
    if (!formData.has('from')) {
      formData.append('from', window.location.href);
    }

    // Заполняем данные, если это POST запрос
    if (method.toLowerCase() === 'post') {
      fetchOptions.body = formData;
    }

    // Если это GET запрос, подставляем параметры
    if (method.toLowerCase() === 'get') {
      const formDataQuery: string = [...formData.entries()].map((entry) => `${encodeURIComponent(<any>entry[0])}=${encodeURIComponent(<any>entry[1])}`).join('&');

      if (currentURL.includes('?')) {
        currentURL += `&${new URLSearchParams(formDataQuery).toString()}`;
      } else {
        currentURL += `?${new URLSearchParams(formDataQuery).toString()}`;
      }
    }

    fetch(`${currentURL}`, fetchOptions)
      .then((response: Response) => {
        let responseData = null;

        // В зависимости от типа запроса нужно по разному получить ответ от сервера
        try {
          responseData = dataType === 'json' ? response.json() : response.text();
        } catch (error) {
          console.error(error);
        }

        return responseData;
      })
      .then((response: any) => {
        if (data['response_html'] && typeof data['response_html'] === 'string') {
          // Парсинг ответа
          const responseHTML = new DOMParser().parseFromString(response, 'text/html');

          document.querySelectorAll<HTMLElement>(data['response_html']).forEach((el: HTMLElement) => {
            const responseNode = responseHTML.querySelector(data['response_html']);
            el.innerHTML = responseNode ? responseNode.innerHTML : '';

            if (data.replace_attrs) {
              Object.keys(responseNode.dataset).forEach((key) => {
                el.dataset[key] = responseNode.dataset[key];
              });
            }
          });
        } else if (data['response_text'] && typeof data['response_text'] === 'string') {
          document.querySelectorAll(data['response_text']).forEach((el) => {
            el.innerHTML = response;
          });
        } else if (data['response_callback'] && typeof data['response_callback'] === 'string' && data['response_callback'] in window && (window as any)[data['response_callback']] instanceof Function) {
          (window as any)[data['response_callback']](response);
        } else if (data['response_json'] && typeof data['response_json'] === 'string') {
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
      .catch((error: any) => {
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

  /**
   * Метод помощник для работы с формами через AJAX
   * Делает следующее:
   *   1. Собирает и отправляет все данные инпутов в форме через AJAX запрос;
   *   2. Если у полей есть специальный data атрибут "data-faze-restapi-json-name" собирает на основе этих полей JSON объекты, которые
   *      будут в итоге отправлены на сервер с указанным именем. ВАЖНО - из formData помеченные поля удаляются;
   *   3. Выполняет указанные в data атрибуте "data-faze-restapi-form" команды указанные как для метода "dataAttr";
   *   4. Выдает ответ при наличии DOM Элемента с data атрибутом "data-faze-restapi-notification", который в свою очередь может быть
   *      равен двум значениям:
   *        text - ответ от сервера будет вставлен "как есть" через "innerHTML";
   *        json - в помеченное поле будет вставлен параметр "json.message" из ответа сервера.
   *
   * @param formNode - DOM элемент формы из которой оправляем
   * @param callback - пользовательская функция, исполняющаяся ПОСЛЕ всех действий
   */
  static formSubmit(formNode: HTMLFormElement, callback?: (response?: any) => void): void {
    if (!(formNode instanceof HTMLFormElement)) {
      throw new Error('Параметр метода formSubmit не является формой');
    }

    // Данные инпутов формы
    const formData: FormData = new FormData(formNode);

    // Поля, имеющие принадлежность к JSON
    const jsonFields: NodeListOf<HTMLElement> = formNode.querySelectorAll('[data-faze-restapi-json-name]');

    // Получение уникальных названий полей для сборки JSON объектов
    const jsonNames: string[] = [
      ...new Set(
        Array.from(jsonFields).map((item: any) => {
          const inputDataName = item.dataset.fazeRestapiJsonName;

          return inputDataName.includes('.') ? inputDataName.substring(0, inputDataName.indexOf('.')) : inputDataName;
        }),
      ),
    ];

    // Проходимся по уникальным именам объектов JSON которые надо собрать
    for (const jsonName of jsonNames) {
      let jsonObject: any = {};

      // Проходимся по всем инпутам название в атрибуте которых начинается с имени ключа объекта в который мы собираем их
      const inputsNodes: HTMLInputElement[] = Array.from(formNode.querySelectorAll('[data-faze-restapi-json-name]')).filter((inputNode: any) => {
        const attrJsonName = inputNode.dataset.fazeRestapiJsonName;

        // Проверяем, если название содержит точку, то значит нужно проверять вместе с ней, если нет - то нет, это очень важно
        return attrJsonName.includes('.') ? attrJsonName.startsWith(`${jsonName}.`) : attrJsonName.startsWith(`${jsonName}`);
      }) as HTMLInputElement[];

      // Проходимся по всем инпутам и собираем итоговый объект
      inputsNodes.forEach((itemNode: HTMLInputElement) => {
        // Проверка, является ли инпут чекбоксом
        const isCheckbox: boolean = itemNode.type === 'checkbox';

        // Проверка, является ли инпут радио кнопкой
        const isRadioButton: boolean = itemNode.type === 'radio';

        // Пропускаем не нужные инпуты
        if (
          // Кнопки
          ['button', 'submit'].includes(itemNode.type) ||
          // Радио кнопки которые не в активном положении
          (isRadioButton && !itemNode.checked) ||
          // Чекбоксы в неактивном положении у которых нет data атрибута с значением неактивного положения, либо атрибут пустой
          (isCheckbox && !itemNode.checked && !itemNode.dataset.fazeRestapiDisabledValue)
        ) {
          return;
        }

        // Мы должны вырезать из строки всё что идет до первой точки, т.к. это ключ для отправки в formData, если точки нет, это
        // значит, что это ключ первого уровня, а для этого необходимо передать пустую строку
        let jsonNameForObject: string | undefined = itemNode.dataset.fazeRestapiJsonName;
        if (jsonNameForObject && jsonNameForObject.includes('.')) {
          jsonNameForObject = jsonNameForObject.substring(jsonNameForObject.indexOf('.') + 1);
        } else {
          jsonNameForObject = '';
        }

        const key: string = itemNode.dataset.fazeRestapiJsonKey || itemNode.name;
        let value: string | null = itemNode.dataset.fazeRestapiJsonValue || itemNode.value || itemNode.dataset.fazeRestapiDisabledValue || null;

        // Если это не активный чекбокс, то присваиваем ему значение из data атрибута
        // Гарантированность того, что оно задано, обеспечивает условие сверху
        if (isCheckbox && !itemNode.checked) {
          value = itemNode.dataset.fazeRestapiDisabledValue || null;
        }

        // Группа массива
        const arrayGroup: string = itemNode.dataset.fazeRestapiJsonArrayGroup || 'default';

        // Если есть значение, тогда создаём объект
        if (value) {
          jsonObject = Faze.Helpers.objectFromString(jsonObject, jsonNameForObject, key, value, arrayGroup);
        }

        // Удаляем найденные поля из formdata
        if (formData.delete) {
          formData.delete(itemNode.name);
        }
      });

      // Важно взять только то, что стоит до точки
      const jsonRealName: string = jsonName.split('.')[0];

      // Если есть data атрибут с объектом с которым нужно слить сгенерируемый из строк объект, то выполняем слияние
      if (formNode.dataset.fazeRestapiJsonMerge) {
        let objectToMerge: Object | null = null;
        const jsonData: string = formNode.dataset.fazeRestapiJsonMerge;

        try {
          objectToMerge = JSON.parse(jsonData);
        } catch (error) {
          console.error(`Ошибка парсинга JSON объекта для слияния("data-faze-restapi-json-merge"), JSON: ${jsonData}, текст ошибки: `, error);
        }

        // Объединяем объекты
        jsonObject = Helpers.mergeDeep(true, objectToMerge, jsonObject);
      }

      // Добавляем получившийся JSON объект в итоговые данные для отправки
      formData.append(jsonRealName, JSON.stringify(jsonObject));
    }

    // Вычисляем URL для отправки запроса
    const url: string = formNode.getAttribute('action') || window.location.href;

    // Определение, какой тип ответа запрашивать
    let typeForResponse: string = 'text';
    if (formNode.elements[<any>'mime'] && (<any>formNode.elements[<any>'mime']).value) {
      typeForResponse = (<any>formNode.elements[<any>'mime']).value;
    }

    let notificationNode: HTMLElement | null = null;

    // Ищем DOM элемент для вывода информационного сообщения
    if (formNode.dataset.fazeRestapiNotification) {
      notificationNode = formNode;
    } else {
      notificationNode = formNode.querySelector('[data-faze-restapi-notification]');
    }

    if (notificationNode) {
      if (notificationNode.dataset.fazeRestapiNotification === 'response_json') {
        typeForResponse = 'json';
      }
    }

    // Футкция, которая исполнится при получении ответа от сервера
    const callbackSuccess = (response: any) => {
      if (formNode.hasAttribute('data-faze-restapi-form')) {
        REST.chain(formNode.dataset.fazeRestapiForm || null, callback, response);
      } else if (typeof callback === 'function') {
        console.log('Нет атрибутов data-faze-restapi-form, но callback задан, исполняем его');
        callback(response);
      }

      // Проставляем класс, сигнализирующий о том, что запрос выполнился и ответ пришел
      formNode.classList.add('faze-restapi-form-success');

      // Если есть контейнер с [data-faze-restapi-notification="text/json"]
      if (notificationNode) {
        if (notificationNode.dataset.fazeRestapiNotificationText) {
          notificationNode.innerHTML = notificationNode.dataset.fazeRestapiNotificationText;
        } else {
          if (notificationNode.dataset.fazeRestapiNotification === 'response_json') {
            notificationNode.innerHTML = response.message;
          } else {
            notificationNode.innerHTML = response;
          }
        }
      }
    };

    // Добавляем специальное поле для обхода защиты от спама
    formData.append('from', window.location.href);

    // Выполняем запрос на сервер
    REST.request('POST', typeForResponse, url, formData, callbackSuccess, formNode);
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

  static dataAttr(object: any | any[], finalCallback?: () => void) {
    let chain: any[] = [];
    let json: any = null;
    let element: any = null;
    const timeoutID: any[] = [];

    if (object instanceof Element) {
      // Пример вызова: ajaxDataAttr( document.querySelector('[data-restapi]') );
      element = object;

      if (!element.hasAttribute('data-faze-restapi-attr')) {
        throw new Error('Нет дата-атрибута data-faze-restapi!');
      }

      json = element.getAttribute('data-faze-restapi-attr') || '';
    } else if (object.constructor === Array) {
      // Пример вызова: dataAttr([{ ... }]);
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

      if (chain[0].delay) {
        // Назначим ID если не было
        if (!element.hasAttribute('id')) {
          element.id = Math.round(new Date().getTime() + Math.random() * 100000);
        }

        if (timeoutID[element.id]) {
          clearTimeout(timeoutID[element.id]);
        }

        timeoutID[element.id] = setTimeout(() => {
          let newValue = null;
          if (element && element.name) newValue = REST.getElementValue(element);
          if (element && element.name) chain[0][element.name] = newValue;

          REST.chain(chain, finalCallback);
        }, chain[0].delay);
      } else {
        // Запускаем цепочку AJAX запросов
        if (element && element.name) {
          chain[0][element.name] = currentValue;
        }

        REST.chain(chain, finalCallback);
      }
    }
  }

  /**
   * Подготавливает запрос и выполняет цепочку вложенных AJAX запросов, работает рекурсивно, пока не останется элементов в массиве запросов
   *
   * @param chainRawData  - данные предыдущей итерации ajaxChain
   * @param finalCallback - пользовательская функция, исполняющаяся после всей цепочки
   * @param response      - ответ от сервера для финальной пользовательской функции
   */
  static chain(chainRawData: any, finalCallback?: (response?: any) => void, response?: any) {
    let chainData: any;

    // Определяем тип цепочки и парсим её в соответствии с ним
    if (chainRawData instanceof Array) {
      chainData = chainRawData;
    } else if (typeof chainRawData === 'string') {
      try {
        chainData = JSON.parse(chainRawData || '');
      } catch (error) {
        console.error(`Ошибка парсинга JSON в функции ajaxChain ("${chainRawData}"), текст ошибки:`, error);
      }
    }

    // Если длина цепочки для выполнения равна нулю или "chainData" не определено, то выполняем финальную пользовательскую функцию и выходим
    if (!chainData || (chainData && chainData.length === 0)) {
      if (typeof finalCallback === 'function') {
        try {
          finalCallback(response);
        } catch (error) {
          console.error('Ошибка исполнения пользовательской функции в formSubmit, текст ошибки:', error);
        }
      }

      return;
    }

    // Берем данные первого элемента и удаляем его из массива
    let data = <any>chainData.shift();

    // Тип ответа от сервера
    let dataType = data.type || null;

    // Если это функция, то выполняем её, иначе - это объект, разбираем его и в любом случае снова рекурсивно запускаем ajaxChain
    if (typeof data === 'function') {
      try {
        data(response);
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции переданной через "function" в ajaxChain, текст ошибки:', error);
      }
      REST.chain(chainData, finalCallback, response);
    } else if (typeof data === 'string' && data in window && (window as any)[data] && (window as any)[data] instanceof Function) {
      // Если это функция записанная строкой, то есть только имя, тоже выполним её
      try {
        (window as any)[data](response);
      } catch (error) {
        console.error('Ошибка исполнения пользовательской функции переданной строкой в ajaxChain, текст ошибки:', error);
      }
    } else {
      // Если в объекте присутствует поле "function", то есть имя некой функции, пытаемся найти её и выполнить
      if ('function' in data) {
        const functionName = data['function'];

        // Проверим существование функции
        if (functionName in window && typeof (window as any)[functionName] === 'function') {
          try {
            (window as any)[functionName](response);
          } catch (error) {
            console.error(`Ошибка в пользовательской функции в параметре "function" с именем ${functionName}, текст ошибки:`, error);
          }
        }

        REST.chain(chainData, finalCallback, response);
      } else if ('method' in data || 'formData' in data) {
        // Если в объекте присутствует поле "method" значит это объект с настройками для отправки через ajaxRequest
        let method = data['method'];
        let url = window.location.pathname;

        // Разбор параметров "page" и "module" относительно присутствия которых им присваиваются соответствующие значения
        if (data['page'] && data['module']) {
          url = /^\//.test(data['page']) ? data['page'] : `/${data['page']}.txt`;
          data['show'] = data['module'];
        } else if (data['module']) {
          url = window.location.pathname;

          // Системный параметры
          const systemParams = ['module', 'show', 'page', 'mime', 'from', 'update', 'method'];

          // Добавляем параметры к запросу, если они не относятся к "системным"
          const params = new URLSearchParams(window.location.search);
          Array.from(params).forEach((param) => {
            const name = param[0];
            const value = param[1];

            if (!systemParams.includes(name)) {
              data[name] = value;
            }
          });

          data['show'] = data['module'];
        } else if (data['page']) {
          url = /^\//.test(data['page']) ? data['page'] : `/${data['page']}.txt`;
        }

        // Если это FormData, то метод всегда "POST"
        if ('formData' in data) {
          method = 'POST';
        }

        // Если это POST метод
        if (method.toLowerCase() === 'post') {
          data['update'] = data['module'];
          data['from'] = window.location.href;

          if (!('mime' in data)) {
            data['mime'] = 'json';
          }
        } else if (!('mime' in data)) {
          data['mime'] = 'txt';
        }

        // Получаем полный адрес если необходимо
        url = data['url'] || url;

        // Получаем пользовательскую функцию
        const callback = data['callback'];

        // Удаляем данные которые не хотим передавать на сервер
        delete data['method'];
        delete data['module'];
        delete data['page'];
        delete data['callback'];
        delete data['url'];

        dataType = data['mime'] === 'json' ? 'json' : 'html';

        // Добавляем encode="utf8" если его нет
        if (!('encoding' in data)) {
          data['encoding'] = 'utf8';
        }

        // Если это FormData, то передаваться будет только её объект
        if ('formData' in data) {
          data = data.formData;
        }

        // Отправляем запрос, после выполнения которого снова вызываем ajaxChain
        REST.request(method, dataType, url, data, (response: any) => {
          if (typeof callback === 'function') {
            try {
              callback(response);
            } catch (error) {
              console.error('Ошибка исполнения пользовательской функции переданной в ajaxChain, текст ошибки:', error);
            }
          }

          // Продолжаем исполнять цепочку запросов
          REST.chain(chainData, finalCallback, response);
        });
      } else if ('redirect' in data) {
        window.location.href = data['redirect'];
      } else {
        throw new Error('Не указан обязательный параметр "method" или "function" в ajaxChain');
      }
    }
  }
}

export default REST;
