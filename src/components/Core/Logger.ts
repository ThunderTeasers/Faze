/**
 * Класс для упрощения логирования и вывода ошибок в консоль
 *
 * Автор: Ерохин Максим
 * Дата: 08.03.2019
 */
class Logger {
  // То что будет приписываться до текста
  readonly prefix: string;

  // То что будет приписываться после текста
  readonly postfix: string;

  constructor(prefix: string = '', postfix: string = '') {
    this.prefix = prefix;
    this.postfix = postfix;
  }

  /**
   * Вывод предупреждения в консоль
   *
   * @param message - сообщение которое необходимо отобразить
   * @param node    - DOM элемент, если необходимо
   */
  warning(message: string, node: HTMLElement): void {
    console.warn(`${this.prefix} ${message} ${this.postfix}`, node || '');
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
