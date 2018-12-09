interface Listener {
  selector: string;
  callback: (addedNode: HTMLElement) => void;
  alreadyExistedNodes: NodeListOf<Element>;
}

class Observer {
  readonly listeners: Listener[];

  mutationObserver: MutationObserver;

  constructor() {
    // Инициализация переменных
    this.listeners = [];

    this.mutationObserver = new MutationObserver(this.check.bind(this));
    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  ready(selector: string, callback: (addedNode: HTMLElement) => void) {
    this.listeners.push({
      selector,
      callback,
      alreadyExistedNodes: document.querySelectorAll(selector),
    });
  }

  check(mutationRecords: MutationRecord[]) {
    // Проходимся по всем слушателям
    this.listeners.forEach((listener) => {
      // Проходимся по всем изменениям
      mutationRecords.forEach((mutationRecord) => {
        // Проходимся по всем добавленым DOM элементам
        mutationRecord.addedNodes.forEach((addedNode: Node) => {
          const parentNode = addedNode.parentNode;
          if (parentNode) {
            // Делаем выборку по селектору у родителя вставленного элемента, для того чтобы избежать случая, когда в "addedNode"
            // передаются элементы которые не соответствуют заданному в "listener" селектору
            parentNode.querySelectorAll(listener.selector).forEach((insertedElement) => {
              // Если этого элемента не было изначально, то исполняем заданную пользовательскую функцию
              if (!Array.from(listener.alreadyExistedNodes).includes(<HTMLElement>insertedElement)) {
                if (typeof listener.callback === 'function') {
                  try {
                    // Вызываем пользовательскую функцию
                    listener.callback(<HTMLElement>insertedElement);
                  } catch (error) {
                    console.error('Ошибка исполнения пользовательской функции переданной в Observer, текст ошибки: ', error);
                  }

                  // Обновляем уже существующие элементы у слушателя, чтобы при следующем добавлении элемента, пользовательская
                  // функция срабатывала только на последний, а не на все которые были добавлены после инициализации
                  listener.alreadyExistedNodes = document.querySelectorAll(listener.selector);
                }
              }
            });
          }
        });
      });
    });
  }
}

export default Observer;
