import Faze from "./Faze";

/**
 * Класс для ускорения конечной разработки за счёт использования находящихся коротких функций,
 * которые делают всю шаблонную работу за нас
 */
class Events {
  // Карта для хранения навешанных событий
  static EVENTS_MAP: Map<HTMLElement, Map<string, string>> = new Map();

  // Общие события
  private static commonEvents: string[] = [
    'click',

    'submit',
    'change',
    'input',
    'keyup',
    'keydown',

    'mouseover',
    'mouseout',
    'mouseenter',
    'mouseleave',

    'focus',
    'blur',
  ];

  /**
   * Навешивание событие клика на DOM элемент со всеми проверками
   *
   * @param {HTMLElement | string} nodeOrSelector DOM элемент на который навешиваем событие или его CSS селектор
   * @param {(event: Event, node: HTMLElement | null)} callback Пользовательская функция исполняющаяся после события
   * @param {boolean} isPreventDefault Нужно ли делать "preventDefault()" у события
   */
  static {
    this.commonEvents.forEach((event: string) => {
      (this as any)[event] = (nodeOrSelector: HTMLElement | HTMLElement[] | string, callback: (event: Event, node: HTMLElement | null) => void, isPreventDefault: boolean = true, once: boolean = true): void => {
        this.listener(event, nodeOrSelector, callback, isPreventDefault, once);
      };
    });
  }

  /**
   * Навешивание событие на DOM элемент со всеми проверками
   *
   * @param {string | string[]} types Типы события
   * @param {HTMLElement | HTMLElement[] | string} nodeOrSelector DOM элемент(ы) на который навешиваем событие или его CSS селектор
   * @param {(event: Event, node: HTMLElement | null, nodes: HTMLElement[] | null, index: number)} callback Пользовательская функция исполняющаяся после события
   * @param {boolean} isPreventDefault Нужно ли делать "preventDefault()" у события
   * @param {boolean} once Одно ли событие навешивать
   */
  static listener(types: string | string[], nodeOrSelector: HTMLElement | HTMLElement[] | string, callback: (event: Event, node: HTMLElement | null, nodes: HTMLElement[] | null, index: number) => void, isPreventDefault: boolean = true, once: boolean = true): void {
    // Проверяем, является ли переданный параметр строкой, если да,
    // то ищём соответствующий DOM элемент по селектору, если нет,
    // проверяем массив ли это и действуем в соответствии с этим
    let nodes: HTMLElement[];
    if (typeof nodeOrSelector === 'string') {
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

    // Проходимся по типам событий
    types.forEach((type: string) => {
      nodes.forEach((node: HTMLElement, index: number) => {
        // Если включено ограничение на одно одинковое событие
        if (once) {
          // Проверка на существование карты с событиями
          const map = this.EVENTS_MAP.get(node) ?? new Map<string, string>();

          // Проверка на повторное навешивание события
          if (map.has(type) && map.get(type) === Faze.Helpers.hash(callback.toString())) {
            return;
          }

          // Добавляем событие в карту
          map.set(type, Faze.Helpers.hash(callback.toString()));
          this.EVENTS_MAP.set(node, map);
        }

        // Навешиваем событие
        node.addEventListener(type, (event: Event) => {
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
