import './Helpers.scss';

/**
 * Структура настроек информационного сообщения
 *
 * Содержит:
 *   class           - CSS класс сообщения
 *   isNested        - нужно ли выстраивать сообщение один за другим или удалять предыдущее
 *   time            - как долго оно должно отображаться, в миллисекундах
 *   backgroundColor - цвет самой плашки сообщения
 */
interface NotificationOptions {
  className: string;
  isNested: boolean;
  backgroundColor: string;
  time: number;
}

class Helpers {
  /**
   * Инициализация методов, которые должны работать всегда, а не по указанию пользователя
   */
  static initialize() {
    Helpers.bindCopyText();
    Helpers.bindMobileMask();
  }

  /**
   * Маска мобильного телефона для поля ввода
   */
  static bindMobileMask() {
    document.querySelectorAll('.faze-mask-mobile').forEach((inputNode: any) => {
      Helpers.mobileMask(inputNode);
    });
  }

  /**
   * Копирование текста(textContent) при нажатии на DOM элемент с классом "faze-copy-text"
   */
  static bindCopyText() {
    // Проходимся по всем элементам
    document.querySelectorAll('.faze-copy-text').forEach((textNode: any) => {
      // Копируем при нажатии
      textNode.addEventListener('click', (event: MouseEvent) => {
        // Если есть что копировать
        if (textNode.textContent) {
          // Создаем инпут с этим текстом и позицианированием "absolute" чтобы вьюпорт не прыгал вниз
          const inputNode = document.createElement('input');
          inputNode.value = textNode.dataset.fazeCopyTextValue || textNode.textContent || '';
          inputNode.style.position = 'absolute';
          inputNode.style.top = `${event.clientY}px`;
          inputNode.style.left = `${event.clientX}px`;
          inputNode.style.opacity = '0';
          document.body.appendChild(inputNode);

          // Выделяем и копируем текст
          inputNode.focus();
          inputNode.select();
          document.execCommand('copy');

          // Обязательно удаляем инпут, он больше не нужен
          inputNode.remove();

          // Создаем элемент для информационного сообщения
          const notificationNode = document.createElement('div');
          notificationNode.className = 'faze-notification';
          notificationNode.textContent = 'Скопировано!';
          textNode.appendChild(notificationNode);

          // Через время удаляем
          setTimeout(() => {
            notificationNode.remove();
          }, 3000);
        }
      });
    });
  }

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
   * Разделение трех знаком у числа пробелами, необходимо для форматирования цен в цдобочитаемом для человека виде.
   * Если передали целое число, то есть которое не содержит точку, то просто разделяем по 3, если же передали число с плавающей точкой,
   * то форматируем у неё только левую часть, то есть ту которая до точки, после этого склеиваем обе части и возвращаем их.
   *
   * @param numberToFormat - число или строка содержащая число которое будет форматироваться
   * @param separator      - разделитель копеек
   *
   * @return строка разделенная пробелами каждые 3 символа
   */
  static numberWithSpaces(numberToFormat: number | string, separator: string = '.'): string {
    const numberString = numberToFormat.toString();
    let result = '';

    if (numberString.includes(separator)) {
      const parts = numberString.split(separator);
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

      result = parts.join(separator);
    } else {
      result = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    return result;
  }

  /**
   * Заменяем двойные кавычки на HTML символы
   *
   * @param text - текст который необходимо обработать
   */
  static escapeString(text: string) {
    return text.replace(/"/g, '&quot;');
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
      if (((event.which > 47 && event.which < 58) || (event.which > 95 && event.which < 106)) && value.length < 18) {
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
   * Показ информационного сообщения сверху экрана
   *
   * @param message - текст или HTML код сообщения
   * @param options - настройки
   */
  static showNotification(message: string, options: NotificationOptions): void {
    const {className = '', isNested = true, time = 3000, backgroundColor = '#00b938'} = options;

    // DOM элемент обертки для информационнах сообщений, она нужна для того, чтобы сообщения шли друг под другом, если их несколько
    let notificationWrapperNode: HTMLDivElement | null = document.querySelector('.faze-notification-wrapper');

    // Проверяем, существует ли DOM элемент обертки для информационных сообщений
    if (!notificationWrapperNode) {
      // Если он не существует, то значит это первое сообщение в пуле, а значит создаём его
      notificationWrapperNode = document.createElement('div');
      notificationWrapperNode.className = 'faze-notification-wrapper';

      // Добавляем его на страницу
      document.body.appendChild(notificationWrapperNode);
    }

    // Создаем DOM элемент сообщения
    const notificationNode: HTMLDivElement = document.createElement('div');
    notificationNode.className = `faze-notification ${className}`;
    notificationNode.innerHTML = message;
    notificationNode.style.backgroundColor = backgroundColor;

    // Если поставлен флаг на удаление предыдущих сообщений, то делаем это
    if (!isNested) {
      notificationWrapperNode.innerHTML = '';
    }

    // Добавляем его на страницу
    notificationWrapperNode.appendChild(notificationNode);

    // После истечения времени удаляем DOM элемент и декриментируем общее количество сообщений на странице
    setTimeout(() => {
      notificationNode.remove();

      // Проверка на содержание в обертке информационных сообщений, если их нет, то удаляем саму обертку
      if (notificationWrapperNode && notificationWrapperNode.querySelectorAll('.faze-notification').length === 0) {
        notificationWrapperNode.remove();
      }
    }, time);
  }

  /**
   * Подбор склонения для числительных, возвращает ТОЛЬКО окончание
   *
   * @param quantity - число для проверки
   * @param endings  - массив окончаний
   */
  static wordEnd(quantity: number, endings: string[] = ['', 'а', 'ов']): string {
    const cases = [2, 0, 1, 1, 1, 2];
    return endings[(quantity % 100 > 4 && quantity % 100 < 20) ? 2 : cases[(quantity % 10 < 5) ? quantity % 10 : 5]];
  }

  /**
   * Запись куки
   *
   * @param name - Имя куки
   * @param value - Значение куки
   * @param expiresInDays - Время жизни в днях
   * @param encode - Нужно ли кодировать значение
   */
  static setCookie(name: string, value: string, expiresInDays?: number, encode: boolean = false) {
    let expires = '';
    if (expiresInDays) {
      const date = new Date();
      date.setTime(date.getTime() + (expiresInDays * 24 * 60 * 60 * 1000));
      expires = `;expires=${date.toUTCString()}`;
    }

    document.cookie = `${name}=${encode ? encodeURIComponent(value) : value}${expires};path=/`;
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
   * Удаление массивов из объекта
   *
   * @param target - объект в котором удаляем
   */
  static removeArrays(target: any) {
    for (const key in target) {
      if (!target.hasOwnProperty(key)) {
        continue;
      }

      if (Array.isArray(target[key])) {
        target[key] = [];
      } else if (Helpers.isObject(target[key])) {
        Helpers.removeArrays(target[key]);
      }
    }

    return target;
  }

  /**
   * Метод для глубого слияния объектов
   *
   * @param arraysReplace
   * @param target      - объект в который сливаем
   * @param sources     - сливаемый объект
   */
  static mergeDeep(arraysReplace: boolean = false, target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (Helpers.isObject(target) && Helpers.isObject(source)) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (Helpers.isObject(source[key])) {
            if (!target[key]) {
              Object.assign(target, {[key]: {}});
            }

            Helpers.mergeDeep(arraysReplace, target[key], source[key]);
          } else {
            // Если это массив или содержит служебный ключ "__id", то необходимо произвести объединение
            if (Array.isArray(target[key]) || (source[key] && source[key][0] && source[key][0].__group !== undefined)) {
              // Если значение не задано, создаем пустой массив и пушим в него первый элемент
              if (!target[key]) {
                target[key] = [];
                target[key].push(...source[key]);
              }

              // Если содержит служебный ключ "__group"
              if (source[key][0].__group !== undefined) {
                // Ищем элемент у которого уже есть такая группа
                const foundElement = target[key].find((targetObject: any) => targetObject.__group === source[key][0].__group);

                // Определяем индекс найденного элемента
                const foundIndex = target[key].indexOf(foundElement);

                // Если элемент в массиве не нашли, то необходимо добавить новый элемент в массив
                if (foundIndex === -1) {
                  target[key].push(...source[key][0]);
                } else {
                  // Если нашли, то объединяем объекты этого элемента с новым
                  target[key][foundIndex] = {...foundElement, ...source[key][0]};
                }
              } else {
                // Если не содержит, то это просто элемент массива, значит пушим его
                if (arraysReplace) {
                  target[key] = source[key];
                } else {
                  target[key].push(...source[key]);
                }
              }
            } else {
              Object.assign(target, {[key]: source[key]});
            }
          }
        }
      }
    }

    return Helpers.mergeDeep(arraysReplace, target, ...sources);
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
   * @param arrayGroup - группа для слияния нескольких пар ключ-значение в один объект при сборке массива объектов
   */
  static objectFromString(jsonObject: any = {}, stringData: string, key: string, value: string, arrayGroup = 'default'): object {
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
    }

    // Если название содержит квадратные скопки, значит нужно собрать массив
    if (key.includes('[]')) {
      // Очищаем ключ от скобок
      const clearArrayKey = key.replace('[]', '');

      // Если ключ содержит точку, то это массив объектов, которые соединяет поле "__group"
      if (key.includes('.')) {
        const objectArrayName = key.split('.')[1];

        // Определяем элемент массива, так же важно добавить "__group", это служебное поле,
        // для будущего слияния ключей-значений в один объект элемента массива
        ref[clearArrayKey.split('.')[0]] = [{
          __group: arrayGroup,
          [objectArrayName]: value,
        }];
      } else {
        ref[clearArrayKey] = [value];
      }
    } else {
      ref[key] = value;
    }

    // Возвращаем объект собранный из переданного и только что сгенерированного
    return Helpers.mergeDeep(false, jsonObject, result);
  }
}

export default Helpers;
