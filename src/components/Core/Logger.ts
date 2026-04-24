/**
 * Класс для упрощения логирования и вывода ошибок в консоль
 *
 * Автор: Ерохин Максим
 * Дата: 08.03.2019
 */
class Logger {
  // То что будет приписываться до текста
  readonly moduleName: string;

  constructor(moduleName: string = '') {
    this.moduleName = moduleName;
  }

  /**
   * Вывод предупреждения в консоль
   *
   * @param {string} method Название метода, откуда вызываем предупреждение
   * @param {string} message Сообщение которое необходимо отобразить
   * @param {HTMLElement} node DOM элемент, если необходимо
   */
  warning(method: string, message: string, node: HTMLElement): void {
    console.warn(`[Faze.${this.moduleName}.${method}]: ${message}`, node || '');
  }

  /**
   * Вывод ошибки в консоль и выброс исключения
   *
   * @param {string} method Название метода, откуда вызываем ошибку
   * @param {string} message Сообщение которое необходимо отобразить
   */
  error(method: string, message: string): never {
    throw new Error(`[Faze.${this.moduleName}.${method}()]: ${message}`);
  }
}

export default Logger;
