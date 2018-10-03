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
}

export default Helpers;
