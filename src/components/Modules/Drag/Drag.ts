/**
 * Плагин перетаскивания элементов
 *
 * Автор: Ерохин Максим
 * Дата: 19.12.2019
 */

import './Drag.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Направление для проверки вхождения мышки в элемент
 *
 * Содержит:
 *   horizontal - левая и правая сторона
 *   vertical   - верхняя и нижняя сторона
 */
enum SideDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

interface ItemData {
  node: HTMLElement;
  container: HTMLElement;
  size: FazeSize;
  entered: boolean;
}

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   title  - заголовок дропдауна
 *   body   - тело дропдауна
 */
interface CallbackData {
  containerNodes: HTMLElement[];
  itemsData: ItemData[];
}

/**
 * Структура конфига
 *
 * Содержит:
 *   direction - в какую сторону перетаскиваем
 *   phantomElementTag - тег фантомного элемента
 *   callbacks
 *     created - пользовательская функция, исполняющийся при успешном создании дропдауна
 *     beforeDrag- пользовательская функция, исполняющаяся до фактического перетаскивания, то есть при нажатии
 *     drag - пользовательская функция, исполняющаяся в момент перетаскивания
 *     changed - пользовательская функция, исполняющийся при открытии дропдауна
 *     afterDrag - пользовательская функция, исполняющаяся после фактического перетаскивания, то есть когда отпускаем кнопку мыши(аналог "changed")
 */
interface Config {
  direction: SideDirection;
  animation: number,
  callbacks: {
    created?: (data: CallbackData) => void;
    beforeDrag?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    drag?: (data: CallbackData) => void;
    afterDrag?: (data: CallbackData) => void;
  };
}

class Drag extends Module {
  // DOM элементы которые перетягиваем
  private itemsData: ItemData[];

  // Флаг перетаскивания
  // private isDragging: boolean;

  // DOM элемент переносимого элемента
  dragItemNode?: HTMLElement;

  constructor(nodes: HTMLElement[], config: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      direction: SideDirection.Vertical,
      animation: 200,
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      nodes,
      config: Object.assign(defaultConfig, config),
      name: 'Drag',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    super.initialize();

    // Инициализация переменных
    this.watchSelector = `[data-faze-uid="${this.uid}"] [data-faze-drag="item"]`;
    // this.isDragging = false;

    // Инициализация переменных
    this.collectItems();
    this.dragItemNode = undefined;

    // Инициализация элементов
    this.initializeItems();
    // this.initializeItemsAttributes();

    // Исполняем пользовательский метод после инициализации
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          containerNodes: this.nodes,
          itemsData: this.itemsData,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
    }
  }

  /**
   * Собирает все элементы которые перетягиваем
   * 
   * @private
   */
  private collectItems() {
    this.itemsData = [];
    this.nodes.forEach((node: HTMLElement) => {
      this.itemsData.push(
        ...Array.from(
          node.querySelectorAll<HTMLElement>('.faze-drag-item, [data-faze-drag="item"]'))
          .map((itemNode: HTMLElement) => ({
            node: itemNode,
            container: node,
            size: Faze.Helpers.getElementSize(itemNode),
            entered: false,
          }))
      );
    });
  }

  /**
   * Инициализация элементов
   *
   * @private
   */
  private initializeItems(): void {

  }

  public move(itemData: ItemData, fromIndex: number, toIndex: number): void {
    if (itemData.entered) {
      return;
    }
    this.moveStep(itemData, fromIndex, toIndex, fromIndex > toIndex);
  }

  private moveStep(itemData: ItemData, fromIndex: number, toIndex: number, direction: boolean): void {
    // Устанавливаем флаг
    itemData.entered = true;

    if (!direction) {
      // Ищем элемент на который перетаскиваем
      const underItemData = this.itemsData
        .filter((tmpData) => tmpData.container === itemData.container)
        .at(toIndex);

      // Если не нашли, то ничего не делаем
      if (!underItemData) {
        return;
      }

      // Делаем выборку какие элементы передвигаем
      const itemsToMove = this.itemsData
        .filter((tmpData) => tmpData.container === itemData.container)
        .slice(fromIndex + 1, toIndex + 1);

      // Передвигаем
      itemsToMove.forEach((tmpData) => {
        const heightToMove = Faze.Helpers.getElementSize(tmpData.node.previousElementSibling).height;

        tmpData.node.style.transition = `transform ${this.config.animation}ms ease-in-out`;
        tmpData.node.style.transform = `translate3d(0, -${heightToMove}px, 0)`;
      });

      // Вычисляем высоту(путь) для движения перетаскиваемого элемента
      const heightToMove = this.getHeightBetweenItems(itemData.container, fromIndex, toIndex);

      // Перетаскиваем
      itemData.node.style.transition = `transform ${this.config.animation}ms ease-in-out`;
      itemData.node.style.transform = `translate3d(0, ${heightToMove}px, 0)`;

      // Перемещение элементов в DOM после анимации
      setTimeout(() => {
        Faze.DOM.insertAfter(itemData.node, underItemData.node);

        itemsToMove.forEach((tmpData) => {
          tmpData.node.style.transition = 'none';
          tmpData.node.style.transform = 'none';
        });

        itemData.node.style.transition = 'none';
        itemData.node.style.transform = 'none';

        this.collectItems();
      }, this.config.animation);
    } else {
      const itemsToMove = this.itemsData
        .filter((tmpData) => tmpData.container === itemData.container)
        .slice(toIndex, fromIndex)


      console.log(fromIndex, toIndex);
      console.log(itemsToMove);
    }
  }

  private getHeightBetweenItems(container: HTMLElement, fromIndex: number, toIndex: number): number {
    return this.itemsData
      .filter((itemData) => itemData.container === container)
      .slice(fromIndex + 1, toIndex + 1)
      .reduce((acc, itemData) => acc + Faze.Helpers.getElementSize(itemData.node).height, 0);
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {
    super.bind();

    // Навешиваем перетаскиваемые элементы
    this.itemsData.forEach((itemData: ItemData) => {
      this.bindDrag(itemData);
    });

    Faze.Events.listener('dragenter', this.nodes, (event: DragEvent) => {
      const draggingItemData = this.itemsData.find((item: ItemData) => item.node.classList.contains('faze-dragging'));
      if (!draggingItemData) {
        return;
      }

      // Ищем элемент на который перетащили
      const underItemData = this.itemsData.find((item: ItemData) => item.node === event.target);

      // Если не нашли, то ничего не делаем
      if (underItemData === draggingItemData) {
        return;
      }

      // Если перетаскиваемый элемент не нашли, то ничего не делаем
      if (underItemData) {
        // Ищем индекс на кого перетаскиваем
        const underItemIndex = this.itemsData
          .filter(tmpData => tmpData.container === underItemData.container)
          .indexOf(underItemData);

        // Если не нашли индекс, то ничего не делаем
        if (underItemIndex === -1) {
          return;
        }

        // Ищем индекс перетаскиваемого
        const overItemIndex = this.itemsData
          .filter(tmpData => tmpData.container === draggingItemData.container)
          .indexOf(draggingItemData);

        // Если не нашли индекс, то ничего не делаем
        if (overItemIndex === -1) {
          return;
        }

        this.move(draggingItemData, overItemIndex, underItemIndex);
      }
    }, false);

    setTimeout(() => {
      this.move(this.itemsData[0], 4, 2);
    }, 1000);
  }

  private bindDrag(itemData: ItemData): void {
    // DOM элемент ручки для перетаскивания, если её нет, то считаем весь элемент ею
    const handleNode: HTMLElement = itemData.node.querySelector('.faze-drag-handle, [data-faze-drag="handle"]') || itemData.node;
    handleNode.draggable = true;

    Faze.Events.listener('dragstart', handleNode, (event: DragEvent) => {
      // Создаём полную копию элемента
      const ghost: HTMLElement = itemData.node.cloneNode(true) as HTMLElement;
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.width = `${itemData.node.clientWidth}px`;
      ghost.style.height = `${itemData.node.clientHeight}px`;
      document.body.appendChild(ghost);

      // Устанавливаем как drag image
      event.dataTransfer?.setDragImage(ghost, 0, 0);

      // Добавляем класс
      itemData.node.classList.add('faze-dragging');

      // Удаляем через кадр (после старта драга)
      requestAnimationFrame(() => ghost.remove());
    }, false);
  }

  /**
   * Реинициализация
   *
   * @param {HTMLElement} data Данные для реинициализации
   */
  protected reinitialize(data: HTMLElement): void {
    this.collectItems();

    this.bind();

    // Инициализация элементов
    this.initializeItems();
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param dragNode - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(dragNode: HTMLElement): void {
    const group: string | undefined = dragNode.dataset.fazeDragGroup;

    const dragContainerNodes = group ? Array.from(document.querySelectorAll(`[data-faze~="drag"][data-faze-drag-group=${group}]`)) : [dragNode];
    new Faze.Drag(dragContainerNodes, {
      animation: dragNode.dataset.fazeDragAnimation ? Number(dragNode.dataset.fazeDragAnimation) : 200,
      direction: dragNode.dataset.fazeDragDirection === 'horizontal' ? SideDirection.Horizontal : SideDirection.Vertical,
    });
  }
}

export default Drag;
