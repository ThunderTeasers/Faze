/**
 * Модуль ядра - Observer
 *
 * Предоставляет возможность автоматической инициализации плагинов по data атрибутам при динамическом создании DOM элементов на странице
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 03.05.2019
 */

/**
 * Возможные типы слушателя
 */
enum ListenerType {
  Attribute = 0,
  Node = 1,
}

/**
 * Структура слушателя плагина
 *
 * Содержит:
 *   selector             - CSS селектор DOM элемента который надо отслеживать
 *   callback             - пользовательский метод, исполняющийся при добавлении нового элемента с указанным селектором,
 *                          передает его DOM элемент
 *   alreadyExistedNodes  - список уже существующих DOM элементов с указанным селектором
 */
interface Listener {
  selector: string;
  callback: (addedNode: HTMLElement) => void;
  alreadyExistedNodes: HTMLElement[];
  type: ListenerType;
}

/**
 * Класс Observer
 */
class Observer {
  // Список слушателей
  readonly listeners: Listener[];

  // Основной объект observer'а
  mutationObserver: MutationObserver;

  constructor() {
    // Инициализация переменных
    this.listeners = [];

    // Инициализируем сам observer
    this.mutationObserver = new MutationObserver(this.check.bind(this));
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  /**
   * Добавление слушателя к общему списку
   *
   * @param selector{string} - CSS селектор DOM элемента для отслеживания
   * @param callback{HTMLElement} - пользовательский метод, исполняющийся после добавления нужного DOM элемента
   */
  watch(selector: string, callback: (addedNode: HTMLElement) => void, type: ListenerType = ListenerType.Node) {
    this.listeners.push({
      selector,
      callback,
      alreadyExistedNodes: Array.from(document.querySelectorAll(selector)),
      type,
    });
  }

  /**
   * Вызов метода слушателя на DOM элемент
   *
   * @param listener{Listener} Слушатель
   * @param node{HTMLElement} DOM элемент
   *
   * @private
   */
  private call(listener: Listener, node: HTMLElement) {
    if (!Array.from(listener.alreadyExistedNodes).includes(node)) {
      if (typeof listener.callback === 'function') {
        try {
          // Вызываем пользовательскую функцию
          listener.callback(node);
        } catch (error) {
          console.error('Ошибка исполнения пользовательской функции переданной в Observer, текст ошибки: ', error);
        }

        // Обновляем уже существующие элементы у слушателя, чтобы при следующем добавлении элемента, пользовательская
        // функция срабатывала только на последний, а не на все которые были добавлены после инициализации
        listener.alreadyExistedNodes.push(node);
      }
    }
  }

  /**
   * Отслеживание всех изменений DOM элементов на сайте
   *
   * @param mutationRecords - список изменения
   */
  private check(mutationRecords: MutationRecord[]) {
    // Проходимся по всем изменениям
    mutationRecords.forEach((mutationRecord: MutationRecord) => {
      // Проходимся по всем добавленым DOM элементам
      mutationRecord.addedNodes.forEach((addedNode: any) => {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          // Проходимся по всем слушателям
          this.listeners.forEach((listener) => {
            // Если сам элемент является искомым, то вызываем метод на него
            if (addedNode.matches(listener.selector)) {
              this.call(listener, addedNode);
            }

            // Ищём в добавленом DOM элементе детей с необходимыми нам селекторами и на них мешаем метод
            addedNode.querySelectorAll(listener.selector).forEach((node: HTMLElement) => {
              this.call(listener, node);
            });
          });
        }
      });

      // Проходимся по всем удаленным DOM элементам и убираем их из массива существующих элементов слушателя, чтобы не засорять его и
      // очистить память
      mutationRecord.removedNodes.forEach((removedNode: Node) => {
        // Проходимся по всем слушателям
        this.listeners.forEach((listener) => {
          listener.alreadyExistedNodes.forEach((existedNode: HTMLElement) => {
            if (existedNode === removedNode) {
              listener.alreadyExistedNodes = listener.alreadyExistedNodes.filter((node) => node !== existedNode);
            }
          });
        });
      });
    });
  }
}

export default Observer;
