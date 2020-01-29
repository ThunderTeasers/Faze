/**
 * Плагин перетаскивания элементов
 *
 * Автор: Ерохин Максим, plarson.ru
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
  containerNode: HTMLElement;
  itemsNodes: NodeListOf<HTMLElement>;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   callbacks
 *     created  - пользовательский метод, исполняющийся при успешном создании дропдауна
 *     opened   - пользовательский метод, исполняющийся при открытии дропдауна
 */
interface Config {
  sideDirection: SideDirection;
  callbacks: {
    created?: (data: CallbackData) => void;
    changed?: (data: CallbackData) => void;
  };
}

class Drag {
  // DOM элемент дропдауна
  readonly node: HTMLElement;

  // Помощник для логирования
  readonly logger: Logger;

  // Конфиг с настройками
  readonly config: Config;

  // DOM элементы которые перетягиваем
  readonly itemsNodes: NodeListOf<HTMLElement>;

  // DOM элемент переносимого элемента
  dragItemNode?: HTMLElement;

  constructor(node: HTMLElement | null, config: Partial<Config>) {
    if (!node) {
      return this.logger.error('Не задан объект контейнера элементов для перетаскивания');
    }

    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Drag:');

    // Проверка на двойную инициализацию
    if (node.classList.contains('faze-drag-initialized')) {
      this.logger.warning('Плагин уже был инициализирован на этот DOM элемент:', node);
      return;
    }

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      sideDirection: SideDirection.vertical,
      callbacks: {
        created: undefined,
        changed: undefined,
      },
    };

    // Инициализация переменных
    this.config = Object.assign(defaultConfig, config);
    this.node = node;
    this.itemsNodes = this.node.querySelectorAll('.faze-drag-item');
    this.dragItemNode = undefined;

    this.initialize();
    this.bind();
  }

  /**
   * Инициализация
   */
  initialize(): void {
    this.initializeItemsIndexes();

    // Исполняем пользовательский метод после инициализации
    if (typeof this.config.callbacks.created === 'function') {
      try {
        this.config.callbacks.created({
          containerNode: this.node,
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
   * Навешивание событий
   */
  bind(): void {
    this.itemsNodes.forEach((itemNode: HTMLElement) => {
      // DOM элемент ручки для перетаскивания, если её нет, то считаем весь элемент ею
      const handleNode: HTMLElement = itemNode.querySelector('.faze-drag-handle') || itemNode;

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

    // Стартовые размеры элемента
    const width = draggedItemNode.getBoundingClientRect().width;
    const height = draggedItemNode.getBoundingClientRect().height;

    // Создаем фантомный элемент для замены "взятого", т.к. он станет абсолютом при драге
    const phantomNode = document.createElement('div');
    phantomNode.className = 'faze-drag-item-phantom';
    phantomNode.style.width = `${width}px`;
    phantomNode.style.height = `${height}px`;

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

      // Ставим класс, показывающий, что это движемый элемент
      draggedItemNode.classList.add('faze-drag-item-moving');

      // Вставляем фантомный элемент под текущим
      if (draggedItemNode.parentNode) {
        draggedItemNode.parentNode.insertBefore(phantomNode, draggedItemNode.nextSibling);
      }

      document.addEventListener('mouseup', endDragElement);
      document.addEventListener('mousemove', elementDrag);
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

      // Рассчет новой позиции окна
      draggedItemNode.style.left = `${(draggedItemNode.offsetLeft - endMousePosition.x)}px`;
      draggedItemNode.style.top = `${(draggedItemNode.offsetTop - endMousePosition.y)}px`;

      Array.from(this.itemsNodes)
        .filter(itemNode => !itemNode.classList.contains('faze-drag-item-moving'))
        .forEach((itemNode: HTMLElement) => {
          // Получаем результаты наведения на элемент мышкой
          const mouseOverResult = Faze.Helpers.isMouseOver(event, itemNode, {horizontal: true, vertical: true});

          if (itemNode.parentNode) {
            if (this.config.sideDirection === SideDirection.horizontal) {
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

      // Удаляем все связанные события
      document.removeEventListener('mouseup', endDragElement);
      document.removeEventListener('mousemove', elementDrag);

      // Исполняем пользовательский метод после перетаскивания
      if (typeof this.config.callbacks.changed === 'function') {
        try {
          this.config.callbacks.changed({
            containerNode: this.node,
            itemsNodes: this.itemsNodes,
          });
        } catch (error) {
          this.logger.error(`Ошибка исполнения пользовательского метода "changed": ${error}`);
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
    new Faze.Drag(dragNode, {
      sideDirection: dragNode.dataset.fazeDragSideDirection === 'horizontal' ? SideDirection.horizontal : SideDirection.vertical,
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
