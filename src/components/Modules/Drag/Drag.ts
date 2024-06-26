/**
 * Плагин перетаскивания элементов
 *
 * Автор: Ерохин Максим
 * Дата: 19.12.2019
 */

import './Drag.scss';
import Logger from '../../Core/Logger';
import Faze from '../../Core/Faze';

/**
 * Направление для проверки вхождения мышки в элемент
 *
 * Содержит:
 *   horizontal - левая и правая сторона
 *   vertical   - верхняя и нижняя сторона
 */
enum SideDirection {
  horizontal = 'horizontal',
  vertical = 'vertical',
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
  itemsNodes: HTMLElement[];
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
  phantomElementTag: string;
  callbacks: {
    created?: (data: CallbackData) => void;
    beforeDrag?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
    drag?: (data: CallbackData) => void;
    afterDrag?: (data: CallbackData) => void;
  };
}

class Drag {
  // DOM элемент дропдауна
  readonly nodes: HTMLElement[];

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элементы которые перетягиваем
  readonly itemsNodes: HTMLElement[];

  // DOM элемент переносимого элемента
  dragItemNode?: HTMLElement;

  constructor(nodes: HTMLElement[] | null, config: Partial<Config>) {
    if (!nodes) {
      return this.logger.error('Не заданы объекты контейнеров элементов для перетаскивания');
    }

    // Конвертируем в нужный формат переданные объекты
    if (nodes instanceof HTMLElement) {
      this.nodes = [nodes];
    } else {
      this.nodes = [...Array.from(nodes)];
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Drag:');

    // Проверка на двойную инициализацию
    const foundNode = this.nodes.find((node) => node.classList.contains('faze-drag-initialized'));
    if (foundNode) {
      if (!foundNode.dataset.fazeDragGroup) {
        this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', foundNode);
      }
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      direction: SideDirection.vertical,
      phantomElementTag: 'div',
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    // Инициализация переменных
    this.config = Object.assign(defaultConfig, config);
    this.itemsNodes = [];
    this.nodes.forEach((node: HTMLElement) => {
      this.itemsNodes.push(...Array.from(node.querySelectorAll<HTMLElement>('.faze-drag-item, [data-faze-drag="item"]')));
    });
    this.dragItemNode = undefined;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Простановка стандартных классов
    this.nodes.forEach((node: HTMLElement) => {
      node.classList.add('faze-drag');
      node.classList.add('faze-drag-initialized');
    });

    // Инициализация элементов
    this.initializeItemsIndexes();
    this.initializeItemsPositions();

    // Исполняем пользовательский метод после инициализации
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          containerNodes: this.nodes,
          itemsNodes: this.itemsNodes,
        });
      } catch (error) {
        this.logger.error(`Ошибка исполнения пользовательского метода "created": ${error}`);
      }
    }
  }

  /**
   * Простановка индексов для элементов
   *
   * @private
   */
  private initializeItemsIndexes(): void {
    this.itemsNodes.forEach((itemNode: HTMLElement, itemIndex: number) => {
      itemNode.dataset.fazeDragIndex = itemIndex.toString();
    });
  }

  /**
   * Простановка позиций для элементов
   *
   * @private
   */
  private initializeItemsPositions(): void {
    this.itemsNodes.forEach((itemNode: HTMLElement) => {
      const computedStyles = window.getComputedStyle(itemNode);

      itemNode.dataset.fazeDragItemPositionX = (itemNode.offsetLeft - parseInt(computedStyles.marginLeft, 10)).toString();
      itemNode.dataset.fazeDragItemPositionY = (itemNode.offsetTop - parseInt(computedStyles.marginTop, 10)).toString();
    });
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.itemsNodes.forEach((itemNode: HTMLElement) => {
      // DOM элемент ручки для перетаскивания, если её нет, то считаем весь элемент ею
      const handleNode: HTMLElement = itemNode.querySelector('.faze-drag-handle, [data-faze-drag="handle"]') || itemNode;

      // Навешиваем события перетаскивания
      this.bindDrag(handleNode, itemNode);
    });
  }

  /**
   * Навешивание событий и управление перетаскиванием модального окна
   *
   * @private
   */
  private bindDrag(handleNode: HTMLElement, draggedItemNode: HTMLElement): void {
    // Начальная позиция мыши
    const startMousePosition = {
      x: 0,
      y: 0,
    };

    // Конечная позиция мыши
    const endMousePosition = {
      x: 0,
      y: 0,
    };

    // Изначальные стили элемента, которые в момент перетаскивания будут изменяться и необходимо будет их восстановить в изначальный вид
    const initialDraggedItemStyles = {
      width: draggedItemNode.style.width,
      height: draggedItemNode.style.height,
      position: draggedItemNode.style.position,
      top: draggedItemNode.style.top,
      left: draggedItemNode.style.left,
    };

    // Получаем стили
    const computedStyles = window.getComputedStyle(draggedItemNode, null);

    // Стартовые размеры элемента
    const width = draggedItemNode.getBoundingClientRect().width;
    const height = draggedItemNode.getBoundingClientRect().height;

    // Создаем фантомный элемент для замены "взятого", т.к. он станет абсолютом при драге
    const phantomNode = document.createElement(this.config.phantomElementTag);
    phantomNode.className = 'faze-drag-item-phantom';
    phantomNode.style.width = `${width}px`;
    phantomNode.style.height = `${height}px`;
    phantomNode.style.marginTop = computedStyles.marginTop;
    phantomNode.style.marginBottom = computedStyles.marginBottom;
    phantomNode.style.marginLeft = computedStyles.marginLeft;
    phantomNode.style.marginRight = computedStyles.marginRight;

    /**
     * Функция нажатия на шапку для начала перетаскивания, навешиваем все необходимые обработчики и вычисляем начальную точку нажатия
     *
     * @param event - событие мыши
     */
    const dragMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      // Получение позиции курсора при нажатии на элемент
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Проставляем стили для возможности передвигать элемент мышкой
      draggedItemNode.style.position = 'absolute';
      draggedItemNode.style.width = `${width}px`;
      draggedItemNode.style.height = `${height}px`;
      draggedItemNode.style.left = `${draggedItemNode.dataset.fazeDragItemPositionX}px`;
      draggedItemNode.style.top = `${draggedItemNode.dataset.fazeDragItemPositionY}px`;

      // Ставим класс, показывающий, что это движемый элемент
      draggedItemNode.classList.add('faze-drag-item-moving');

      // Вставляем фантомный элемент под текущим
      if (draggedItemNode.parentNode) {
        draggedItemNode.parentNode.insertBefore(phantomNode, draggedItemNode.nextSibling);
      }

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);

      // Исполняем пользовательский метод после инициализации
      if (typeof this.config.callbacks.beforeDrag === 'function') {
        try {
          this.config.callbacks.beforeDrag({
            containerNodes: this.nodes,
            itemsNodes: this.itemsNodes,
          });
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "beforeDragged": ${error}`);
        }
      }
    };

    /**
     * Функция перетаскивания модального окна.
     * Тут идет расчет координат и они присваиваются окну через стили "top" и "left", окно в таком случае естественно должно иметь
     * позиционирование "absolute"
     *
     * @param event - событие мыши
     */
    const elementDrag = (event: MouseEvent) => {
      event.preventDefault();

      // Рассчет новой позиции курсора
      endMousePosition.x = startMousePosition.x - event.clientX;
      endMousePosition.y = startMousePosition.y - event.clientY;
      startMousePosition.x = event.clientX;
      startMousePosition.y = event.clientY;

      // Рассчет новой позиции элемента
      const x = parseInt(draggedItemNode.dataset.fazeDragItemPositionX || '0', 10) - endMousePosition.x;
      draggedItemNode.style.left = `${x}px`;
      draggedItemNode.dataset.fazeDragItemPositionX = x.toString();

      const y = parseInt(draggedItemNode.dataset.fazeDragItemPositionY || '0', 10) - endMousePosition.y;
      draggedItemNode.style.top = `${y}px`;
      draggedItemNode.dataset.fazeDragItemPositionY = y.toString();

      Array.from(this.itemsNodes)
        .filter((itemNode) => !itemNode.classList.contains('faze-drag-item-moving'))
        .forEach((itemNode: HTMLElement) => {
          // Получаем результаты наведения на элемент мышкой
          const mouseOverResult = Faze.Helpers.isMouseOver(event, itemNode, { horizontal: true, vertical: true });

          if (itemNode.parentNode) {
            if (this.config.direction === SideDirection.horizontal) {
              // Если навели на нижнюю часть блока, то вставляем снизу
              if (mouseOverResult.sides.right) {
                itemNode.parentNode.insertBefore(phantomNode, itemNode.nextSibling);
              } else if (mouseOverResult.sides.left) {
                // Если на верхнюю, то сверху
                itemNode.parentNode.insertBefore(phantomNode, itemNode);
              }
            } else {
              // Если навели на нижнюю часть блока, то вставляем снизу
              if (mouseOverResult.sides.bottom) {
                itemNode.parentNode.insertBefore(phantomNode, itemNode.nextSibling);
              } else if (mouseOverResult.sides.top) {
                // Если на верхнюю, то сверху
                itemNode.parentNode.insertBefore(phantomNode, itemNode);
              }
            }
          }
        });

      // Исполняем пользовательский метод после инициализации
      if (typeof this.config.callbacks.drag === 'function') {
        try {
          this.config.callbacks.drag({
            containerNodes: this.nodes,
            itemsNodes: this.itemsNodes,
          });
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "drag": ${error}`);
        }
      }
    };

    /**
     * Завершение перетаскивания(момент отпускания кнопки мыши)
     */
    const endDragElement = () => {
      // Перемещаем элемент после фантомного
      if (phantomNode.parentNode) {
        phantomNode.parentNode.insertBefore(draggedItemNode, phantomNode.nextSibling);
      }

      // Снимаем класс движения
      draggedItemNode.classList.remove('faze-drag-item-moving');

      // Возвращаем стили сохранённые до начала перетаскивания элемента
      draggedItemNode.style.width = initialDraggedItemStyles.width;
      draggedItemNode.style.height = initialDraggedItemStyles.height;
      draggedItemNode.style.position = initialDraggedItemStyles.position;
      draggedItemNode.style.top = initialDraggedItemStyles.top;
      draggedItemNode.style.left = initialDraggedItemStyles.left;

      // Удаляем фантомный элемент
      phantomNode.remove();

      // Переинициализируем индексы элементов, т.к. порядок может быть нарушен перетаскиванием
      this.initializeItemsIndexes();

      // Так же переинициализируем позиции элементов, т.к. если изменение произошло, то позиции сдвинулись
      this.initializeItemsPositions();

      // Удаляем все связанные события
      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);

      // Исполняем пользовательский метод после перетаскивания
      if (typeof this.config.callbacks.changed === 'function') {
        try {
          this.config.callbacks.changed({
            containerNodes: this.nodes,
            itemsNodes: this.itemsNodes,
          });
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "changed": ${error}`);
        }
      }

      // Исполняем пользовательский метод после инициализации
      if (typeof this.config.callbacks.afterDrag === 'function') {
        try {
          this.config.callbacks.afterDrag({
            containerNodes: this.nodes,
            itemsNodes: this.itemsNodes,
          });
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "beforeDragged": ${error}`);
        }
      }
    };

    // Навешиваем событие перетаскивания окна по нажатию на его заголовок
    handleNode.addEventListener('mousedown', dragMouseDown);
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
      direction: dragNode.dataset.fazeDragDirection === 'horizontal' ? SideDirection.horizontal : SideDirection.vertical,
      phantomElementTag: dragNode.dataset.fazeDragPhantomElementTag || 'div',
    });
  }

  /**
   * Инициализация модуля либо по data атрибутам либо через observer
   */
  static hotInitialize(): void {
    Faze.Observer.watch('[data-faze~="drag"]', (dragNode: HTMLElement) => {
      Drag.initializeByDataAttributes(dragNode);
    });

    document.querySelectorAll<HTMLElement>('[data-faze~="drag"]').forEach((dragNode: HTMLElement) => {
      Drag.initializeByDataAttributes(dragNode);
    });
  }
}

export default Drag;
