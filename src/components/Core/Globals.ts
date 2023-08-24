/**
 * Глобальные параметры необходимые для работы с CSS и JS кодом
 *
 * Автор: Ерохин Максим
 * Дата: 24.08.2023
 */

class Globals {
  /**
   * Инициализация
   */
  static initialize() {
    Globals.initializeScrollbarWidth();
  }

  /**
   * Инициализация ширины скроллбара браузера
   */
  private static initializeScrollbarWidth() {
    document.documentElement.style.setProperty('--faze-scrollbar-width', `${window.innerWidth - document.documentElement.clientWidth}px`);
  }
}

export default Globals;
