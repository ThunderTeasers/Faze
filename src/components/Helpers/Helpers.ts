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

/**
 * Структура настроек метода для перетаскивания
 *
 * Содержит:
 *   node - DOM элемент который перетаскиваем
 *   absolute - позицианируется ли элемент через "absolute"
 *   callbacks
 *     beforeDrag - пользовательская функция, исполняющаяся до перетаскивания
 *     drag - пользовательская функция, исполняющаяся во время перетаскивания
 *     afterDrag - пользовательская функция, исполняющаяся после перетаскивания
 *
 */
interface DragOptions {
  node?: HTMLElement;
  callbacks: {
    beforeDrag?: () => void;
    drag?: () => void;
    afterDrag?: () => void;
  };
}

/**
 * Структура показывающая на какую область DOM Элемента была наведена мышь, используется в методе "isMouseOver"
 *
 * Содержит
 *   contains     - внутри ли мышь всего элемента
 *   sides
 *     top        - внутри верхней половины
 *     bottom     - внутри нижней половины
 *     left       - внутри левой половины
 *     right      - внутри правой половины
 */
interface MouseOverResult {
  contains: boolean;
  sides: {
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
  };
}

class Helpers {
  /**
   * Инициализация методов, которые должны работать всегда, а не по указанию пользователя
   */
  static initialize(): void {
    Helpers.bindCopyText();
    Helpers.bindMobileMask();
  }

  /**
   * Маска мобильного телефона для поля ввода
   */
  static bindMobileMask(): void {
    document.querySelectorAll<HTMLInputElement>('.faze-mask-mobile').forEach((inputNode: HTMLInputElement) => {
      Helpers.mobileMask(inputNode);
    });
  }

  /**
   * Копирование текста(textContent) при нажатии на DOM элемент с классом "faze-copy-text"
   */
  static bindCopyText(): void {
    // Проходимся по всем элементам
    document.querySelectorAll<HTMLElement>('.faze-copy-text').forEach((textNode: HTMLElement) => {
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
  static loadJS(url: string): Promise<any> {
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
  static activateItem(array: HTMLElement[], index: number, cssClass: string = 'active'): void {
    array.forEach((itemNode: HTMLElement, i: number) => {
      if (index === i) {
        itemNode.classList.add(cssClass);
      } else {
        itemNode.classList.remove(cssClass);
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
    const numberString: string = numberToFormat.toString();
    let result: string = '';

    if (numberString.includes(separator)) {
      const parts: string[] = numberString.split(separator);
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
  static escapeString(text: string): string {
    return text.replace(/"/g, '&quot;');
  }

  /**
   * Создание маски мобильного телефона российского формата
   *
   * @param input - DOM элемент ввода телефона
   */
  static mobileMask(input: HTMLInputElement): void {
    let value: string = '';

    input.addEventListener('focus', (event: FocusEvent) => {
      // Проверка на пустую строку, если это так и пользователь нажимает не backspace то добавляется начало телефона
      if (value.length === 0 && event.which !== 8) {
        value += '+7 (';
      }

      // Присваиваем собранный номер
      input.value = value;
    });

    input.addEventListener('keydown', (event: KeyboardEvent) => {
      event.preventDefault();

      // Если это backspace то не удаляем дальше чем 3 символа
      if (event.which === 8) {
        if (value.length <= 5) {
          value = '+7 ( ';
        }
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
    const cases: number[] = [2, 0, 1, 1, 1, 2];
    return endings[(quantity % 100 > 4 && quantity % 100 < 20) ? 2 : cases[(quantity % 10 < 5) ? quantity % 10 : 5]];
  }

  /**
   * Конвертация секунд во время, например 3602 -> 1 час 0 минут 2 секунды
   *
   * @param totalSeconds - общее количество секунд
   * @param showEmpty    - показывать ли пустые данные, например "0 часов" или "0 минут"
   * @param showHours    - показывать ли часы, имеет приоритет выше, чем "showEmpty"
   * @param showMinutes  - показывать ли минуты, имеет приоритет выше, чем "showEmpty"
   * @param showSeconds  - показывать ли секунды, имеет приоритет выше, чем "showEmpty"
   */
  static secondsToTime({totalSeconds = 0, showEmpty = false, showHours = true, showMinutes = true, showSeconds = true} = {}): string {
    let totalSecondsRaw: number = totalSeconds;

    // Время в человекопонимаемом формате
    let resultTime: string = '';

    const hours: number = Math.floor(totalSecondsRaw / 3600);
    totalSecondsRaw %= 3600;
    const minutes: number = Math.floor(totalSecondsRaw / 60);
    const seconds: number = totalSecondsRaw % 60;

    if ((hours !== 0 || showEmpty) && showHours) {
      resultTime += `${hours} час${Helpers.wordEnd(hours, ['', 'а', 'ов'])} `;
    }

    if ((minutes !== 0 || showEmpty) && showMinutes) {
      resultTime += `${minutes} минут${Helpers.wordEnd(minutes, ['а', 'ы', ''])} `;
    }

    if ((seconds !== 0 || showEmpty) && showSeconds) {
      resultTime += `${seconds} секунд${Helpers.wordEnd(seconds, ['а', 'ы', ''])}`;
    }

    return resultTime;
  }

  /**
   * Определяет, выбран ли чекбокс
   *
   * @param name        - имя чекбокса
   * @param parentNode  - DOM элемент родителя, по умолчанию ищем везде, то есть document
   */
  static isCheckboxChecked(name: string, parentNode: HTMLElement | Document = document): boolean {
    return parentNode.querySelectorAll('input[type="checkbox"]:checked').length > 0;
  }

  /**
   * Определяет, выбрана ли радио кнопка
   *
   * @param name        - имя чекбокса
   * @param parentNode  - DOM элемент родителя, по умолчанию ищем везде, то есть document
   */
  static isRadioChecked(name: string, parentNode: HTMLElement | Document = document): boolean {
    return parentNode.querySelectorAll('input[type="radio"]:checked').length > 0;
  }

  /**
   * Запись куки
   *
   * @param name - Имя куки
   * @param value - Значение куки
   * @param expiresInDays - Время жизни в днях
   * @param encode - Нужно ли кодировать значение
   */
  static setCookie(name: string, value: string, expiresInDays?: number, encode: boolean = false): void {
    let expires: string = '';
    if (expiresInDays) {
      const date: Date = new Date();
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
  static getCookie(name: string): string {
    const cookieName: string = `${name}=`;
    const cookieValues: string[] = document.cookie.split(';');

    for (let i = 0; i < cookieValues.length; i += 1) {
      let cookie = cookieValues[i];

      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1);
      }

      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }

    return '';
  }

  /**
   * Определение объект ли переданный параметр, суть в том, что массив тоже объект в JS и эта проверка исключает это
   *
   * @param item - переменная которую надо проверить
   */
  static isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Удаление массивов из объекта
   *
   * @param target - объект в котором удаляем
   */
  static removeArrays(target: any): Object {
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

  /**
   * Определяет зашла ли мышь внутрь данного элемента
   *
   * @param event           - Event движения мыши, для получения координат
   * @param itemNode        - DOM элемент вхождение в который необходимо проверить
   * @param calculateSides  - рассчитывать ли данные для сторон
   *
   * @return{boolean} - "true" если вхождение есть, "false" если нет
   */
  static isMouseOver(event: MouseEvent, itemNode: HTMLElement, calculateSides: { vertical: boolean, horizontal: boolean } = {
    vertical: false,
    horizontal: false,
  }): MouseOverResult {
    // DOMRect текущего элемента
    const itemRect = itemNode.getBoundingClientRect();

    // Объект с результатами проверки
    const result: MouseOverResult = {
      contains: ((event.clientX > itemRect.left) && (event.clientX < itemRect.left + itemRect.width))
        && ((event.clientY > itemRect.top) && (event.clientY < itemRect.top + itemRect.height)),
      sides: {
        top: undefined,
        bottom: undefined,
        left: undefined,
        right: undefined,
      },
    };

    // Вычисляем входы в вертикальном направлении(верх и низ)
    if (calculateSides.vertical) {
      // Половина высоты
      const halfHeight = itemRect.height / 2;

      // Проверяем внутри ли мышь по горизонтали
      const isInsideHorizontally = ((event.clientX > itemRect.left) && (event.clientX < itemRect.left + itemRect.width));

      // Проверяем на вхождение в верхнюю часть
      result.sides.top = ((event.clientY > itemRect.top) && (event.clientY < itemRect.top + halfHeight)) && isInsideHorizontally;

      // Проверяем на вхождение в нижнюю часть
      result.sides.bottom = ((event.clientY > itemRect.top + halfHeight) && (event.clientY < itemRect.top + itemRect.height)) && isInsideHorizontally;
    }

    // Вычисляем входы в горизонтальном направлении(верх и низ)
    if (calculateSides.horizontal) {
      // Половина высоты
      const halfWidth = itemRect.width / 2;

      // Проверяем внутри ли мышь по горизонтали
      const isInsideVertically = ((event.clientY > itemRect.top) && (event.clientY < itemRect.top + itemRect.height));

      // Проверяем на вхождение в верхнюю часть
      result.sides.left = ((event.clientX > itemRect.left) && (event.clientX < itemRect.left + halfWidth)) && isInsideVertically;

      // Проверяем на вхождение в нижнюю часть
      result.sides.right = ((event.clientX > itemRect.left + halfWidth) && (event.clientX < itemRect.left + itemRect.width)) && isInsideVertically;
    }

    return result;
  }

  /**
   * Присваивание стилей DOM Элементу
   *
   * @param node    - DOM элемент которому присваиваем
   * @param styles  - стили которые присваиваем
   */
  static setElementStyle(node: HTMLElement, styles: { [key: string]: string }): void {
    for (const style in styles) {
      if (styles.hasOwnProperty(style)) {
        node.style[style as any] = styles[style];
      }
    }
  }

  /**
   * Присваивание атрибутов DOM элементу
   *
   * @param node        - DOM элемент которому присваиваем
   * @param attributes  - атрибуты которые присваиваем
   */
  static setElementAttributes(node: HTMLElement, attributes: { [key: string]: string }) {
    for (const attribute in attributes) {
      if (attributes.hasOwnProperty(attribute)) {
        node.setAttribute(attribute, attributes[attribute]);
      }
    }
  }

  /**
   * Создание DOM элемент с заданными стилями и атрибутами, так же есть возможность сразу задать родителя
   *
   * @param tag         - тег создаваемого DOM элемента
   * @param attributes  - атрибуты создаваемого DOM элемента
   * @param styles      - стили создаваемого DOM элемента
   * @param parent      - родитель создаваемого DOM элемента
   */
  static createElement(tag: string, attributes?: { [key: string]: string }, styles?: { [key: string]: string }, parent?: HTMLElement): HTMLElement {
    // Создаем DOM элемент
    const node = document.createElement(tag);

    // Если есть атрибуты, присваиваем их
    if (attributes) {
      this.setElementAttributes(node, attributes);
    }

    // Если есть стили, присваиваем их
    if (styles) {
      this.setElementStyle(node, styles);
    }

    // Если задан родитель, сразу добавляем созданный элемент в него
    if (parent) {
      parent.appendChild(node);
    }

    return node;
  }

  /**
   * Определение абсолютных координат DOM элемента на странице
   *
   * @param node - DOM элемент у которого вычисляем позицию
   * @param offset - сдвиг относительно изначальной позиции
   *
   * @return{FazePosition} - позиция элемента
   */
  static getElementPosition(node: HTMLElement, offset: FazePosition = {x: 0, y: 0}): FazePosition {
    // Возвращаемый объект
    const position = {x: node.offsetLeft - offset.x, y: node.offsetTop - offset.y};

    // DOM элемент с которым производим действия
    let calculatedNode: HTMLElement = node;

    while (calculatedNode.offsetParent) {
      calculatedNode = calculatedNode.offsetParent as HTMLElement;
      position.x += calculatedNode.offsetLeft;
      position.y += calculatedNode.offsetTop;
      if (calculatedNode !== document.body && calculatedNode !== document.documentElement) {
        position.x -= calculatedNode.scrollLeft;
        position.y -= calculatedNode.scrollTop;
      }
    }

    return position;
  }

  /**
   * Определяет координаты и размер DOM элемента на странице
   * @param node{HTMLElement} - DOM элемент
   * @param sizeOffset{FazeSize} - сдвиг относительно изначального размера
   * @param positionOffset{FazePosition} - сдвиг относительно изначальной позиции
   *
   * @return{FazePositionAndSize} - Координаты и размеры DOM элемента на странице
   */
  static getElementPositionAndSize(
    node: HTMLElement,
    sizeOffset: FazeSize = {width: 0, height: 0},
    positionOffset: FazePosition = {x: 0, y: 0},
  ): FazePositionAndSize {
    return {
      size: {
        width: node.getBoundingClientRect().width + sizeOffset.width,
        height: node.getBoundingClientRect().height + sizeOffset.height,
      },
      position: this.getElementPosition(node, positionOffset),
    };
  }

  /**
   * Навешивание событий и управление перетаскиванием
   *
   * @param options{DragOptions} - настройки перетаскивания
   */
  static bindDrag(options: DragOptions): void {
    // Начальная позиция мыши
    const startMousePosition = {
      x: 0,
      y: 0,
    };

    // КОнечная позиция мыши
    const endMousePosition = {
      x: 0,
      y: 0,
    };

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      // Получение позиции курсора при нажатии на элемент
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Вызываем пользовательскую функцию
      if (typeof options.callbacks.beforeDrag === 'function') {
        try {
          options.callbacks.beforeDrag();
        } catch (error) {
          console.error('Ошибка исполнения пользовательского метода "beforeDrag":', error);
        }
      }

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: MouseEvent) => {
      event.preventDefault();

      // Рассчет новой позиции курсора
      endMousePosition.x = startMousePosition.x - event.clientX;
      endMousePosition.y = startMousePosition.y - event.clientY;
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Рассчет новой позиции
      if (options.node) {
        options.node.style.left = `${(parseInt(options.node.style.left, 10) - endMousePosition.x)}px`;
        options.node.style.top = `${(parseInt(options.node.style.top, 10) - endMousePosition.y)}px`;
      }

      // Вызываем пользовательскую функцию
      if (typeof options.callbacks.drag === 'function') {
        try {
          options.callbacks.drag();
        } catch (error) {
          console.error('Ошибка исполнения пользовательского метода "drag":', error);
        }
      }
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = () => {
      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);

      // Вызываем пользовательскую функцию
      if (typeof options.callbacks.afterDrag === 'function') {
        try {
          options.callbacks.afterDrag();
        } catch (error) {
          console.error('Ошибка исполнения пользовательского метода "afterDrag":', error);
        }
      }
    };

    // Навешиваем событие перетаскивания на элемент
    if (options.node) {
      options.node.addEventListener('mousedown', dragMouseDown);
    }
  }

  /**
   * Изменение изображение в DOM элементе после его фактической загрузки, при успешной загрузки возвращает размеры изображения
   *
   * @param source{string} - путь до нового изображения
   * @param node{HTMLImageElement} - DOM элемент у которого изменяем изображение
   *
   * @return{Promise<FazeSize>} - промис, который выполнится в случае загрузки изображения или ошибки
   */
  static changeImage(source: string, node: HTMLImageElement): Promise<FazeSize> {
    return new Promise<FazeSize>((resolve, reject) => {
      // Создаём экземпляр новой картинки
      const image = new Image();
      image.src = source;

      // При загрузке
      image.onload = () => {
        // Изменяем изображение у переданного элемента
        node.src = source;

        // Исполняем промис и возвращаем размеры изображения
        resolve({width: image.width, height: image.height});
      };

      // При ошибке
      image.onerror = (error: Event | string) => reject(error);
    });
  }
}

export default Helpers;
