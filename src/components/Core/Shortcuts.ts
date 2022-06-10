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

    // Редирект на другую страницу
    (window as any).fazeRedirect = (url: string) => {
      window.location.href = url;
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
        setTimeout(() => {
          // Если есть ссылку куда идти, то переходим на неё, если нет - то просто перезагружаем страницу
          if ('href' in result) {
            window.location.href = result.href;
          } else {
            window.location.reload();
          }
        }, 200);
      }
    };

    // Реагирование на результат формы создания КП
    (window as any).fazeOfferFormResult = (result: any) => {
      if ('offer' in result && 'href' in result.offer) {
        window.location.href = result.offer.href;
      }
    };
  }
}

export default Shortcuts;
