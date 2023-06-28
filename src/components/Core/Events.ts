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
  static click(nodeOrSelector: HTMLElement | string, callback: (event: Event, node: HTMLElement | null) => void, isPreventDefault: boolean = true): void {
    // Проверяем, является ли переданный параметр строкой, если да,
    // то ищём соответствующий DOM элемент по селектору, если нет, используем напрямую
    let node: HTMLElement | null;
    if (typeof nodeOrSelector === 'string' || nodeOrSelector instanceof String) {
      node = document.querySelector(nodeOrSelector as string);
    } else {
      node = nodeOrSelector;
    }

    // Проверка на существование DOM элемента
    if (!node) {
      return;
    }

    // Навешиваем событие
    node.addEventListener('click', (event) => {
      if (isPreventDefault) {
        event.preventDefault();
      }

      // Исполняем пользовательскую функцию
      if (typeof callback === 'function') {
        callback(event, node);
      }
    });
  }
}

export default Events;
