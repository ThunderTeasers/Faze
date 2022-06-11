class URL {
  /**
   * Метод удаляет заданный GET параметр из URL и совершает переход по новому адресу
   *
   * @param param Параметр который удаляем из URL
   * @param historyMode Используем ли HTML5 history mode
   */
  static removeParam(param: string, historyMode: boolean = false): void {
    // Текущие параметры
    const params: URLSearchParams = new URLSearchParams(window.location.search);

    // Если искомого параметра нет, то выходим из метода
    if (!params.has(param)) {
      return;
    }

    // Удаляем параметр
    params.delete(param);

    // Собираем новый URL
    let url = `${window.location.origin}${window.location.pathname}`;
    if (Array.from(params.keys()).length) {
      url += `?${params.toString()}`;
    }

    // Совершаем переход в зависимости от флага, либо просто редирект, либо через HTML5 history
    if (historyMode) {
      window.history.pushState({}, '', url);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Добавление параметра существующему URL
   *
   * @param name{string} Имя параметра
   * @param value{string} Значение параметра
   * @param url{string} URL к которому добавляем параметр
   */
  static addParamToURL(name: string, value: string, url: string): string {
    let result: string = url;

    if (url.includes('?')) {
      if (url.endsWith('&')) {
        result += `${name}=${value}`;
      } else {
        result += `&${name}=${value}`;
      }
    } else {
      result += `?${name}=${value}`;
    }

    return result;
  }
}

export default URL;
