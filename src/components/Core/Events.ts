/**
 * Класс для ускорения конечной разработки за счёт использования находящихся коротких функций,
 * которые делают всю шаблонную работу за нас
 */
class Events {
  /**
   * Навешивание событие клика на DOM элемент со всеми проверками
   *
   * @param {HTMLElement | string} nodeOrSelector DOM элемент на который навешиваем событие или его CSS селектор
   * @param {(event: Event, node: HTMLElement | null)} callback Пользовательская функция исполняющаяся после события
   * @param {boolean} isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static click(nodeOrSelector: HTMLElement | HTMLElement[] | string, callback: (event: Event, node: HTMLElement | null) => void, isPreventDefault: boolean = true): void {
    this.listener('click', nodeOrSelector, callback, isPreventDefault);
  }

  /**
   * Навешивание событие на DOM элемент со всеми проверками
   *
   * @param {string | string[]} types Типы события
   * @param {HTMLElement | HTMLElement[] | string} nodeOrSelector DOM элемент(ы) на который навешиваем событие или его CSS селектор
   * @param {(event: Event, node: HTMLElement | null, nodes: HTMLElement[] | null, index: number)} callback Пользовательская функция исполняющаяся после события
   * @param {boolean} isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static listener(types: string | string[], nodeOrSelector: HTMLElement | HTMLElement[] | string, callback: (event: Event, node: HTMLElement | null, nodes: HTMLElement[] | null, index: number) => void, isPreventDefault: boolean = true): void {
    // Проверяем, является ли переданный параметр строкой, если да,
    // то ищём соответствующий DOM элемент по селектору, если нет,
    // проверяем массив ли это и действуем в соответствии с этим
    let nodes: HTMLElement[];
    if (typeof nodeOrSelector === 'string' || nodeOrSelector instanceof String) {
      nodes = [...document.querySelectorAll<HTMLElement>(nodeOrSelector as string)];
    } else if (Array.isArray(nodeOrSelector) || nodeOrSelector instanceof NodeList) {
      nodes = [...(nodeOrSelector as HTMLElement[])];
    } else {
      nodes = [nodeOrSelector];
    }

    // Если это не массив, то превращаем в него
    if (!Array.isArray(types)) {
      types = [types];
    }

    // Навешиваем событие
    types.forEach((type: string) => {
      nodes.forEach((node: HTMLElement, index: number) => {
        node?.addEventListener(type, (event) => {
          if (isPreventDefault) {
            event.preventDefault();
          }

          // Исполняем пользовательскую функцию
          if (typeof callback === 'function') {
            callback(event, node, nodes, index);
          }
        });
      });
    });
  }

  /**
   * Навешивание событие на массив DOM элементов со всеми проверками
   *
   * @param {string | string[]} types Тип события
   * @param {HTMLElement | string} nodesOrSelector DOM элементы на которые навешиваем событие или его CSS селектор
   * @param {(event: Event, node: HTMLElement | null)} callback Пользовательская функция исполняющаяся после события
   * @param {boolean} isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static forEach(types: string | string, nodesOrSelector: HTMLElement[] | string, callback: (event: Event, node: HTMLElement | null, index: number) => void, isPreventDefault: boolean = true): void {
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
    nodes.forEach((node, index) => {
      this.listener(types, node, (event: Event, nodeEl: HTMLElement | null) => callback(event, nodeEl, index), isPreventDefault);
    });
  }
}

export default Events;
