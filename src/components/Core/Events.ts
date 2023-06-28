/**
 * Класс для ускорения конечной разработки за счёт использования находящихся коротких функций,
 * которые делают всю шаблонную работу за нас
 */
class Events {
  /**
   * Навешивание событие клика на DOM элемент со всеми проверками
   *
   * @param node DOM элемент на который навешиваем событие
   * @param callback Пользовательская функция исполняющаяся после события
   * @param isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static click(node: HTMLElement, callback: (event: Event) => void, isPreventDefault: boolean = true): void {
    if (!node) {
      return;
    }

    node.addEventListener('click', (event) => {
      if (isPreventDefault) {
        event.preventDefault();
      }

      if (typeof callback === 'function') {
        callback(event);
      }
    });
  }
}

export default Events;
