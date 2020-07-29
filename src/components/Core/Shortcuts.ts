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

    // Реагирование на результат формы входа/выхода
    (window as any).fazeAuthFormResult = (result: any) => {
      if (result.error) {
        console.error('Ошибка в "fazeAuthFormResult": ', result.error);
      } else if (result.event === 'login' || result.event === 'logout') {
        setTimeout(function () {
          window.location.reload()
        }, 200);
      }
    };

    // Реагирование на результат формы создания КП
    (window as any).fazeOfferFormResult = (result: any) => {
      if ('offer' in result && 'href' in result.offer) {
        window.location.href = result.offer.href;
      }
    }
  }
}

export default Shortcuts;
