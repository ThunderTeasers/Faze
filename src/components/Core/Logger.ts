/**
 * Класс для упрощения логирования и вывода ошибок в консоль
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 08.03.2019
 */
class Logger {
  // То что будет приписываться до текста
  prefix: string;

  // То что будет приписываться после текста
  postfix: string;

  constructor(prefix: string = '', postfix: string = '') {
    this.prefix = prefix;
    this.postfix = postfix;
  }

  /**
   * Вывод ошибки в консоль и выброс исключения
   *
   * @param message - сообщение которое необходимо отобразить
   */
  error(message: string): never {
    throw new Error(`${this.prefix} ${message} ${this.postfix}`);
  }
}

export default Logger;
