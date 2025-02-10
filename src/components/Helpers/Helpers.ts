import './Helpers.scss';
import Faze from '../Core/Faze';

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
 * Структура данных передаваемых в коллбеках драга
 *
 * Содержит:
 *   startPosition - стартовая позиция элемента
 *   event - событие
 *
 */
export interface DragCallbackData {
  startPosition: FazePosition;
  startMousePosition: FazePosition;
  endMousePosition: FazePosition;
  event: Event;
}

/**
 * Структура настроек метода для перетаскивания
 *
 * Содержит:
 *   node - DOM элемент, который перетаскиваем
 *   absolute - позиционируется ли элемент через "absolute"
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
    drag?: (data: DragCallbackData) => void;
    afterDrag?: (data: DragCallbackData) => void;
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

export interface DataParser {
  id: string | null;
  is: ((text: string) => boolean) | null;
  format: (text: string) => string | number;
  type: string;
}

class Helpers {
  /**
   * Инициализация методов, которые должны работать всегда, а не по указанию пользователя
   */
  static initialize(): void {
    Helpers.bindCopyText();
    Helpers.bindMobileMask();
  }

  static DataParsers: DataParser[] = [
    {
      id: 'digit',
      is: (text: string) => {
        const DECIMAL = '[\\.,\\s]';
        const exp =
          '/(^0$)|(^[+]?0(' +
          DECIMAL +
          '0+)?$)|(^([-+]?[1-9][0-9]*)$)|(^([-+]?((0?|[1-9][0-9]*)' +
          DECIMAL +
          '(0*[1-9][0-9]*)))$)|(^[-+]?[1-9]+[0-9]*' +
          DECIMAL +
          '0+$)|(^[-+]?[1-9][0-9]*[.,\\s][0-9]*[.,\\s][0-9]*$)/';

        text = text.replace(/ /g, '');
        return RegExp(exp).test(text.trim());
      },
      format: (text: string) => {
        return Helpers.formatFloat(text.replace(/ /g, '').replace(/,/g, '.'));
      },
      type: 'numeric',
    },
    {
      id: 'digitWithParentheses',
      is: (text: string) => {
        text = text.replace(/ /g, '');
        return /^\d+\(\d*\)$|^\d+[\.,\s]d*\(\d*\)$/.test(text.trim());
      },
      format: function (text: string) {
        text = text.replace(/ /g, '').replace(/,/g, '.');

        const number: RegExpMatchArray | null = text.match(
          /^(\d+)\(\d*\)$|^(\d+[\.,\s]d*)\(\d*\)$/
        );
        if (number) {
          return Helpers.formatFloat(number[0] || '0');
        } else {
          return 0;
        }
      },
      type: 'numeric',
    },
    {
      id: 'currency',
      is: (text: string) => {
        return /^[£$€₽元?.]|[£$€₽元]$/.test(text);
      },
      format: function (text: string) {
        return Helpers.formatFloat(
          text.replace(/,/g, '.').replace(new RegExp(/[^0-9.]/g), '')
        );
      },
      type: 'numeric',
    },
    {
      id: 'url',
      is: (text: string) => {
        return /^(https?|http?|ftp|file):\/\/$/.test(text);
      },
      format: (text: string) => {
        return text
          .trim()
          .replace(new RegExp(/(https?|http?|ftp|file):\/\//), '');
      },
      type: 'text',
    },
    {
      id: 'dayMonth',
      is: (text: string) => {
        return /^\d{1,2}[\.\/-]\d{1,2}$/.test(text);
      },
      format: (text: string) => {
        const date = text.match(/^(\d{1,2})[\.\/-](\d{1,2})$/);
        return Helpers.formatFloat(
          date && date.length === 3
            ? new Date(text.replace(new RegExp(/-/g), '/')).getTime().toString()
            : '0'
        );
      },
      type: 'numeric',
    },
    {
      id: 'isoDateTime',
      is: (text: string) => {
        return /^\d{4}[\.\/-]\d{1,2}[\.\/-]\d{1,2}\s*\d{2}:\d{2}/.test(text);
      },
      format: (text: string) => {
        const date = text.match(
          /^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})\s*\d{2}:\d{2}/
        );
        return Helpers.formatFloat(
          date && date.length === 4
            ? new Date(text.replace(new RegExp(/-/g), '/')).getTime().toString()
            : '0'
        );
      },
      type: 'numeric',
    },
    {
      id: 'isoDateTimeReverse',
      is: (text: string) => {
        return /^\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{4}\s*\d{2}:\d{2}/.test(text);
      },
      format: (text: string) => {
        const date = text.match(
          /^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})\s*(\d{2}):(\d{2})/
        );

        let dateString;
        if (date && date.length === 6) {
          dateString = `${date[3]}-${date[2]}-${date[1]} ${date[4]}:${date[5]}`;
        } else {
          dateString = '0';
        }

        return Helpers.formatFloat(
          date && date.length === 6
            ? new Date(dateString.replace(new RegExp(/-/g), '/'))
                .getTime()
                .toString()
            : '0'
        );
      },
      type: 'numeric',
    },
    {
      id: 'isoDate',
      is: (text: string) => {
        return /^\d{4}[\.\/-]\d{1,2}[\.\/-]\d{1,2}$/.test(text);
      },
      format: (text: string) => {
        const date = text.match(/^(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})$/);
        return Helpers.formatFloat(
          date && date.length === 4
            ? new Date(text.replace(new RegExp(/-/g), '/')).getTime().toString()
            : '0'
        );
      },
      type: 'numeric',
    },
    {
      id: 'isoDateReverse',
      is: (text: string) => {
        return /^\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{4}$/.test(text);
      },
      format: (text: string) => {
        const date = text.match(/^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})$/);

        let dateString;
        if (date && date.length === 4) {
          dateString = `${date[3]}-${date[2]}-${date[1]}`;
        } else {
          dateString = '0';
        }

        return Helpers.formatFloat(new Date(dateString).getTime().toString());
      },
      type: 'numeric',
    },
    {
      id: 'percent',
      is: (text: string) => {
        return /%$/.test(text.trim());
      },
      format: (text: string) => {
        return Helpers.formatFloat(text.replace(/ %/g, '').replace(/,/g, '.'));
      },
      type: 'numeric',
    },
    {
      id: 'month',
      is: (text: string) => {
        return Faze.Constants.MONTHS.includes(text.toLowerCase());
      },
      format: (text: string) => {
        return Faze.Constants.MONTHS.indexOf(text.toLowerCase());
      },
      type: 'numeric',
    },
    {
      id: 'text',
      is: () => {
        return true;
      },
      format: (text: string) => {
        return text.toLowerCase().trim();
      },
      type: 'text',
    },
  ];

  /**
   * Маска мобильного телефона для поля ввода
   */
  static bindMobileMask(): void {
    document
      .querySelectorAll<HTMLInputElement>('.faze-mask-mobile')
      .forEach((inputNode: HTMLInputElement) => {
        Helpers.mobileMask(inputNode);
      });
  }

  /**
   * Копирование текста(textContent) при нажатии на DOM элемент с классом "faze-copy-text"
   */
  static bindCopyText(): void {
    Faze.on(
      'click',
      '.faze-copy-text',
      (event: Event, textNode: HTMLElement) => {
        // Если есть что копировать
        if (textNode.textContent) {
          // Создаем инпут с этим текстом и позиционированием "absolute" чтобы вьюпорт не прыгал вниз
          const inputNode = document.createElement('textarea');
          inputNode.value =
            textNode.dataset.fazeCopyTextValue || textNode.textContent || '';
          inputNode.style.position = 'fixed';
          inputNode.style.top = `${(event as MouseEvent).clientY}px`;
          inputNode.style.left = `${(event as MouseEvent).clientX}px`;
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

          // Проставляем класс, что происходит действие
          textNode.classList.add('faze-active');

          // Через время удаляем
          setTimeout(() => {
            notificationNode.remove();

            // Удалем класс
            textNode.classList.remove('faze-active');
          }, 3000);
        }
      }
    );
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
      if (document.querySelector(`script[src="${url}"]`)) {
        return reject(
          `Faze.Helpers.loadJS: Скрипт "${url}" уже загружен на странице!`
        );
      }

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
   * @param cssClass  - CSS класс, который вешается на активный элемент, по умолчанию 'active'
   */
  static activateItem(
    array: HTMLElement[],
    index: number,
    cssClass: string = 'active'
  ): void {
    array.forEach((itemNode: HTMLElement, i: number) => {
      if (index === i) {
        itemNode.classList.add(cssClass);
      } else {
        itemNode.classList.remove(cssClass);
      }
    });
  }

  /**
   * Форматирование float при парсинге из текста
   *
   * @param text Текст содержащий число с плавающей точкой
   */
  static formatFloat(text: string): number {
    const result: number = parseFloat(text);
    return isNaN(result) ? 0 : result;
  }

  /**
   * Разделение трех знаком у числа пробелами, необходимо для форматирования цен в удобочитаемом для человека виде.
   * Если передали целое число, то есть которое не содержит точку, то просто разделяем по 3, если же передали число с плавающей точкой,
   * то форматируем у неё только левую часть, то есть ту которая до точки, после этого склеиваем обе части и возвращаем их.
   *
   * @param numberToFormat - число или строка содержащая число которое будет форматироваться
   * @param separator      - разделитель копеек
   *
   * @return строка разделенная пробелами каждые 3 символа
   */
  static numberWithSpaces(
    numberToFormat: number | string,
    separator: string = '.'
  ): string {
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

    input.addEventListener('focus', () => {
      // Проверка на пустую строку, если это так и пользователь нажимает не backspace то добавляется начало телефона
      if (value.length === 0) {
        value += '+7 (';
      }

      // Присваиваем собранный номер
      input.value = value;
    });

    input.addEventListener('input', (event: any) => {
      // Если это backspace то не удаляем дальше чем 3 символа
      if ('data' in event && !event.data) {
        value = value.slice(0, -1);

        if (value.length <= 4) {
          value = '+7 (';
        }
      } else if (
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(
          event.data
        ) &&
        value.length < 18
      ) {
        // Добавление цифры, проверка на цифры и что номер меньше 18 знаков(включая -, ( и ))
        value += event.data;
        if (value.length === 7) {
          value += ') ';
        } else if (value.length === 12 || value.length === 15) {
          value += '-';
        }
      }
      // Если это номер телефона
      else if (event.data.startsWith('+7') || event.data.startsWith('8')) {
        const phone: string = event.data.replace(/-|\(|\)|\s+|^\+7|^8/g, '');

        const matches = phone.match(/(\d{3})(\d{3})?(\d{2})?(\d{2})?/);
        if (matches) {
          value = `+7 (${matches[1]})${matches[2] ? ` ${matches[2]}` : ''}${
            matches[3] ? `-${matches[3]}` : ''
          }${matches[4] ? `-${matches[4]}` : ''}`;
        }
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
    const className = options?.className || '';
    const isNested = options?.isNested || true;
    const time = options?.time || 3000;
    const backgroundColor = options?.backgroundColor || '#00b938';

    // DOM элемент обертки для информационнах сообщений, она нужна для того, чтобы сообщения шли друг под другом, если их несколько
    let notificationWrapperNode: HTMLDivElement | null = document.querySelector(
      '.faze-notification-wrapper'
    );

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
      if (
        notificationWrapperNode &&
        notificationWrapperNode.querySelectorAll('.faze-notification')
          .length === 0
      ) {
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
  static wordEnd(
    quantity: number,
    endings: string[] = ['', 'а', 'ов']
  ): string {
    const cases: number[] = [2, 0, 1, 1, 1, 2];
    return endings[
      quantity % 100 > 4 && quantity % 100 < 20
        ? 2
        : cases[quantity % 10 < 5 ? quantity % 10 : 5]
    ];
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
  static secondsToTime({
    totalSeconds = 0,
    showEmpty = false,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
  } = {}): string {
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
      resultTime += `${minutes} минут${Helpers.wordEnd(minutes, [
        'а',
        'ы',
        '',
      ])} `;
    }

    if ((seconds !== 0 || showEmpty) && showSeconds) {
      resultTime += `${seconds} секунд${Helpers.wordEnd(seconds, [
        'а',
        'ы',
        '',
      ])}`;
    }

    return resultTime;
  }

  /**
   * Определяет, выбран ли чекбокс
   *
   * @param name        - имя чекбокса
   * @param parentNode  - DOM элемент родителя, по умолчанию ищем везде, то есть document
   */
  static isCheckboxChecked(
    name: string,
    parentNode: HTMLElement | Document = document
  ): boolean {
    return (
      parentNode.querySelectorAll('input[type="checkbox"]:checked').length > 0
    );
  }

  /**
   * Определяет, выбрана ли радио кнопка
   *
   * @param name        - имя чекбокса
   * @param parentNode  - DOM элемент родителя, по умолчанию ищем везде, то есть document
   */
  static isRadioChecked(
    name: string,
    parentNode: HTMLElement | Document = document
  ): boolean {
    return (
      parentNode.querySelectorAll('input[type="radio"]:checked').length > 0
    );
  }

  /**
   * Запись куки
   *
   * @param name - Имя куки
   * @param value - Значение куки
   * @param expiresInDays - Время жизни в днях
   * @param encode - Нужно ли кодировать значение
   */
  static setCookie(
    name: string,
    value: string,
    expiresInDays?: number,
    encode: boolean = false
  ): void {
    let expires: string = '';
    if (expiresInDays) {
      const date: Date = new Date();
      date.setTime(date.getTime() + expiresInDays * 86400000);
      expires = `;expires=${date.toUTCString()}`;
    }

    document.cookie = `${name}=${
      encode ? encodeURIComponent(value) : value
    }${expires};path=/`;
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
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Ищет значение в объекте по указаному пути
   *
   * @param obj Объект в котором ищем путь
   * @param path Путь до значения
   * @param initial Значение по умолчанию, если не нашли по пути искомое
   *
   * @returns Искомое значение, либо значение по умолчанию
   */
  static resolvePath(obj: object, path: string, initial: any): object {
    return path.split('.').reduce((o: any, p) => (o ? o[p] : initial), obj);
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
  static mergeDeep(
    arraysReplace: boolean,
    target: any,
    ...sources: any[]
  ): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (Helpers.isObject(target) && Helpers.isObject(source)) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (Helpers.isObject(source[key])) {
            if (!target[key]) {
              Object.assign(target, { [key]: {} });
            }

            Helpers.mergeDeep(arraysReplace, target[key], source[key]);
          } else {
            // Если это массив или содержит служебный ключ "__id", то необходимо произвести объединение
            if (
              Array.isArray(target[key]) ||
              (source[key] &&
                source[key][0] &&
                source[key][0].__group !== undefined)
            ) {
              // Если значение не задано, создаем пустой массив и пушим в него первый элемент
              if (!target[key]) {
                target[key] = [];
                target[key].push(...source[key]);
              }

              // Если содержит служебный ключ "__group"
              if (source[key][0].__group !== undefined) {
                // Ищем элемент у которого уже есть такая группа
                const foundElement = target[key].find(
                  (targetObject: any) =>
                    targetObject.__group === source[key][0].__group
                );

                // Определяем индекс найденного элемента
                const foundIndex = target[key].indexOf(foundElement);

                // Если элемент в массиве не нашли, то необходимо добавить новый элемент в массив
                if (foundIndex === -1) {
                  target[key].push(source[key][0]);
                } else {
                  // Если нашли, то объединяем объекты этого элемента с новым
                  target[key][foundIndex] = {
                    ...foundElement,
                    ...source[key][0],
                  };
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
              Object.assign(target, { [key]: source[key] });
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
  static objectFromString(
    jsonObject: any,
    stringData: string,
    key: string,
    value: string,
    arrayGroup = 'default'
  ): object {
    jsonObject ||= {};

    // Разбиваем строку на токены, при этом фильтруя на пустоту токена, т.к. если мы пытаемся разделить пустую строку, "split" вернет
    // массив у которого 1 пустой элемент, а это некорректно в данном случае.
    const objectTokens: string[] = stringData
      .split('.')
      .filter((token) => token.length !== 0);

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
        ref[clearArrayKey.split('.')[0]] = [
          {
            __group: arrayGroup,
            [objectArrayName]: value,
          },
        ];
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
  static isMouseOver(
    event: MouseEvent | TouchEvent,
    itemNode: HTMLElement,
    calculateSides: { vertical: boolean; horizontal: boolean } = {
      vertical: false,
      horizontal: false,
    }
  ): MouseOverResult {
    // DOMRect текущего элемента
    const itemRect = itemNode.getBoundingClientRect();

    // Получаем координаты касания/нажатия
    let { x, y } = this.getMouseOrTouchPosition(event);

    // Объект с результатами проверки
    const result: MouseOverResult = {
      contains:
        x > itemRect.left &&
        x < itemRect.left + itemRect.width &&
        y > itemRect.top &&
        y < itemRect.top + itemRect.height,
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
      const isInsideHorizontally =
        x > itemRect.left && x < itemRect.left + itemRect.width;

      // Проверяем на вхождение в верхнюю часть
      result.sides.top =
        y > itemRect.top &&
        y < itemRect.top + halfHeight &&
        isInsideHorizontally;

      // Проверяем на вхождение в нижнюю часть
      result.sides.bottom =
        y > itemRect.top + halfHeight &&
        y < itemRect.top + itemRect.height &&
        isInsideHorizontally;
    }

    // Вычисляем входы в горизонтальном направлении(верх и низ)
    if (calculateSides.horizontal) {
      // Половина высоты
      const halfWidth = itemRect.width / 2;

      // Проверяем внутри ли мышь по горизонтали
      const isInsideVertically =
        y > itemRect.top && y < itemRect.top + itemRect.height;

      // Проверяем на вхождение в верхнюю часть
      result.sides.left =
        x > itemRect.left &&
        x < itemRect.left + halfWidth &&
        isInsideVertically;

      // Проверяем на вхождение в нижнюю часть
      result.sides.right =
        x > itemRect.left + halfWidth &&
        x < itemRect.left + itemRect.width &&
        isInsideVertically;
    }

    return result;
  }

  /**
   * Получение позиции мыши или пальца на экране
   *
   * @param event{MouseEvent | TouchEvent} Событие мыши или пальца
   *
   * @return{FazePosition} Позиция на экране
   */
  static getMouseOrTouchPosition(event: MouseEvent | TouchEvent): FazePosition {
    const position: FazePosition = {
      x: 0,
      y: 0,
    };
    if (event instanceof MouseEvent) {
      position.x = event.clientX;
      position.y = event.clientY;
    } else {
      position.x = event.changedTouches[0].clientX;
      position.y = event.changedTouches[0].clientY;
    }

    return position;
  }

  /**
   * Проверка, находится ли курсор на искомом DOM элементе
   *
   * @param event{Event} Событие мыши
   * @param node{HTMLElement} Искомый DOM элемент
   */
  static isMouseOverlapsNode(event: Event, node: HTMLElement): boolean {
    const path =
      (<any>event).path || (event.composedPath && event.composedPath());
    if (path) {
      if (path.find((element: HTMLElement) => element === node)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Проверка, находится ли курсор на искомых DOM элементах
   *
   * @param event{Event} Событие мыши
   * @param nodes{HTMLElement[]} Искомые DOM элементы
   */
  static isMouseOverlapsNodes(event: Event, nodes: HTMLElement[]): boolean {
    const path =
      (<any>event).path || (event.composedPath && event.composedPath());
    if (
      path &&
      path.find((element: HTMLElement) =>
        Array.from(nodes).some((node) => node === element)
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Присваивание стилей DOM Элементу
   *
   * @param node    - DOM элемент которому присваиваем
   * @param styles  - стили которые присваиваем
   */
  static setElementStyle(node: HTMLElement, styles: FazeObject): void {
    for (const style in styles) {
      node.style[style as any] = styles[style];
    }
  }

  /**
   * Присваивание атрибутов DOM элементу
   *
   * @param node        - DOM элемент которому присваиваем
   * @param attributes  - атрибуты которые присваиваем
   */
  static setElementAttributes(node: HTMLElement, attributes: FazeObject) {
    for (const attribute in attributes) {
      node.setAttribute(attribute, attributes[attribute]);
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
  static createElement(
    tag: string,
    attributes?: FazeObject,
    styles?: FazeObject,
    parent?: HTMLElement,
    className?: string
  ): HTMLElement {
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

    if (className) {
      node.className = className;
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
  static getElementPosition(
    node: HTMLElement,
    offset: FazePosition = {
      x: 0,
      y: 0,
    }
  ): FazePosition {
    // Возвращаемый объект
    const position = {
      x: node.offsetLeft - offset.x,
      y: node.offsetTop - offset.y,
    };

    // DOM элемент с которым производим действия
    let calculatedNode: HTMLElement = node;

    while (calculatedNode.offsetParent) {
      calculatedNode = calculatedNode.offsetParent as HTMLElement;
      position.x += calculatedNode.offsetLeft;
      position.y += calculatedNode.offsetTop;
      if (
        calculatedNode !== document.body &&
        calculatedNode !== document.documentElement
      ) {
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
    sizeOffset: FazeSize = {
      width: 0,
      height: 0,
    },
    positionOffset: FazePosition = {
      x: 0,
      y: 0,
    }
  ): FazePositionAndSize {
    return {
      size: {
        width: node.getBoundingClientRect().width + sizeOffset.width,
        height: node.getBoundingClientRect().height + sizeOffset.height,
      },
      position: this.getElementPosition(node, positionOffset),
    };
  }

  static getElementRealSize(
    node: HTMLElement,
    childSelector?: string
  ): FazeSize {
    const cloneNode: HTMLElement = node.cloneNode(true) as HTMLElement;
    cloneNode.style.cssText = 'position:fixed; top:-9999px; opacity:0;';
    document.body.appendChild(cloneNode);

    const size: FazeSize = {
      width: 0,
      height: 0,
    };

    // Если указан CSS селектор дочернего элемента, берём его размер
    if (childSelector) {
      const childNode: HTMLElement | null =
        cloneNode.querySelector(childSelector);
      if (childNode) {
        size.width = childNode.clientWidth;
        size.height = childNode.clientHeight;
      }
    } else {
      // Иначе берем данные главного DOM элемента
      size.width = cloneNode.clientWidth;
      size.height = cloneNode.clientHeight;
    }

    // Удаляем DOM элемент
    cloneNode.parentNode?.removeChild(cloneNode);

    return size;
  }

  /**
   * Навешивание событий и управление перетаскиванием
   *
   * @param options{DragOptions} - настройки перетаскивания
   */
  static bindDrag(options: DragOptions): void {
    // Начальное положение DOM элемента
    let startPosition = {
      x: 0,
      y: 0,
    };

    // Начальная позиция мыши
    const startMousePosition = {
      x: 0,
      y: 0,
    };

    // Конечная позиция мыши
    const endMousePosition = {
      x: 0,
      y: 0,
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: MouseEvent) => {
      if (!options.node) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Рассчет новой позиции курсора
      endMousePosition.x = startMousePosition.x - event.clientX;
      endMousePosition.y = startMousePosition.y - event.clientY;
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Расчёт новой позиции
      options.node.style.left = `${
        parseInt(options.node.style.left, 10) - endMousePosition.x
      }px`;
      options.node.style.top = `${
        parseInt(options.node.style.top, 10) - endMousePosition.y
      }px`;

      // Вызываем пользовательскую функцию
      if (
        options.callbacks &&
        'drag' in options.callbacks &&
        typeof options.callbacks.drag === 'function'
      ) {
        try {
          options.callbacks.drag({
            startPosition,
            startMousePosition,
            endMousePosition,
            event,
          });
        } catch (error) {
          console.error(
            'Ошибка исполнения пользовательского метода "drag":',
            error
          );
        }
      }
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши), удаляем все слушатели, т.к. они создаются при каждом новом перетаскивании
     */
    const endDragElement = (event: MouseEvent) => {
      if (!options.node) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);

      // Удаляем класс, что двигаем элемент
      options.node.classList.remove('faze-drag-active');

      // Вызываем пользовательскую функцию
      if (
        options.callbacks &&
        'afterDrag' in options.callbacks &&
        typeof options.callbacks.afterDrag === 'function'
      ) {
        try {
          options.callbacks.afterDrag({
            startPosition,
            startMousePosition,
            endMousePosition,
            event,
          });
        } catch (error) {
          console.error(
            'Ошибка исполнения пользовательского метода "afterDrag":',
            error
          );
        }
      }
    };

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      if (!options.node) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Получаем начальную позицию DOM элемента
      startPosition = {
        x: parseInt(options.node.style.left, 10),
        y: parseInt(options.node.style.top, 10),
      };

      // Проставляем класс, что двигаем элемент
      options.node.classList.add('faze-drag-active');

      // Получение позиции курсора при нажатии на элемент
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Вызываем пользовательскую функцию
      if (
        options.callbacks &&
        'beforeDrag' in options.callbacks &&
        typeof options.callbacks.beforeDrag === 'function'
      ) {
        try {
          options.callbacks.beforeDrag();
        } catch (error) {
          console.error(
            'Ошибка исполнения пользовательского метода "beforeDrag":',
            error
          );
        }
      }

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);
    };

    // Навешиваем событие перетаскивания на элемент
    options.node?.addEventListener('mousedown', dragMouseDown);
  }

  /**
   * Изменение изображение в DOM элементе после его фактической загрузки, при успешной загрузки возвращает размеры изображения
   *
   * @param source{string} - путь до нового изображения
   * @param node{HTMLImageElement} - DOM элемент у которого изменяем изображение
   *
   * @return{Promise<FazeSize>} - промис, который выполнится в случае загрузки изображения или ошибки
   */
  static changeImage(
    source: string,
    node: HTMLImageElement
  ): Promise<FazeSize> {
    return new Promise<FazeSize>((resolve, reject) => {
      // Создаём экземпляр новой картинки
      const image = new Image();
      image.src = source;

      // При загрузке
      image.onload = () => {
        // Изменяем изображение у переданного элемента
        node.src = source;

        // Исполняем промис и возвращаем размеры изображения
        resolve({
          width: image.width,
          height: image.height,
        });
      };

      // При ошибке
      image.onerror = (error: Event | string) => reject(error);
    });
  }

  /**
   * Приведение объекта позиции и размера к виду {string: string} с соответствующими именами для обработки в стили
   *
   * @param positionAndSize{FazePositionAndSize} - объект позиции и размера
   *
   * @return{FazeObject} - объект с собранными CSS стилями
   */
  static fromPositionAndSizeToStyles(
    positionAndSize: FazePositionAndSize
  ): FazeObject {
    // Собираем стили в переменную
    const result: FazeObject = {};

    // Размеры
    result.width = `${positionAndSize.size.width}px`;
    result.height = `${positionAndSize.size.height}px`;

    // Позиция
    result.left = `${positionAndSize.position.x}px`;
    result.top = `${positionAndSize.position.y}px`;

    return result;
  }

  /**
   * Приведение объекта позиции к виду {string: string} с соответствующими именами для обработки в стили
   *
   * @param position{FazePosition} - объект позиции
   *
   * @return{FazeObject} - объект с собранными CSS стилями
   */
  static fromPositionToStyles(position: FazePosition): FazeObject {
    // Собираем стили в переменную
    const result: FazeObject = {};

    // Позиция
    result.left = `${position.x}px`;
    result.top = `${position.y}px`;

    return result;
  }

  /**
   * Приведение объекта размеров к виду {string: string} с соответствующими именами для обработки в стили
   *
   * @param size{FazeSize} - объект позиции
   *
   * @return{FazeObject} - объект с собранными CSS стилями
   */
  static fromSizeToStyles(size: FazeSize): FazeObject {
    // Собираем стили в переменную
    const result: FazeObject = {};

    // Размеры
    result.width = `${size.width}px`;
    result.height = `${size.height}px`;

    return result;
  }

  /**
   * Сравнение двух позиций
   *
   * @param position1{FazePosition} - позиция 1
   * @param position2{FazePosition} - позиция 2
   *
   * @return{boolean} - истина, если позиции равны
   */
  static comparePositions(
    position1: FazePosition,
    position2: FazePosition
  ): boolean {
    return position1.x === position2.x && position1.y === position2.y;
  }

  /**
   * Сравнение двух размеров
   *
   * @param size1{FazeSize} - размер 1
   * @param size2{FazeSize} - размер 2
   *
   * @return{boolean} - истина, если размеры равны
   */
  static compareSizes(size1: FazeSize, size2: FazeSize): boolean {
    return size1.width === size2.width && size1.height === size2.height;
  }

  /**
   * Проверка, видимый ли элемент
   *
   * @param {HTMLElement} node DOM элемент который проверяем
   */
  static isElementVisible(node: HTMLElement): boolean {
    return (
      window.getComputedStyle(node).display !== 'none' &&
      (!node.parentNode ||
        node === document.body ||
        this.isElementVisible(node.parentNode as HTMLElement))
    );
  }

  /**
   * Проверка, находится ли элемент во вьюпорте
   *
   * @param {HTMLElement} node DOM элемент который проверяем
   * @param {number} offset Дополнительный запас
   * @param {boolean} enableWhenOnTop Возвращаеть "true" если элемент выше вьюпорта
   *
   * @return {boolean} - true если элемент находится во вьюпорте
   */
  static isElementInViewport(
    node: HTMLElement,
    offset: number = 0,
    enableWhenOnTop: boolean = false
  ): boolean {
    const rect: DOMRect = node.getBoundingClientRect();
    var scrollX: number = window.scrollX;
    var scrollY: number = window.scrollY;
    var top: number = rect.top;
    var left: number = rect.left;

    return (
      top + scrollY + offset >= scrollY &&
      top + scrollY + offset <= scrollY + window.innerHeight &&
      left + scrollX + offset >= scrollX &&
      left + scrollX + offset <= scrollX + window.innerWidth
    );
  }

  /**
   * Проверка, находится ли элементы во вьюпорте
   *
   * @param nodes{HTMLElement[]} - DOM элементы которые проверяем
   * @param offset{number} - дополнительный запас
   * @param enableWhenOnTop{boolean} - возвращаеть "true" если элемент выше вьюпорта
   *
   * @return{HTMLElement[]} - список DOM элементов которые находятся во вьюпорте
   */
  static isElementsInViewport(
    nodes: HTMLElement[],
    offset: number = 0,
    enableWhenOnTop: boolean = false
  ): HTMLElement[] {
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;

    return Array.from(nodes).filter((node) => {
      const rect = node.getBoundingClientRect();
      var top: number = rect.top;
      var left: number = rect.left;

      return (
        top - offset <= windowHeight &&
        (enableWhenOnTop ? true : top + rect.height >= 0) &&
        left - offset <= windowWidth &&
        (enableWhenOnTop ? true : left + rect.width >= 0)
      );
    });
  }

  /**
   * Транслитерация текста
   *
   * @param text{string} Текст для транслитерации
   *
   * @return{string} Текст после транслитерации
   */
  static transliterate(text: string): string {
    // Словарь букв и их транслитерации
    const dictionary: { [key: string]: string } = {
      Ё: 'YO',
      Й: 'I',
      Ц: 'TS',
      У: 'U',
      К: 'K',
      Е: 'E',
      Н: 'N',
      Г: 'G',
      Ш: 'SH',
      Щ: 'SCH',
      З: 'Z',
      Х: 'H',
      Ъ: "'",
      ё: 'yo',
      й: 'i',
      ц: 'ts',
      у: 'u',
      к: 'k',
      е: 'e',
      н: 'n',
      г: 'g',
      ш: 'sh',
      щ: 'sch',
      з: 'z',
      х: 'h',
      ъ: "'",
      Ф: 'F',
      Ы: 'I',
      В: 'V',
      А: 'a',
      П: 'P',
      Р: 'R',
      О: 'O',
      Л: 'L',
      Д: 'D',
      Ж: 'ZH',
      Э: 'E',
      ф: 'f',
      ы: 'i',
      в: 'v',
      а: 'a',
      п: 'p',
      р: 'r',
      о: 'o',
      л: 'l',
      д: 'd',
      ж: 'zh',
      э: 'e',
      Я: 'Ya',
      Ч: 'CH',
      С: 'S',
      М: 'M',
      И: 'I',
      Т: 'T',
      Ь: "'",
      Б: 'B',
      Ю: 'YU',
      я: 'ya',
      ч: 'ch',
      с: 's',
      м: 'm',
      и: 'i',
      т: 't',
      ь: "'",
      б: 'b',
      ю: 'yu',
    };

    var result = '';
    for (var i = 0; i < text.length; i++) {
      result += dictionary[text[i]];
    }
    return result;
  }

  /**
   * Парсинг JSON с отловом ошибок
   *
   * @param text{string} Текст нераспаршенного JSONа
   *
   * @return{object} Готовый JS объект
   */
  static parseJSON(text?: string): object {
    if (
      !text ||
      text.trim() === '' ||
      text === 'null' ||
      text === 'undefined'
    ) {
      return {};
    }

    let data: object = {};
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error(error);
    }

    return data;
  }

  /**
   * Проверка, валиден ли селектор, то есть имеет ли он хоть одну ноду при выборке
   *
   * @param selector{string} CSS селектор по которому выбираем
   */
  static isSelectorValid(selector: string): boolean {
    try {
      document.createDocumentFragment().querySelector(selector);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Навешивание нескольких событий на DOM элемент
   *
   * @param node{HTMLElement} DOM элемент на который навешиваем событие
   * @param events{string[]} Список событий
   * @param callback{(event: Event) => void} Пользовательская функция, которая выполнится после срабатывания события
   */
  static addEventListeners(
    node: HTMLElement,
    events: string[],
    callback: (event: Event) => void
  ): void {
    events.forEach((eventName: string) => {
      node.addEventListener(eventName, (event: Event) => {
        callback(event);
      });
    });
  }

  /**
   * Находит и возвращает склонение слова
   *
   * @param value {number} Количество
   * @param words {string[]} Склонения слова
   * @returns {string} Нужную форму склонения слова
   */
  static declOfNum(value: number, words: string[]): string {
    return words[
      value % 100 > 4 && value % 100 < 20
        ? 2
        : [2, 0, 1, 1, 1, 2][value % 10 < 5 ? Math.abs(value) % 10 : 5]
    ];
  }

  /**
   * Проверка инпута на выход из границ, указанных в его атрибутах(min, max)
   *
   * @param {HTMLInputElement} node DOM элемент инпута который проверяем
   */
  static checkInputBounds(node: HTMLInputElement): void {
    const value: number = parseInt(node.value);
    const min: number = parseInt(node.min);
    const max: number = parseInt(node.max);

    if (value > max) {
      node.value = max.toString();
    } else if (value < min) {
      node.value = min.toString();
    }
  }
}

export default Helpers;
