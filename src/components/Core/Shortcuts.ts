/**
 * Функции и сокращения для быстрой работы с фреймворком
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 21.02.2019
 *
 */
class Shortcuts {
  /**
   * Инициализация
   */
  static initialize() {
    // Закрытие модальных окон
    (window as any).fazeModalClose = () => {
      document.querySelectorAll('.faze-close').forEach((closeButtonNode) => {
        closeButtonNode.dispatchEvent(new Event('click'));
      });
    };
  }
}

export default Shortcuts;
