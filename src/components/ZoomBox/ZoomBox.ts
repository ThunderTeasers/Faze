import './ZoomBox.scss';
import Faze from '../Core/Faze';
import Logger from '../Core/Logger';

/**
 * Структура конфига
 *
 * Содержит:
 *   showTitle   - показывать ли заголовок
 *   showClose   - показывать ли кнопку закрытия
 *   transition
 *     size      - CSS настройки для изменение размера
 *     move      - CSS настройки для изменения положения
 *     time      - время CSS анимации
 *   callbacks
 *     created   - пользовательская функция, срабатывающая при создании
 *     opened    - пользовательская функция, срабатывающая при открытии
 */
interface Config {
  showTitle: boolean;
  showClose: boolean;
  transition: {
    size: string;
    move: string;
    time: number;
  };
  callbacks: {
    created?: () => void;
    opened?: () => void;
  };
}

/**
 * Структура данных основного объекта для работы
 *
 * Содержит:
 *   thumbnailNode  - DOM элемент превью изображения
 *   fullNode       - DOM элемент полной картинки
 *   data           - данные для работы галереи
 *   opened         - открыто ли изображение
 */
interface ImageData {
  thumbnailNode: HTMLImageElement;
  fullNode?: HTMLImageElement;
  data?: {
    prevThumb: HTMLImageElement;
    nextThumb: HTMLImageElement;
    prevIndex: number;
    nextIndex: number;
  };
  opened: boolean;
}

interface WrapperData {
  node: HTMLElement;
  titleNode?: HTMLElement;
  closeNode?: HTMLElement;
  thumbnailImageNode: HTMLImageElement;
  thumbnailData?: {
    width: number;
    height: number;
    shiftX: number;
    shiftY: number;
    left: number;
    top: number;
  };
  fullImageNode: HTMLImageElement;
  arrowPrevNode?: HTMLImageElement;
  arrowNextNode?: HTMLImageElement;
  shiftX?: number;
  shiftY?: number;
  viewport?: Size;
  drag?: {
    x: number;
    y: number;
  };
  finalWidth?: number;
  finalHeight?: number;
}

interface AnimateBoxSettings {
  wrapper: WrapperData;
  fullImage: HTMLImageElement;
  wrapperNode: HTMLElement;
  fullWidth: number;
  fullHeight: number;
  wrapperShiftX: number;
  wrapperShiftY: number;
  align: string;
  initialLeft: number;
  initialTop: number;
  initialWidth: number;
  initialHeight: number;
}

/**
 * Класс тултипа
 */
class Zoombox {
  // DOM элементы фотографий из которых надо составить галерею
  readonly callerNodes: HTMLImageElement[];

  // Массив элементов для работы с модулем
  readonly images: ImageData[];

  // Конфиг с настройками
  readonly config: Config;

  // Помощник для логирования
  readonly logger: Logger;

  // CSS свойство Z индекса для галереи
  zIndexCounter: number;

  /**
   * Стандартный конструктор
   *
   * @param nodes   - DOM элементы объектов при нажатии на которые происходит открытие
   * @param config  - конфиг модуля
   */
  constructor(nodes: HTMLImageElement[] | null, config: Partial<Config>) {
    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Zoombox:');

    if (!nodes) {
      this.logger.error('Не найдены DOM элементы для работы модуля!');
      return;
    }

    // Проверка на двойную инициализацию
    nodes.forEach((node: HTMLImageElement) => {
      if (node.classList.contains('faze-zoombox-initialized')) {
        this.logger.warning('Модуль уже был инициализирован на этот DOM элемент:', node);
        return;
      }
    });

    // Конфиг по умолчанию
    const defaultConfig: Config = {
      showTitle: true,
      showClose: true,
      transition: {
        size: 'width 0.5s, height 0.5s',
        move: 'left 0.5s, top 0.5s',
        time: 500,
      },
      callbacks: {
        created: undefined,
        opened: undefined,
      },
    };

    // Инициализация переменных
    this.config = Object.assign(defaultConfig, config);
    this.callerNodes = nodes;

    this.zIndexCounter = 1;
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Проходимся по всем DOM элементам и формируем массив со всеми данными
    this.callerNodes.forEach((imageNode: HTMLImageElement) => {
      Faze.Helpers.setElementStyle(imageNode, { cursor: 'zoom-in' });

      const imageData: ImageData = {
        thumbnailNode: imageNode,
        opened: false,
      };

      // Если это галерея
      if (imageNode.dataset.zoomboxGallery) {
        const gallery = imageNode.dataset.zoomboxGallery;
        const galleryThumbs = Array.from(document.querySelectorAll(`img[data-faze-zoombox-image][data-faze-zoombox-gallery="${gallery}"]`));
        if (galleryThumbs.length > 1) {
          const index = galleryThumbs.indexOf(imageNode);
          const next = (index + 1 < galleryThumbs.length) ? index + 1 : 0;
          const prev = (index - 1 >= 0) ? index - 1 : galleryThumbs.length - 1;

          // Добавляем новый объект в основной массив для работы
          imageData.data = {
            prevThumb: galleryThumbs[prev] as HTMLImageElement,
            nextThumb: galleryThumbs[next] as HTMLImageElement,
            prevIndex: prev,
            nextIndex: next,
          };
        }
      }

      this.images.push(imageData);
    });
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    this.images.forEach((image) => {
      image.thumbnailNode.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();

        // Если попап открыт для данной миниатюры, ничего не делаем
        if (image.opened) {
          return;
        }

        // Получаем путь до полной картинки
        const fullImageSrc = image.thumbnailNode.dataset.fazeZoomboxImage;
        if (fullImageSrc) {
          // Загружаем её
          const fullImage: HTMLImageElement = new Image();
          fullImage.src = fullImageSrc;
          fullImage.onload = () => {
            // Присваеваем загруженное изображение данные открытого изображения
            image.fullNode = fullImage;

            // После загрузки открываем окно
            this.openBox(image);
          };
        }
      });
    });
  }

  /**
   * Открываем попап с картинкой fullImage для заданной миниатюры thumbImage
   */
  openBox(image: ImageData) {
    // Если изображение не было загружено - ничего не делаем
    if (!image.fullNode) {
      return;
    }

    // Проставляем, что данное мзображение открыто
    image.opened = true;

    Faze.Helpers.setElementStyle(image.thumbnailNode, { visibility: 'hidden' });

    const fullSize = this.getFullSize(image.thumbnailNode, image.fullNode);

    // Создаём враппер размером 1x1 пикселя, который будет сам(!) растягиваться по контенту
    const wrapperNode = document.createElement('div');

    // Главный объект враммера, хранящий все данные
    const wrapper: WrapperData = {
      node: wrapperNode,
      thumbnailImageNode: image.thumbnailNode,
      fullImageNode: image.fullNode,
    };

    Faze.Helpers.setElementStyle(wrapperNode, {
      position: 'absolute',
      cursor: 'zoom-out',
      minWidth: '1px',
      minHeight: '1px',
      overflowX: 'hidden',
      zIndex: this.zIndexCounter.toString(),
    });
    document.body.appendChild(wrapperNode);
    wrapperNode.classList.add('zoom-box-wrapper');

    // Вычислим сдвиг (отступ) левого верхнего угла враппера от его содержимого 1x1
    const wrapperShiftX = parseInt(window.getComputedStyle(wrapperNode, null).borderLeftWidth, 10) + parseInt(window.getComputedStyle(wrapperNode, null).paddingLeft, 10);
    const wrapperShiftY = parseInt(window.getComputedStyle(wrapperNode, null).borderTopWidth, 10) + parseInt(window.getComputedStyle(wrapperNode, null).paddingTop, 10);

    // Вычислим сдвиг (отступ) левого верхнего угла превьюшки от изображения
    const thumbShiftX = parseInt(window.getComputedStyle(image.thumbnailNode, null).borderLeftWidth, 10);
    const thumbShiftY = parseInt(window.getComputedStyle(image.thumbnailNode, null).borderTopWidth, 10);

    // Вычислим размер и положение попапа
    const thumbWidth = image.thumbnailNode.width;
    const thumbHeight = image.thumbnailNode.height;
    const align = image.thumbnailNode.dataset.fazeZoomboxAlign || 'center';

    const thumbPos = Faze.Helpers.getElementPosition(image.thumbnailNode);
    const viewport = this.getPageSize();

    // Вычислим начальную позицию врапера
    let initialLeft;
    let initialTop;

    const initial = {
      x: {
        center: viewport.width / 2 - thumbWidth / 2 - wrapperShiftX,
        self: thumbPos.x - wrapperShiftX + thumbShiftX,
        left: 0,
        right: viewport.width - thumbWidth - wrapperShiftX,
      },
      y: {
        center: window.pageYOffset + viewport.height / 2 - thumbHeight / 2 - wrapperShiftY,
        self: thumbPos.y - wrapperShiftY + thumbShiftY,
        top: window.pageYOffset,
        bottom: window.pageYOffset + viewport.height - thumbHeight - wrapperShiftY,
      },
    };

    if (align === 'center') {
      initialLeft = initial.x.center;
      initialTop = initial.y.center;
    } else if (align === 'left top') {
      initialLeft = initial.x.left;
      initialTop = initial.y.top;
    } else if (align === 'center top') {
      initialLeft = initial.x.center;
      initialTop = initial.y.top;
    } else if (align === 'right top') {
      initialLeft = initial.x.right;
      initialTop = initial.y.top;
    } else if (align === 'right center') {
      initialLeft = initial.x.right;
      initialTop = initial.y.center;
    } else if (align === 'right bottom') {
      initialLeft = initial.x.right;
      initialTop = initial.y.bottom;
    } else if (align === 'center bottom') {
      initialLeft = initial.x.center;
      initialTop = initial.y.bottom;
    } else if (align === 'left bottom') {
      initialLeft = initial.x.left;
      initialTop = initial.y.bottom;
    } else if (align === 'left center') {
      initialLeft = initial.x.left;
      initialTop = initial.y.center;
    } else {
      initialLeft = initial.x.self;
      initialTop = initial.y.self;
    }

    // Помещаем во враппер картинку
    Faze.Helpers.setElementAttributes(image.fullNode, { border: '0' });
    Faze.Helpers.setElementStyle(image.fullNode, {
      display: 'block',
      width: `${thumbWidth}px`,
      height: `${thumbHeight}px`,
      transition: this.config.transition.size,
    });
    wrapperNode.appendChild(image.fullNode);

    // Сохраним значения на будущее
    wrapper.shiftX = wrapperShiftX;
    wrapper.shiftY = wrapperShiftY;
    wrapper.thumbnailData = {
      width: thumbWidth,
      height: thumbHeight,
      shiftX: thumbShiftX,
      shiftY: thumbShiftY,
      left: thumbPos.x,
      top: thumbPos.y,
    };

    if (this.config.showTitle) {
      const titleNode = Faze.Helpers.createElement('div', {}, {}, wrapperNode);
      titleNode.textContent = image.thumbnailNode.dataset.zoomboxTitle || image.fullNode?.src.replace(/.+\/([^/]+)$/, '$1');
      titleNode.classList.add('zoom-box-title');
      wrapper.titleNode = titleNode;
    }

    // Иконки управления можно расположить только тогда, когда уже есть размеры враппера, после вставки в него картинки
    if (this.config.showClose) {
      const closeNode = Faze.Helpers.createElement('i', {}, {
        position: 'absolute',
        right: '15px',
        top: '15px',
        fontSize: '30px',
        color: 'white',
        cursor: 'pointer',
        zIndex: (this.zIndexCounter + 1).toString(),
      }, wrapperNode);
      closeNode.classList.add('fas');
      closeNode.classList.add('fa-times');
      closeNode.addEventListener('click', () => {
        this.close(wrapperNode);
      });
      wrapper.closeNode = closeNode;
    }

    // Если есть изображения в галерее до текущего, отображаем стрелку
    if (image?.data?.prevThumb) {
      const arrowPrevNode = Faze.Helpers.createElement('i', { title: image.data.prevIndex }, {
        position: 'absolute',
        left: '15px',
        top: '50%',
        fontSize: '30px',
        color: 'white',
        cursor: 'pointer',
        zIndex: (this.zIndexCounter + 1).toString(),
      }, wrapperNode);
      arrowPrevNode.classList.add('fas');
      arrowPrevNode.classList.add('fa-arrow-circle-left');
      arrowPrevNode.addEventListener('click', (event: Event) => {
        this.changeBox(event, wrapper, 'prevThumb');
      });
      wrapper.arrowPrevNode = arrowPrevNode;
    }

    // Если есть изображения в галерее после текущего, отображаем стрелку
    if (image?.data?.nextThumb) {
      const arrowNextNode = Faze.Helpers.createElement('i', { title: image.data.nextIndex }, {
        position: 'absolute',
        right: '15px',
        top: '50%',
        fontSize: '30px',
        color: 'white',
        cursor: 'pointer',
        zIndex: (this.zIndexCounter + 1).toString(),
      }, wrapperNode);
      arrowNextNode.classList.add('fas');
      arrowNextNode.classList.add('fa-arrow-circle-right');
      arrowNextNode.addEventListener('click', (event: Event) => {
        this.changeBox(event, wrapper, 'nextThumb');
      });
      wrapper.arrowNextNode = arrowNextNode;
    }

    // Исходная позиция врапера
    Faze.Helpers.setElementStyle(wrapperNode, {
      left: `${initialLeft}px`,
      top: `${initialTop}px`,
      transition: this.config.transition.move,
    });

    // Конечная позиция враппера
    this.animateBox({
      wrapper,
      wrapperNode,
      align,

      wrapperShiftX,
      wrapperShiftY,

      initialLeft,
      initialTop,

      fullImage: image.fullNode,

      fullWidth: fullSize.width,
      fullHeight: fullSize.height,

      initialWidth: thumbWidth,
      initialHeight: thumbHeight,
    });

    /**
    * Начинаем тащить попап, т.е. нажали на кнопку мыши и тянем
    */
    const dragStart = (event: any) => {
      event.preventDefault();
      event.stopPropagation();

      const position = Faze.Helpers.getElementPosition(wrapperNode);
      wrapper.viewport = this.getPageSize();

      const deltaX = parseInt(event.clientX, 10) - parseInt(position.x, 10);
      const deltaY = parseInt(event.clientY, 10) - parseInt(position.y, 10);

      wrapperNode.style.transition = '';
      wrapper.shiftX = deltaX;
      wrapper.shiftY = deltaY;

      wrapper.drag = {
        x: parseInt(position.x, 10),
        y: parseInt(position.y, 10),
      };

      Faze.Helpers.setElementStyle(wrapperNode, { cursor: 'move' });
    };

    /**
     * Останавливаем движение
     */
    const dragStop = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Кликаем на кнопки prev/next/close
      if (event.target && (event.target as HTMLElement).classList.contains('fas')) {
        delete wrapper.drag;
        Faze.Helpers.setElementStyle(wrapperNode, { cursor: 'zoom-out' });
        return;
      }

      const position = Faze.Helpers.getElementPosition(wrapperNode);
      if (wrapper.drag && position.x === wrapper.drag.x && position.y === wrapper.drag.y) {
        delete wrapper.drag;
        this.close(wrapperNode);
      } else {
        delete wrapper.drag;
        Faze.Helpers.setElementStyle(wrapperNode, { cursor: 'zoom-out' });
      }
    };

    /**
     * Перемещаем попап
     */
    const dragContinue = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (!('drag' in wrapper)) return;

      const pos = Faze.Helpers.getElementPosition(wrapperNode);
      const left = event.clientX - (wrapper.shiftX || 0);
      const top = event.clientY - (wrapper.shiftY || 0);

      const maxWidth = (wrapper?.viewport?.width || 0) - left - (wrapper.shiftX || 0);

      // Если очень маленький сдвиг, то ничего не делаем
      if (Math.abs(left - pos.x) < 5 && Math.abs(top - pos.y) < 5) return;
      if (maxWidth < 200) return;

      Faze.Helpers.setElementStyle(wrapperNode, { left: `${left}px`, top: `${top}px` });

      if ((wrapper.finalWidth || 0) > maxWidth) {
        Faze.Helpers.setElementStyle(wrapperNode, { maxWidth: `${maxWidth}px` });
      } else {
        wrapperNode.style.maxWidth = '';
      }
    };

    wrapperNode.addEventListener('mousedown', dragStart);
    wrapperNode.addEventListener('mousemove', dragContinue);
    wrapperNode.addEventListener('mouseleave', dragStop);
    wrapperNode.addEventListener('mouseout', dragStop);
    wrapperNode.addEventListener('mouseup', dragStop);

    this.zIndexCounter += 1;
  }

  /**
   * Попап плавно увеличивается/уменьшается в зависимости от картинки, движется в точку выравнивания
   */
  animateBox(settings: AnimateBoxSettings): void {
    const viewport = this.getPageSize();

    // Финальные размеры картинки
    let finalWidth;
    let finalHeight;

    // Картинка сплюснута по высоте относительно вьюпорта, т.е. картинка вытянута в длинну сильнее страницы значит ограничиваем ширину
    // картинки, высота точно влезет
    if (settings.fullWidth / settings.fullHeight > viewport.width / viewport.height) {
      finalWidth = Math.min(viewport.width - settings.wrapperShiftX * 2, settings.fullWidth);
      finalHeight = finalWidth * settings.fullHeight / settings.fullWidth;
    } else {
      // Картинка сплюснута по ширине относительно вьюпорта, т.е. страница вытянута в длину сильнее картинки значит ограничиваем высоту
      // картинки, ширина точно влезет
      finalHeight = Math.min(viewport.height - settings.wrapperShiftY * 2, settings.fullHeight);
      finalWidth = finalHeight * settings.fullWidth / settings.fullHeight;
    }

    // Финальную позицию врапера
    let finalLeft;
    let finalTop;

    const final = {
      x: {
        center: viewport.width / 2 - finalWidth / 2 - settings.wrapperShiftX,
        self: settings.initialLeft - (finalWidth - settings.initialWidth) / 2,
        left: 0,
        right: viewport.width - finalWidth - settings.wrapperShiftX,
      },
      y: {
        center: window.pageYOffset + viewport.height / 2 - finalHeight / 2 - settings.wrapperShiftY,
        self: settings.initialTop - (finalHeight - settings.initialHeight) / 2,
        top: window.pageYOffset,
        bottom: window.pageYOffset + viewport.height - finalHeight - settings.wrapperShiftY,
      },
    };

    switch (settings.align) {
      case 'center':
        finalLeft = final.x.center;
        finalTop = final.y.center;
        break;
      case 'left top':
        finalLeft = final.x.left;
        finalTop = final.y.top;
        break;
      case 'center top':
        finalLeft = final.x.center;
        finalTop = final.y.top;
        break;
      case 'right top':
        finalLeft = final.x.right;
        finalTop = final.y.top;
        break;
      case 'right center':
        finalLeft = final.x.right;
        finalTop = final.y.center;
        break;
      case 'right bottom':
        finalLeft = final.x.right;
        finalTop = final.y.bottom;
        break;
      case 'center bottom':
        finalLeft = final.x.center;
        finalTop = final.y.bottom;
        break;
      case 'left bottom':
        finalLeft = final.x.left;
        finalTop = final.y.bottom;
        break;
      case 'left center':
        finalLeft = final.x.left;
        finalTop = final.y.center;
        break;
      default:
        finalLeft = final.x.self;
        finalTop = final.y.self;
    }

    // Коррекция значений
    if (finalLeft <= 0) finalLeft = final.x.left;
    if (finalLeft > final.x.right) finalLeft = final.x.right;
    if (finalTop <= 0) finalTop = final.y.top;
    if (finalTop > final.y.bottom) finalTop = final.y.bottom;

    Faze.Helpers.setElementStyle(settings.fullImage, { width: `${finalWidth}px`, height: `${finalHeight}px` });
    Faze.Helpers.setElementStyle(settings.wrapperNode, { left: `${finalLeft}px`, top: `${finalTop}px` });

    settings.wrapper.finalWidth = finalWidth;
    settings.wrapper.finalHeight = finalHeight;

    // Через секунду убираем транзишен
    setTimeout(() => {
      settings.fullImage.style.transition = '';
      settings.wrapperNode.style.transition = '';
    }, this.config.transition.time);
  }

  /**
   * Меняем картинку в попапе, работает как prevBox или nextBox
   */
  changeBox(event: Event, wrapper: WrapperData, dir: string) {
    // event.preventDefault();
    // event.stopPropagation();

    // const oldThumb = wrapper.thumbnailImageNode;
    // const oldFull = wrapper.fullImageNode;

    // const imageWidth = oldFull.width;
    // const imageHeight = oldFull.height;

    // const wrapperPos = Faze.Helpers.getElementPosition(wrapper.node);
    // const initialLeft = wrapperPos.x;
    // const initialTop = wrapperPos.y;

    // const newThumb = oldThumb.zoomdata[dir];	// где dir = prev,next
    // const fullSrc = newThumb.dataset.zoomboxImage;

    // const newFull = new Image;
    // newFull.src = fullSrc;
    // newFull.onload = () => {
    //   Faze.Helpers.setElementStyle(oldThumb, { visibility: 'visible' });
    //   wrapper.node.removeChild(oldFull);

    //   newThumb.fullImage = newFull;
    //   Faze.Helpers.setElementStyle(newThumb, { visibility: 'hidden' });

    //   const fullSize = this.getFullSize(newThumb, newFull);

    //   // Вычислим размер и положение попапа
    //   const thumbWidth = newThumb.width;
    //   const thumbHeight = newThumb.height;
    //   const align = 'self';

    //   const thumbPos = Faze.Helpers.getElementPosition(newThumb);

    //   // Обновим данные для врапера
    //   wrapper.thumbnailImageNode = newThumb;
    //   wrapper.fullImageNode = newFull;
    //   wrapper.thumbnailData = {
    //     width: thumbWidth,
    //     height: thumbHeight,
    //     left: thumbPos.x,
    //     top: thumbPos.y,
    //     shiftX: 0,
    //     shiftY: 0,
    //   };

    //   // Помещаем во враппер картинку
    //   Faze.Helpers.setElementAttributes(newFull, { border: 0, width: imageWidth, height: imageHeight });
    //   Faze.Helpers.setElementStyle(newFull, {
    //     display: 'block',
    //     width: `${imageWidth}px`,
    //     height: `${imageHeight}px`,
    //     transition: this.config.transition.size,
    //   });

    //   wrapper.node.insertBefore(newFull, wrapper.node.firstChild);

    //   // Меняем заголовок
    //   if (wrapper.titleNode) {
    //     wrapper.titleNode.textContent = newThumb.dataset.zoomboxTitle || newFull.src.replace(/.+\/([^/]+)$/, '$1');
    //   }

    //   // Исходная позиция врапера
    //   Faze.Helpers.setElementStyle(wrapper.node, {
    //     maxWidth: '',
    //     transition: this.config.transition.move,
    //   });

    //   // Конечная позиция враппера
    //   this.animateBox({
    //     wrapper,
    //     align,
    //     initialLeft,
    //     initialTop,

    //     wrapperNode: wrapper.node,

    //     fullImage: newFull,

    //     fullWidth: fullSize.width,
    //     fullHeight: fullSize.height,

    //     wrapperShiftX: wrapper.shiftX || 0,
    //     wrapperShiftY: wrapper.shiftY || 0,

    //     initialWidth: imageWidth,
    //     initialHeight: imageHeight,
    //   });
    // };
  }

  /**
   * Получение размеров экрана
   *
   * @return{Size} - Размер страницы
   */
  private getPageSize(): Size {
    const paddingLeft = parseInt(window.getComputedStyle(document.body, null).paddingLeft, 10);
    const paddingRight = parseInt(window.getComputedStyle(document.body, null).paddingRight, 10);
    const paddingTop = parseInt(window.getComputedStyle(document.body, null).paddingTop, 10);
    const paddingBottom = parseInt(window.getComputedStyle(document.body, null).paddingBottom, 10);

    const fullWidth = document.body.offsetWidth;
    const width = fullWidth - paddingLeft - paddingRight;
    const fullHeight = window.innerHeight;
    const height = fullHeight - paddingTop - paddingBottom;

    return {
      width,
      height,
    };
  }

  /**
   * Определяем размеры будущей картинки
   *
   * @param thumbnailImageNode - DOM элемент изображения до увеличения
   * @param fullImageNode      - DOM элемент изображения после увеличения
   *
   * @return{Size} - Настоящий размер картинки, который помещается во вьюпорт
   */
  private getFullSize(thumbnailImageNode: HTMLElement, fullImageNode?: HTMLImageElement): Size {
    let fullWidth;
    let fullHeight;

    // Если высота и ширина заданы в data атрибутах
    if (thumbnailImageNode.dataset.fazeZoomboxWidth && thumbnailImageNode.dataset.fazeZoomboxHeight) {
      // Заданы оба атрибута
      fullWidth = parseInt(thumbnailImageNode.dataset.fazeZoomboxWidth, 10);
      fullHeight = parseInt(thumbnailImageNode.dataset.fazeZoomboxHeight, 10);
    } else if (thumbnailImageNode.dataset.fazeZoomboxWidth && fullImageNode) {
      // Задана только ширина
      fullWidth = parseInt(thumbnailImageNode.dataset.fazeZoomboxWidth, 10);
      fullHeight = fullWidth * fullImageNode.height / fullImageNode.width;
    } else if (thumbnailImageNode.dataset.fazeZoomboxHeight && fullImageNode) {
      // Задана только высота
      fullHeight = parseInt(thumbnailImageNode.dataset.fazeZoomboxHeight, 10);
      fullWidth = fullHeight * fullImageNode.width / fullImageNode.height;
    } else {
      // Атрибуты не заданы
      fullWidth = fullImageNode?.width || 0;
      fullHeight = fullImageNode?.height || 0;
    }

    return {
      width: fullWidth,
      height: fullHeight,
    };
  }

  /**
   * Закрываем зумбокс
   */
  private close(wrapperNode: any) {
    const thumbImage = wrapperNode.zoomdata.thumbImage;
    const fullImage = wrapperNode.zoomdata.fullImage;

    // Через секунду убиваем враппер
    setTimeout(() => {
      delete thumbImage.fullImage;
      Faze.Helpers.setElementStyle(thumbImage, { visibility: 'visible' });
      wrapperNode.parentNode.removeChild(wrapperNode);
    }, this.config.transition.time);

    const finalLeft = wrapperNode.zoomdata.thumb_left - wrapperNode.zoomdata.wrapper_shiftX + wrapperNode.zoomdata.thumb_shiftX;
    const finalTop = wrapperNode.zoomdata.thumb_top - wrapperNode.zoomdata.wrapper_shiftY + wrapperNode.zoomdata.thumb_shiftY;
    const finalWidth = wrapperNode.zoomdata.thumb_width;
    const finalHeight = wrapperNode.zoomdata.thumb_height;

    // Возвращаем на место и уменьшаем размеры до первоначальных
    Faze.Helpers.setElementStyle(fullImage, {
      transition: this.config.transition.size,
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
    });
    Faze.Helpers.setElementStyle(wrapperNode, { transition: this.config.transition.move, left: `${finalLeft}px`, top: `${finalTop}px` });
  }
}

export default Zoombox;
