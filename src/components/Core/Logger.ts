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
   * @param {string} message Сообщение которое необходимо отобразить
   * @param {HTMLElement} node DOM элемент, если необходимо
   */
  warning(message: string, node: HTMLElement): void {
    const prefix = this.prefix ? `${this.prefix} ` : '';
    const postfix = this.postfix ? ` ${this.postfix}` : '';

    console.warn(`Faze: ${prefix}${message}${postfix}`, node || '');
  }

  /**
   * Вывод ошибки в консоль и выброс исключения
   *
   * @param {string} message Сообщение которое необходимо отобразить
   */
  error(message: string): never {
    const prefix = this.prefix ? `${this.prefix} ` : '';
    const postfix = this.postfix ? ` ${this.postfix}` : '';

    throw new Error(`Faze: ${prefix}${message}${postfix}`);
  }
}

export default Logger;
