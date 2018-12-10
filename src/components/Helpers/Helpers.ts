class Helpers {
  /**
   * Асинхронная загрузка дополнительного JS
   *
   * Пример использования:
   *   Faze.Helpers.loadJS('https://www.youtube.com/iframe_api');
   *
   * @param url - адрес по которому лежит JS файл
   * @returns   - промис для последующей работы при успешной или неуспешной загрузке
   */
  static loadJS(url: string) {
    return new Promise((resolve, reject) => {
      const nodeScript = document.createElement('script');
      document.body.appendChild(nodeScript);
      nodeScript.src = url;
      nodeScript.async = true;
      nodeScript.onload = resolve;
      nodeScript.onerror = reject;
    });
  }

  /**
   * Активация элемента в массиве DOM объектов
   *
   * @param array     - массив DOM объектов
   * @param index     - индекс искомого элемента
   * @param cssClass  - CSS класс который вешается на айтивный элемент, по умолчанию 'active'
   */
  static activateItem(array: HTMLElement[], index: number, cssClass: string = 'active') {
    array.forEach((item, i) => {
      if (index === i) {
        item.classList.add(cssClass);
      } else {
        item.classList.remove(cssClass);
      }
    });
  }

  /**
   * Создание маски мобильного телефона российского формата
   *
   * @param input - DOM элемент ввода телефона
   */
  static mobileMask(input: HTMLInputElement) {
    let value = '';

    input.addEventListener('keydown', (event) => {
      event.preventDefault();

      // Проверка на пустую строку, если это так и пользователь нажимает не бекспейс
      // то добавляется начало телефона
      if (value.length === 0 && event.which !== 8) {
        value += '+7 (';
      }

      // Добавление цифры, проверка на цифры и что номер меньше 18 знаков(включая -, ( и ))
      if (event.which > 47 && event.which < 58 && value.length < 18) {
        value += event.key;
        if (value.length === 7) {
          value += ') ';
        } else if (value.length === 12 || value.length === 15) {
          value += '-';
        }
      }

      // Удаление цифры
      if (event.which === 8) {
        value = value.slice(0, -1);
      }

      // Присваиваем собранный номер
      input.value = value;
    });
  }

  /**
   * Запись куки
   *
   * @param name - Имя куки
   * @param value - Значение куки
   * @param exdays - Время жизни в днях
   */
  static setCookie(name: string, value: string, exdays: number) {
    const date = new Date();
    date.setTime(date.getTime() + (exdays * 24 * 60 * 60 * 1000));

    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  /**
   * Получение значения куки по имени
   *
   * @param name - Имя куки
   * @returns {string} - Значение куки
   */
  static getCookie(name: string) {
    const cname = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i += 1) {
      let cookie = ca[i];

      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(cname) === 0) {
        return cookie.substring(cname.length, cookie.length);
      }
    }

    return '';
  }

  /**
   * Определение объект ли переданный параметр, суть в том, что массив тоже объект в JS и эта проверка исключает это
   *
   * @param item - переменная которую надо проверить
   */
  static isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Метод для глубого слияния объектов
   *
   * @param target  - объект в который сливаем
   * @param sources - сливаемый объект
   */
  static mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (Helpers.isObject(target) && Helpers.isObject(source)) {
      for (const key in source) {
        if (Helpers.isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, {[key]: {}});
          }

          Helpers.mergeDeep(target[key], source[key]);
        } else {
          // Если это массив или содержит служебный ключ "__id", то необходимо произвести объединение
          if (Array.isArray(target[key]) || source[key][0].__id !== undefined) {
            // Если значение не задано, создаем пустой массив и пушим в него первый элемент
            if (!target[key]) {
              target[key] = [];
              target[key].push(...source[key]);
            }

            // Если содержит служебный ключ "__id", то необходимо объединяем уже существующие данные элемента массива с новыми
            if (source[key][0].__id !== undefined) {
              target[key][source[key][0].__id] = {...target[key][source[key][0].__id], ...source[key][0]};
            } else {
              // Если не содержит, то это просто элемент массива, значит пушим его
              target[key].push(...source[key]);
            }
          } else {
            Object.assign(target, {[key]: source[key]});
          }
        }
      }
    }

    return Helpers.mergeDeep(target, ...sources);
  }

  /**
   * Создание объекта из строки
   *
   * Пример работы:
   *   Исходная строка: manager.address.house, ключ: name, значение: Nice House
   *   Результат:
   *     {
   *       manager: {
   *         address: {
   *           house: {
   *             name: "Nice House"
   *           }
   *         }
   *       }
   *     }
   *
   * Так же происходит слияние сгенерированного объекта с переданным в первом параметре, при передаче пустого объекта будет просто
   * сгенерирован новый объект из строки и ключа/значения.
   *
   * @param jsonObject - объект в который в итоге будет слит другой объект в результате парсинга строки
   * @param stringData - строка для парсинга, должна либо содержать одно слово, либо слова разделенными точками для показа вложенности
   * @param key        - ключ для вставки в итоговый объект
   * @param value      - значение для вставки в итоговый объект по так же переданному ключу
   */
  static objectFromString(jsonObject: any = {}, stringData: string, key: string, value: string): object {
    // Разбиваем строку на токены, при этом фильтруя на пустоту токена, т.к. если мы пытаемся разделить пустую строку, "split" вернет
    // массив у которого 1 пустой элемент, а это некорректно в данном случае.
    const objectTokens: string[] = stringData.split('.').filter(token => token.length !== 0);

    // Конечный результат генерации объекта из строки
    const result = {};

    // Промежуточный объект, для создания вложенных объектов, если это понадобится
    let ref: any = result;

    // Если есть токены для генерации объекта
    if (objectTokens.length > 0) {
      // Проходимся по токенам
      for (let i = 0; i < objectTokens.length; i += 1) {
        // Создаем новый объект и переприсваиваем его к промежуточному объекту для создания дальнейшей цепочки
        ref[objectTokens[i]] = {};
        ref = ref[objectTokens[i]];
      }

      // Если название содержит квадратные скопки, значит нужно собрать массив
      if (key.includes('[') && key.includes(']')) {
        const regex = /\[(.+?)?\]/g;
        const match = regex.exec(key);
        let index = 0;

        // Берем число между квадратных скобок, если оно есть
        if (match) {
          index = parseInt(match[0].replace('[', '').replace(']', ''), 10);
        }

        // Очищаем ключ от скобок
        const clearArrayKey = key.replace(regex, '');

        // Если ключ содержит точку, то это массив объектов, а это значит, что у него есть индекс прописанный между скобками
        if (key.includes('.')) {
          const objectArrayName = key.split('.')[1];

          // Определяем элемент массива, так же важно добавить "__id", это служебное поле, для будущего слияния ключей-значений в один
          // объект элемента массива
          ref[clearArrayKey.split('.')[0]] = [{
            __id: index,
            [objectArrayName]: value,
          }];
        } else {
          ref[clearArrayKey] = [value];
        }
      } else {
        ref[key] = value;
      }
    } else {
      // Если встретили ключ первый раз, то просто добавляем его
      if (!(key in jsonObject)) {
        jsonObject[key] = value;
      } else {
        // Если нет, то проверяем, если значение это уже массив, то просто добавляем новое, если нет, то создаем массив
        if (Array.isArray(jsonObject[key])) {
          jsonObject[key] = [...jsonObject[key], value];
        } else {
          jsonObject[key] = [jsonObject[key], value];
        }
      }
    }

    // Возвращаем объект собранный из переданного и только что сгенерированного
    return Helpers.mergeDeep(jsonObject, result);
  }
}

export default Helpers;
