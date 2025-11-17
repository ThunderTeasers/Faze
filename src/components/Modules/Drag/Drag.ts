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
   * 
   * @protected
   */
  protected initialize(): void {
    super.initialize();

    // Инициализация переменных
    this.watchSelector = `[data-faze-uid="${this.uid}"] [data-faze-drag="item"]`;
    this.itemsData = [];

    // Инициализация переменных
    this.collectItems();
    this.initializeItems();

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
   * Инициализация перетаскиваемых элементов
   *
   * @public
   */
  public initializeItems(): void {
    this.itemsData.forEach((itemData: ItemData) => {
      // DOM элемент ручки для перетаскивания, если её нет, то считаем весь элемент ею
      const handleNode: HTMLElement = itemData.node.querySelector('.faze-drag-handle, [data-faze-drag="handle"]') || itemData.node;
      handleNode.draggable = true;
    });
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
          }))
      );
    });
  }

  /**
   * Перемещает элемент на новое место
   *
   * @param {ItemData} itemData Данные перетаскиваемого элемента
   * @param {number} fromIndex Индекс с которого начинаем перетаскивание
   * @param {number} toIndex Индекс на который происходит перетаскивание
   * 
   * @public
   */
  public move(itemData: ItemData, fromIndex: number, toIndex: number): void {
    // "Вперёд" или "назад"
    const isDescending = toIndex > fromIndex;

    // Горизонтально или вертикально
    const isHorizontal = this.config.direction === SideDirection.Horizontal;

    // Ищем элемент на который перетаскиваем
    const underItemData = this.itemsData
      .filter((tmpData) => tmpData.container === itemData.container)
      .at(toIndex);

    // Если не нашли, то ничего не делаем
    if (!underItemData) {
      return;
    }

    // Делаем выборку какие элементы передвигаем
    let itemsToMove = this.itemsData
      .filter((tmpData) => tmpData.container === itemData.container);

    console.log(this.getRowsCoordinates(itemsToMove));

    // Получаем только нужные для работы элементы
    if (isDescending) {
      itemsToMove = itemsToMove.slice(fromIndex + 1, toIndex + 1);
    } else {
      itemsToMove = itemsToMove.slice(toIndex, fromIndex);
    }

    // Моментально передвигаем их на своё же место, т.к. в следующий момент они будут сдвинуты
    itemsToMove.forEach((tmpData) => {
      const elementSize = Faze.Helpers.getElementSize(isDescending ? tmpData.node.previousElementSibling : tmpData.node.nextElementSibling);
      const distance = isHorizontal ? elementSize.width : elementSize.height;
      const offset = isDescending ? distance : -distance;

      tmpData.node.style.transition = 'none';
      tmpData.node.style.transform = `translate3d(${isHorizontal ? offset : 0}px, ${!isHorizontal ? offset : 0}px, 0)`;
      tmpData.node.style.pointerEvents = 'none';
    });

    // Вычисляем высоту(путь) для движения перетаскиваемого элемента
    const distance = this.getDistanceBetweenItems(itemsToMove)
    const offset = isDescending ? -distance : distance;

    // Моментально передвигаем их на своё же место, т.к. в следующий момент они будет сдвинут
    itemData.node.style.transition = 'none';
    itemData.node.style.transform = `translate3d(${isHorizontal ? offset : 0}px, ${!isHorizontal ? offset : 0}px, 0)`;

    // Переносим
    if (isDescending) {
      Faze.DOM.insertAfter(itemData.node, underItemData.node);
    } else {
      Faze.DOM.insertAfter(underItemData.node, itemData.node);
    }

    // Передвигаем
    requestAnimationFrame(() => {
      itemsToMove.forEach((tmpData) => {
        tmpData.node.style.transition = `transform ${this.config.animation}ms ease-in-out`;
        tmpData.node.style.transform = `translate3d(0, 0, 0)`;
      });

      itemData.node.style.transition = `transform ${this.config.animation}ms ease-in-out`;
      itemData.node.style.transform = `translate3d(0, 0, 0)`;
    });

    // Возвращаем возможность принимать перетаскивание на себя
    setTimeout(() => {
      itemsToMove.forEach((tmpData) => {
        tmpData.node.style.pointerEvents = 'auto';
      });
    }, this.config.animation);
  }

  /**
   * Вычисляет сумму размеров элементов в заданном массиве
   * 
   * @param {ItemData[]} itemsData Массив элементов
   * @return {number} Сумма высот элементов между двумя индексами
   * 
   * @private
   */
  private getDistanceBetweenItems(itemsData: ItemData[]): number {
    return itemsData
      .reduce((acc, itemData) => acc + (this.config.direction === SideDirection.Horizontal ? itemData.size.width : itemData.size.height), 0);
  }

  /**
   * Вычисляет координаты строк при расположении элементов в две или более строки
   *
   * @param {ItemData[]} itemsData Массив элементов
   * 
   * @return {number[]} Массив координат
   */
  private getRowsCoordinates(itemsData: ItemData[]): number[] {
    const rowTops = new Set<number>();
    itemsData.forEach((itemData) => {
      rowTops.add(itemData.node.getBoundingClientRect().top - itemData.container.getBoundingClientRect().top);
    });

    return Array.from(rowTops).sort((a: number, b: number) => a - b);
  }

  /**
   * Навешивание событий
   * 
   * @protected
   */
  protected bind(): void {
    super.bind();

    this.bindDragStart();
    this.bindDragEnter();
    this.bindDragEnd();
  }

  /**
   * Навешивание событий на начало перетаскивания
   * 
   * @private
   */
  private bindDragStart(): void {
    Faze.Events.listener('dragstart', this.nodes, (event: DragEvent) => {
      if (event.target instanceof HTMLElement && (event.target as HTMLElement)?.closest('[data-faze-drag="item"], [data-faze-drag="handle"]')) {
        const itemNode = (event.target as HTMLElement).closest('[data-faze-drag="item"]');
        if (!itemNode) {
          return;
        }

        const itemData = this.itemsData.find((item: ItemData) => item.node === itemNode);
        if (!itemData) {
          return;
        }

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
      }
    }, false);
  }

  /**
   * Навешивание событий на перетаскивание элемента над другим
   * 
   * @private
   */
  private bindDragEnter(): void {
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

        // Перемещаем
        this.move(draggingItemData, overItemIndex, underItemIndex);
      }
    }, false);
  }

  /**
   * Навешивание события на конец перетаскивания
   * 
   * @private
   */
  private bindDragEnd(): void {
    Faze.Events.listener('dragend', this.nodes, (event: DragEvent) => {
      this.itemsData.forEach((itemData: ItemData) => {
        itemData.node.classList.remove('faze-dragging');
      });
    });
  }

  /**
   * Реинициализация
   * 
   * @protected
   */
  protected reinitialize(): void {
    this.collectItems();
    this.initializeItems();
    this.bind();
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
