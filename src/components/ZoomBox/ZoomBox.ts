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

interface AnimateBoxSettings {
  fullImage: HTMLImageElement;
  wrapperNode: any;
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
  readonly callerNodes: HTMLElement[];

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
  constructor(nodes: HTMLElement[] | null, config: Partial<Config>) {
    // Инициализация логгера
    this.logger = new Logger('Модуль Faze.Zoombox:');

    if (!nodes) {
      this.logger.error('Не найдены DOM элементы для работы модуля!');
      return;
    }

    // Проверка на двойную инициализацию
    nodes.forEach((node: HTMLElement) => {
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

  }

  /**
   * Навешивание событий
   */
  bind(): void {

  }

  /**
   * Открываем попап с картинкой fullImage для заданной миниатюры thumbImage
   */
  openBox(thumbnailImageNode, fullImageNode) {
    thumbnailImageNode.fullImage = fullImageNode;
    Faze.Helpers.setElementStyle(thumbnailImageNode, {visibility: 'hidden'});  // visibility: hidden;

    const fullSize = this.getFullSize(thumbnailImageNode, fullImageNode);

    // Создаём враппер размером 1x1 пикселя, который будет сам(!) растягиваться по контенту
    const wrapperNode = document.createElement('div');

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
    const thumbShiftX = parseInt(window.getComputedStyle(thumbnailImageNode, null).borderLeftWidth,10);
    const thumbShiftY = parseInt(window.getComputedStyle(thumbnailImageNode, null).borderTopWidth, 10);

    // Вычислим размер и положение попапа
    const thumbWidth = thumbnailImageNode.width;
    const thumbHeight = thumbnailImageNode.height;
    const align = thumbnailImageNode.dataset.zoomboxAlign;

    const thumbPos = Faze.Helpers.getElementPosition(thumbnailImageNode);
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
    Faze.Helpers.setElementAttributes(fullImage, {border: '0'});
    Faze.Helpers.setElementStyle(fullImage, {
      display: 'block',
      width: `${thumbWidth}px`,
      height: `${thumbHeight}px`,
      transition: this.config.transition.size,
    });
    wrapperNode.appendChild(fullImage);


    // Сохраним значения на будущее
    wrapperNode.zoomdata = {
      thumbImage,
      fullImage,

      wrapper_shiftX: wrapperShiftX,
      wrapper_shiftY: wrapperShiftY,

      thumb_width: thumbWidth,
      thumb_height: thumbHeight,
      thumb_shiftX: thumbShiftX,
      thumb_shiftY: thumbShiftY,
      thumb_left: thumbPos.x,
      thumb_top: thumbPos.y,
    };

    if (this.config.showTitle) {
      const titleDiv = document.createElement('div', {}, {}, wrapperNode);
      titleDiv.textContent = thumbnailImageNode.dataset.zoomboxTitle || fullImage.src.replace(/.+\/([^/]+)$/, '$1');
      titleDiv.classList.add('zoom-box-title');
      wrapperNode.zoomdata.titleDiv = titleDiv;
    }

    // Иконки управления можно расположить только тогда, когда уже есть размеры враппера, после вставки в него картинки
    if (this.config.showClose) {
      const closeDiv = Faze.Helpers.createElement('i', {}, {
        position: 'absolute',
        right: '15px',
        top: '15px',
        fontSize: '30px',
        color: 'white',
        cursor: 'pointer',
        zIndex: zIndexCounter + 1
      }, wrapperNode);
      closeDiv.classList.add('fas');
      closeDiv.classList.add('fa-times');
      closeDiv.addEventListener('click', () => {
        this.closeBox(wrapperNode);
      });
      wrapperNode.zoomdata.closeDiv = closeDiv;
    }

    // Если попап это галерея
    if (thumbnailImageNode.zoomdata && thumbnailImageNode.zoomdata.prevThumb) {
      const prevDiv = Faze.Helpers.createElement('i', {title: thumbnailImageNode.zoomdata.prevIndex}, {
        position: 'absolute',
        left: '15px',
        top: '50%',
        fontSize: '30px',
        color: 'white',
        cursor: 'pointer',
        zIndex: (this.zIndexCounter + 1).toString(),
      }, wrapperNode);
      prevDiv.classList.add('fas');
      prevDiv.classList.add('fa-arrow-circle-left');
      prevDiv.addEventListener('click', (e) => {
        changeBox(e, wrapperNode, 'prevThumb');
      });
      wrapperNode.zoomdata.prevDiv = prevDiv;
    }
    if (thumbnailImageNode.zoomdata && thumbnailImageNode.zoomdata.nextThumb) {
      const nextDiv = Faze.Helpers.createElement('i', {title: thumbnailImageNode.zoomdata.nextIndex}, {
        position: 'absolute',
        right: '15px',
        top: '50%',
        fontSize: '30px',
        color: 'white',
        cursor: 'pointer',
        zIndex: (this.zIndexCounter + 1).toString(),
      }, wrapperNode);
      nextDiv.classList.add('fas');
      nextDiv.classList.add('fa-arrow-circle-right');
      nextDiv.addEventListener('click', (e) => {
        this.changeBox(e, wrapperNode, 'nextThumb');
      });
      wrapperNode.zoomdata.nextDiv = nextDiv;
    }

    // Исходная позиция врапера
    Faze.Helpers.setElementStyle(wrapperNode, {
      left: `${initialLeft}px`,
      top: `${initialTop}px`,
      transition: this.config.transition.move,
    });

    // Конечная позиция враппера
    this.animateBox({
      fullImage,
      wrapperNode,

      full_width: fullsize.width,
      full_height: fullsize.height,

      wrapper_shiftX: wrapperShiftX,
      wrapper_shiftY: wrapperShiftY,

      align,
      initial_left: initialLeft,
      initial_top: initialTop,
      initial_width: thumbWidth,
      initial_height: thumbHeight,
    });

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

    Faze.Helpers.setElementStyle(settings.fullImage, {width: `${finalWidth}px`, height: `${finalHeight}px`});
    Faze.Helpers.setElementStyle(settings.wrapperNode, {left: `${finalLeft}px`, top: `${finalTop}px`});

    settings.wrapperNode.zoomdata.final_width = finalWidth;
    settings.wrapperNode.zoomdata.final_height = finalHeight;

    // Через секунду убираем транзишен
    setTimeout(() => {
      settings.fullImage.style.transition = '';
      settings.wrapperNode.style.transition = '';
    }, this.config.transition.time);
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
  private getFullSize(thumbnailImageNode: HTMLImageElement, fullImageNode: HTMLImageElement): Size {
    let fullWidth;
    let fullHeight;

    // Если высота и ширина заданы в data атрибутах
    if (thumbnailImageNode.dataset.fazeZoomboxWidth && thumbnailImageNode.dataset.fazeZoomboxHeight) {
      // Заданы оба атрибута
      fullWidth = parseInt(thumbnailImageNode.dataset.fazeZoomboxWidth, 10);
      fullHeight = parseInt(thumbnailImageNode.dataset.fazeZoomboxHeight, 10);
    } else if (thumbnailImageNode.dataset.fazeZoomboxWidth) {
      // Задана только ширина
      fullWidth = parseInt(thumbnailImageNode.dataset.fazeZoomboxWidth, 10);
      fullHeight = fullWidth * fullImageNode.height / fullImageNode.width;
    } else if (thumbnailImageNode.dataset.fazeZoomboxHeight) {
      // Задана только высота
      fullHeight = parseInt(thumbnailImageNode.dataset.fazeZoomboxHeight, 10);
      fullWidth = fullHeight * fullImageNode.width / fullImageNode.height;
    } else {
      // Атрибуты не заданы
      fullWidth = fullImageNode.width || thumbnailImageNode.width;
      fullHeight = fullImageNode.height || thumbnailImageNode.height;
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
      Faze.Helpers.setElementStyle(thumbImage, {visibility: 'visible'});
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
      height: `${finalHeight}px`
    });
    Faze.Helpers.setElementStyle(wrapperNode, {transition: this.config.transition.move, left: `${finalLeft}px`, top: `${finalTop}px`});
  }

  /**
   * Начинаем тащить попап, т.е. нажали на кнопку мыши и тянем
   */
  private dragStart(event: any) {
    event.preventDefault();
    event.stopPropagation();

    const wrapperNode = this;
    const position = Faze.Helpers.getElementPosition(wrapperNode);
    wrapperNode.zoomdata.viewport = page_size();							// видимый размер окна (вьюпорт)

    const deltaX = parseInt(event.clientX, 10) - parseInt(position.x, 10);
    const deltaY = parseInt(event.clientY, 10) - parseInt(position.y, 10);

    wrapperNode.style.transition = '';
    wrapperNode.zoomdata.shiftX = deltaX;
    wrapperNode.zoomdata.shiftY = deltaY;

    wrapperNode.zoomdata.drag = {
      start_x: parseInt(position.x, 10),
      start_y: parseInt(position.y, 10),
    };

    Faze.Helpers.setElementStyle(wrapperNode, {cursor: 'move'});
  }

  /**
   * Останавливаем движение
   */
  private dragStop(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    var wrapperNode = this;

    // Кликаем на кнопки prev/next/close
    if (event.target && event.target.classList.contains('fas')) {
      delete wrapperNode.zoomdata.drag;
      Faze.Helpers.setElementStyle(wrapperNode, {cursor: 'zoom-out'});
      return;
    }

    const position = Faze.Helpers.getElementPosition(wrapperNode);
    if (wrapperNode.zoomdata.drag && position.x === wrapperNode.zoomdata.drag.start_x && position.y === wrapperNode.zoomdata.drag.start_y) {
      delete wrapperNode.zoomdata.drag;
      this.closeBox(wrapperNode);
    } else {
      delete wrapperNode.zoomdata.drag;
      Faze.Helpers.setElementStyle(wrapperNode, {cursor: 'zoom-out'});
    }
  }

  /**
   * Перемещаем попап
   */
  private dragContinue(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const wrapperNode = this;
    if (!('drag' in wrapperNode.zoomdata)) return;

    const pos = Faze.Helpers.getElementPosition(wrapperNode);
    const left = event.clientX - parseInt(wrapperNode.zoomdata.shiftX, 10);
    const top = event.clientY - parseInt(wrapperNode.zoomdata.shiftY, 10);

    const maxWidth = wrapperNode.zoomdata.viewport.width - left - wrapperNode.zoomdata.wrapper_shiftX;

    // Если очень маленький сдвиг, то ничего не делаем
    if (Math.abs(left - pos.x) < 5 && Math.abs(top - pos.y) < 5) return;
    if (maxWidth < 200) return;

    Faze.Helpers.setElementStyle(wrapperNode, {left: `${left}px`, top: `${top}px`});

    if (wrapperNode.zoomdata.final_width > maxWidth) {
      Faze.Helpers.setElementStyle(wrapperNode, {maxWidth: `${maxWidth}px`});
    } else {
      wrapperNode.style.maxWidth = '';
    }
  }
}

export default Zoombox;

function ZoomBox(config) {


  /*
    Все функции библиотеки:

    function animateBox(options)					попап изменяется до нужных размеров и движется к точке выравнивания
    function getFullSize(thumbImage,fullImage)		определяем допустимые размеры картинки исходя из data атрибтов, размеров окна
    function changeBox(e, wrapperNode, dir)			меняем картинку в попапе (показываем следующую или предыдущую, prev/next)
    function openBox(thumbImage,fullImage)			открываем попап по клику на миниатюру

    function dragStart(e)							начинаем перетаскивать попап
    function dragStop(e)							заканчиваем перетаскавать или закрываем попап
    function dragContinue(e)						тащим попап, меняем координаты
    function closeBox(wrapperNode)					закрываем попап
    function init()									инициализация всех попапов

    function Faze.Helpers.getElementPosition(el)					вспомогательные функции
    function Faze.Helpers.setElementAttributes(el, attribs)
    function Faze.Helpers.setElementStyle(el, styles)
    function Faze.Helpers.createElement(tag, attribs, styles, parent)

  */


  /**
   * Меняем картинку в попапе, работает как prevBox или nextBox
   */
  function changeBox(e, wrapperNode, dir) {
    e.preventDefault();
    e.stopPropagation();

    var oldThumb = wrapperNode.zoomdata.thumbImage;
    var oldFull = wrapperNode.zoomdata.fullImage;

    var image_width = oldFull.width;
    var image_height = oldFull.height;

    const wrapperPos = Faze.Helpers.getElementPosition(wrapperNode);		// текущее положение врапера на странице
    var initialLeft = wrapperPos.x;
    var initialTop = wrapperPos.y;

    var newThumb = oldThumb.zoomdata[dir];	// где dir = prev,next
    var full_src = newThumb.dataset.zoomboxImage;
    var src = newThumb.src;

    var newFull = new Image;
    newFull.src = full_src;
    newFull.onload = function () {

      Faze.Helpers.setElementStyle(oldThumb, {visibility: 'visible'});	// visibility: hidden;
      delete oldThumb.fullImage;
      wrapperNode.removeChild(oldFull);

      newThumb.fullImage = newFull;
      Faze.Helpers.setElementStyle(newThumb, {visibility: 'hidden'});  // visibility: hidden;

      var fullsize = getFullSize(newThumb, newFull);

      // Вычислим размер и положение попапа
      const thumb_width = newThumb.width;
      const thumb_height = newThumb.height;
      const align = 'self';

      const thumbPos = Faze.Helpers.getElementPosition(newThumb);		// положение превьюшки на странице

      // Обновим данные для врапера
      wrapperNode.zoomdata.thumbImage = newThumb;
      wrapperNode.zoomdata.fullImage = newFull;
      wrapperNode.zoomdata.thumb_width = thumb_width;
      wrapperNode.zoomdata.thumb_height = thumb_height;
      wrapperNode.zoomdata.thumb_left = thumbPos.x;
      wrapperNode.zoomdata.thumb_top = thumbPos.y;

      // Помещаем во враппер картинку
      Faze.Helpers.setElementAttributes(newFull, {border: 0, width: image_width, height: image_height});
      Faze.Helpers.setElementStyle(newFull, {
        display: 'block',
        width: image_width + 'px',
        height: image_height + 'px',
        transition: trans_length
      });
      // https://stackoverflow.com/questions/2007357/how-to-set-dom-element-as-the-first-child
      wrapperNode.insertBefore(newFull, wrapperNode.firstChild);

      // Меняем заголовок
      if (wrapperNode.zoomdata.titleDiv) wrapperNode.zoomdata.titleDiv.textContent = newThumb.dataset.zoomboxTitle || newFull.src.replace(/.+\/([^/]+)$/, '$1');

      // Исходная позиция врапера
      Faze.Helpers.setElementStyle(wrapperNode, {
        maxWidth: '',
        transition: trans_move
      });

      // Конечная позиция враппера
      this.animateBox({
        fullImage: newFull,
        wrapperNode: wrapperNode,

        full_width: fullsize.width,
        full_height: fullsize.height,

        wrapper_shiftX: wrapperNode.zoomdata.wrapper_shiftX,
        wrapper_shiftY: wrapperNode.zoomdata.wrapper_shiftY,

        align: align,
        initial_left: initialLeft,
        initial_top: initialTop,
        initial_width: image_width,
        initial_height: image_height,
      });
    }; // onload
  }


  /**
   * Инициализация
   */
  function init() {
    const allThumbs = document.querySelectorAll<HTMLElement>('img[data-faze-zoombox-image]');

    allThumbs.forEach((imageNode) => {
      Faze.Helpers.setElementStyle(imageNode, {cursor: 'zoom-in'});

      // Если это галерея
      if (imageNode.dataset.zoomboxGallery) {
        const gallery = imageNode.dataset.zoomboxGallery;
        const galleryThumbs = document.querySelectorAll(`img[data-faze-zoombox-image][data-faze-zoombox-gallery="${gallery}"]`);
        if (galleryThumbs.length > 1) {
          const index = galleryThumbs.indexOf(imageNode);
          const next = (index + 1 < galleryThumbs.length) ? index + 1 : 0;
          const prev = (index - 1 >= 0) ? index - 1 : galleryThumbs.length - 1;

          imageNode.zoomdata = {
            prevThumb: galleryThumbs[prev],
            nextThumb: galleryThumbs[next],
            prevIndex: prev,
            nextIndex: next,
          };
        }
      }

      imageNode.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        const thumbImage = <any>event.target;

        // Если попап открыт для данной миниатюры, ничего не делаем
        if (thumbImage && thumbImage.fullImage) {
          return;
        }

        const fullSrc = thumbImage.dataset.zoomboxImage;
        const fullImage = new Image;
        fullImage.src = fullSrc;
        fullImage.onload = function () {
          openBox(thumbImage, fullImage);
        };
      });
    });
  }

  init();
}
