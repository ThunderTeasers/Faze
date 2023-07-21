/**
 * Класс для ускорения конечной разработки за счёт использования находящихся коротких функций,
 * которые делают всю шаблонную работу за нас
 */
class Events {
  /**
   * Навешивание событие клика на DOM элемент со всеми проверками
   *
   * @param nodeOrSelector DOM элемент на который навешиваем событие или его CSS селектор
   * @param callback Пользовательская функция исполняющаяся после события
   * @param isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static click(nodeOrSelector: HTMLElement | string, callback: (event: Event, node: HTMLElement | null) => void, isPreventDefault: boolean = true): void {
    this.listener('click', nodeOrSelector, callback, isPreventDefault);
  }

  /**
   * Навешивание событие на DOM элемент со всеми проверками
   *
   * @param type Тип события
   * @param nodeOrSelector DOM элемент на который навешиваем событие или его CSS селектор
   * @param callback Пользовательская функция исполняющаяся после события
   * @param isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static listener(type: string, nodeOrSelector: HTMLElement | string, callback: (event: Event, node: HTMLElement | null) => void, isPreventDefault: boolean = true): void {
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
    node.addEventListener(type, (event) => {
      if (isPreventDefault) {
        event.preventDefault();
      }

      // Исполняем пользовательскую функцию
      if (typeof callback === 'function') {
        callback(event, node);
      }
    });
  }

  /**
   * Навешивание событие на массив DOM элементов со всеми проверками
   *
   * @param type Тип события
   * @param nodesOrSelector DOM элементы на которые навешиваем событие или его CSS селектор
   * @param callback Пользовательская функция исполняющаяся после события
   * @param isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static forEach(type: string, nodesOrSelector: HTMLElement[] | string, callback: (event: Event, node: HTMLElement | null) => void, isPreventDefault: boolean = true): void {
    // Проверяем, является ли переданный параметр строкой, если да,
    // то ищём соответствующий DOM элемент по селектору, если нет, используем напрямую
    let nodes: HTMLElement[];
    if (typeof nodesOrSelector === 'string' || nodesOrSelector instanceof String) {
      nodes = [...document.querySelectorAll<HTMLElement>(nodesOrSelector as string)];
    } else {
      nodes = nodesOrSelector;
    }

    // Проверка на существование DOM элементов
    if (nodes.length === 0) {
      return;
    }

    // Навешиваем события на все элементы в массиве
    nodes.forEach((node) => {
      this.listener(type, node, callback, isPreventDefault);
    });
  }
}

export default Events;
