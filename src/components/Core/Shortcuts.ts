/**
 * Функции и сокращения для быстрой работы с фреймворком
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 21.02.2019
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

    // Перезагрузка страницы
    (window as any).fazePageReload = () => {
      window.location.reload();
    };
  }
}

export default Shortcuts;
