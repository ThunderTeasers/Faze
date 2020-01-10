
// /*
//  * Name: zoombox.js
//  * Date: 2019-10-24
//  * Desc: Открывает попап с большой картинкой при клике на миниатюру
//  * Author: Pavel Publichenko, plarson.ru
//
//  Используются стили:
//
//  <div class="zoom-box-wrapper">
//  <img>
//  <div class="zoom-box-title"></div>
//  <i class="fas fa-times"></i>
//  <i class="fas fa-arrow-circle-left"></i>
//  <i class="fas fa-arrow-circle-right"></i>
//  </div>
//
//  Пример использования:
//
//  @import url("/fonts/font-awesome/5.6.3/font-awesome.less.css");
//
//  window.onload = function () { ZoomBox(); }
//  window.onload = function () { ZoomBox({show_close:1, show_title:0}); }
//
//  <img src="https://snpro-expo.com/tc160x120/i/photo/Image00339.jpg" width=160 height=120 border=1
//    data-zoombox-image="https://snpro-expo.com/i/photo/Image00339.jpg"
//    data-zoombox-align="right bottom"
//    data-zoombox-title="большая фото 1920 x 1280"
//    data-zoombox-width="960"
//    data-zoombox-height="640">
//
//  <img src="https://plarson.ru/i/attribute/nginx.svg" border=1 width="200" height="42"
//    data-zoombox-image="https://plarson.ru/i/attribute/nginx.svg"
//    data-zoombox-title="NGINX"
//    data-zoombox-width="2500"
//    data-zoombox-height="527">
//
//    Возможные варианты выравнивания попапа:
//    center
//    left top
//    center top
//    right top
//    right center
//    right bottom
//    center bottom
//    left bottom
//    left center
//
//    По умолчанию попап выравнивается по центру миниатюры
//
//  */
//
// 'use strict';
//
// var $ = function (selector) {
//   return document.querySelector(selector)
// };
// if (!NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;	// для IE11
// if (!NodeList.prototype.indexOf) NodeList.prototype.indexOf = Array.prototype.indexOf;	// для IE11
//
// function ZoomBox(config) {
//   var zIndexCounter = 1;
//
//   var trans_length = 'width 0.5s, height 0.5s';
//   var trans_move = 'left 0.5s, top 0.5s';
//   var trans_time = 500;	// милисекунды из транзишенов выше
//   var show_close = 1;
//   var show_title = 1;
//
//   if (config && 'show_close' in config) show_close = config.show_close;
//   if (config && 'show_title' in config) show_title = config.show_title;
//
//   function page_size() {
//     var padding_left = parseInt(window.getComputedStyle(document.body, null).paddingLeft);
//     var padding_right = parseInt(window.getComputedStyle(document.body, null).paddingRight);
//     var padding_top = parseInt(window.getComputedStyle(document.body, null).paddingTop);
//     var padding_bottom = parseInt(window.getComputedStyle(document.body, null).paddingBottom);
//     // document.documentElement.clientWidth == document.body.clientWidth == document.documentElement.offsetWidth == document.body.offsetWidth
//     var full_width = document.body.offsetWidth;
//     var width = full_width - padding_left - padding_right;
//     var full_height = window.innerHeight;
//     var height = full_height - padding_top - padding_bottom;
//
//     return {
//       padding_left: padding_left,
//       padding_right: padding_right,
//       padding_top: padding_top,
//       width: width,		// доступная ширина для контента внутри body
//       height: height,
//     };
//   }
//
//
//   /*
//     Все функции библиотеки:
//
//     function animateBox(options)					попап изменяется до нужных размеров и движется к точке выравнивания
//     function getFullSize(thumbImage,fullImage)		определяем допустимые размеры картинки исходя из data атрибтов, размеров окна
//     function changeBox(e, wrapperNode, dir)			меняем картинку в попапе (показываем следующую или предыдущую, prev/next)
//     function openBox(thumbImage,fullImage)			открываем попап по клику на миниатюру
//
//     function dragStart(e)							начинаем перетаскивать попап
//     function dragStop(e)							заканчиваем перетаскавать или закрываем попап
//     function dragContinue(e)						тащим попап, меняем координаты
//     function closeBox(wrapperNode)					закрываем попап
//     function init()									инициализация всех попапов
//
//     function getElemPosition(el)					вспомогательные функции
//     function setElemAttr(el, attribs)
//     function setElemStyle(el, styles)
//     function createElem(tag, attribs, styles, parent)
//
//   */
//
//
//   /**
//    * Попап плавно увеличивается/уменьшается в зависимости от картинки, движется в точку выравнивания
//    */
//   function animateBox(options) {
//     const viewport = page_size();					// видимый размер окна (вьюпорт)
//
//     var fullImage = options.fullImage;
//     var wrapperNode = options.wrapperNode;
//
//     var full_width = parseInt(options.full_width);
//     var full_height = parseInt(options.full_height);
//     var wrapper_shiftX = parseInt(options.wrapper_shiftX);
//     var wrapper_shiftY = parseInt(options.wrapper_shiftY);
//
//     var initial_left = parseInt(options.initial_left);
//     var initial_top = parseInt(options.initial_top);
//     var initial_width = parseInt(options.initial_width);
//     var initial_height = parseInt(options.initial_height);
//     var align = options.align;
//
//     // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
//     // Вычисляем финальные размеры картинки
//     var final_width = null;
//     var final_height = null;
//
//     // картинка сплюснута по высоте относительно вьюпорта, т.е. картинка вытянута в длинну сильнее страницы
//     // значит ограничиваем ширину картинки, высота точно влезет
//     if (full_width / full_height > viewport.width / viewport.height) {
//       final_width = Math.min(viewport.width - wrapper_shiftX * 2, full_width);
//       final_height = final_width * full_height / full_width;
//     }
//       // картинка сплюснута по ширине относительно вьюпорта, т.е. страница вытянута в длину сильнее картинки
//     // значит ограничиваем высоту картинки, ширина точно влезет
//     else {
//       final_height = Math.min(viewport.height - wrapper_shiftY * 2, full_height);
//       final_width = final_height * full_width / full_height;
//     }
//
//     // Вычисляем финальную позицию врапера
//     var final_left, final_top;
//
//     var final = {
//       x: {
//         center: viewport.padding_left + viewport.width / 2 - final_width / 2 - wrapper_shiftX,
//         self: initial_left - (final_width - initial_width) / 2,
//         left: viewport.padding_left,
//         right: viewport.width - final_width - wrapper_shiftX,
//       },
//       y: {
//         center: window.pageYOffset + viewport.height / 2 - final_height / 2 - wrapper_shiftY,
//         self: initial_top - (final_height - initial_height) / 2,
//         top: window.pageYOffset,
//         bottom: window.pageYOffset + viewport.height - final_height - wrapper_shiftY,
//       }
//     };
//
//     if (align == 'center') {
//       final_left = final.x.center;
//       final_top = final.y.center;
//     } else if (align == 'left top') {
//       final_left = final.x.left;
//       final_top = final.y.top;
//     } else if (align == 'center top') {
//       final_left = final.x.center;
//       final_top = final.y.top;
//     } else if (align == 'right top') {
//       final_left = final.x.right;
//       final_top = final.y.top;
//     } else if (align == 'right center') {
//       final_left = final.x.right;
//       final_top = final.y.center;
//     } else if (align == 'right bottom') {
//       final_left = final.x.right;
//       final_top = final.y.bottom;
//     } else if (align == 'center bottom') {
//       final_left = final.x.center;
//       final_top = final.y.bottom;
//     } else if (align == 'left bottom') {
//       final_left = final.x.left;
//       final_top = final.y.bottom;
//     } else if (align == 'left center') {
//       final_left = final.x.left;
//       final_top = final.y.center;
//     } else {
//       final_left = final.x.self;
//       final_top = final.y.self;
//     }
//
//     // коррекция
//     if (final_left <= 0) final_left = final.x.left;
//     if (final_left > final.x.right) final_left = final.x.right;
//     if (final_top <= 0) final_top = final.y.top;
//     if (final_top > final.y.bottom) final_top = final.y.bottom;
//
//     window.getComputedStyle(fullImage).width;
//     window.getComputedStyle(fullImage).height;
//     setElemStyle(fullImage, {width: final_width + 'px', height: final_height + 'px'});
//
//     window.getComputedStyle(wrapperNode).left;
//     window.getComputedStyle(wrapperNode).top;
//     setElemStyle(wrapperNode, {left: final_left + 'px', top: final_top + 'px'});
//
//     wrapperNode.zoomdata.final_width = final_width;
//     wrapperNode.zoomdata.final_height = final_height;
//
//     // Через секунду убираем транзишен
//     setTimeout(function () {
//       fullImage.style.transition = '';
//       wrapperNode.style.transition = '';
//     }, trans_time);
//
//   }//animateBox
//
//
//   /**
//    * Определяем размеры будущей картинки
//    */
//   function getFullSize(thumbImage, fullImage) {
//     var full_width = null;
//     var full_height = null;
//
//     // Проверим атрибуты
//     // Высота и ширина попапа заданы в дата-атрибутах
//     if (thumbImage.dataset.zoomboxWidth && thumbImage.dataset.zoomboxHeight) {
//       // Заданы оба атрибута
//       full_width = parseInt(thumbImage.dataset.zoomboxWidth);
//       full_height = parseInt(thumbImage.dataset.zoomboxHeight);
//     }
//     // Задана только ширина попапа
//     else if (thumbImage.dataset.zoomboxWidth) {
//       full_width = parseInt(thumbImage.dataset.zoomboxWidth);
//       full_height = full_width * fullImage.height / fullImage.width;
//     }
//     // Задана только высота попапа
//     else if (thumbImage.dataset.zoomboxHeight) {
//       full_height = parseInt(thumbImage.dataset.zoomboxHeight);
//       full_width = full_height * fullImage.width / fullImage.height;
//     }
//     // Дата-атрибуты не заданы
//     else {
//       // Атрибуты не заданы
//       full_width = fullImage.width || thumb_width;	// размеры картинки после подгрузки. В случае SVG неизвестны
//       full_height = fullImage.height || thumb_height;
//     }
//
//     return {
//       width: full_width,
//       height: full_height,
//     }
//   }//getFullSize
//
//   /**
//    * Меняем картинку в попапе, работает как prevBox или nextBox
//    */
//   function changeBox(e, wrapperNode, dir) {
//     e.preventDefault();
//     e.stopPropagation();
//
//     var oldThumb = wrapperNode.zoomdata.thumbImage;
//     var oldFull = wrapperNode.zoomdata.fullImage;
//
//     var image_width = oldFull.width;
//     var image_height = oldFull.height;
//
//     const wrapperPos = getElemPosition(wrapperNode);		// текущее положение врапера на странице
//     var initial_left = wrapperPos.x;
//     var initial_top = wrapperPos.y;
//
//     var newThumb = oldThumb.zoomdata[dir];	// где dir = prev,next
//     var full_src = newThumb.dataset.zoomboxImage;
//     var src = newThumb.src;
//
//     var newFull = new Image;
//     newFull.src = full_src;
//     newFull.onload = function () {
//
//       setElemStyle(oldThumb, {visibility: 'visible'});	// visibility: hidden;
//       delete oldThumb.fullImage;
//       wrapperNode.removeChild(oldFull);
//
//       newThumb.fullImage = newFull;
//       setElemStyle(newThumb, {visibility: 'hidden'});  // visibility: hidden;
//
//       var fullsize = getFullSize(newThumb, newFull);
//
//       // Вычислим размер и положение попапа
//       const thumb_width = newThumb.width;
//       const thumb_height = newThumb.height;
//       const align = 'self';
//
//       const thumbPos = getElemPosition(newThumb);		// положение превьюшки на странице
//
//       // Обновим данные для врапера
//       wrapperNode.zoomdata.thumbImage = newThumb;
//       wrapperNode.zoomdata.fullImage = newFull;
//       wrapperNode.zoomdata.thumb_width = thumb_width;
//       wrapperNode.zoomdata.thumb_height = thumb_height;
//       wrapperNode.zoomdata.thumb_left = thumbPos.x;
//       wrapperNode.zoomdata.thumb_top = thumbPos.y;
//
//       // Помещаем во враппер картинку
//       setElemAttr(newFull, {border: 0, width: image_width, height: image_height});
//       setElemStyle(newFull, {display: 'block', width: image_width + 'px', height: image_height + 'px', transition: trans_length});
//       // https://stackoverflow.com/questions/2007357/how-to-set-dom-element-as-the-first-child
//       wrapperNode.insertBefore(newFull, wrapperNode.firstChild);
//
//       // Меняем заголовок
//       if (wrapperNode.zoomdata.titleDiv) wrapperNode.zoomdata.titleDiv.textContent = newThumb.dataset.zoomboxTitle || newFull.src.replace(/.+\/([^/]+)$/, '$1');
//
//       // Исходная позиция врапера
//       setElemStyle(wrapperNode, {
//         maxWidth: '',
//         transition: trans_move
//       });
//
//       // Конечная позиция враппера
//       animateBox({
//         fullImage: newFull,
//         wrapperNode: wrapperNode,
//
//         full_width: fullsize.width,
//         full_height: fullsize.height,
//
//         wrapper_shiftX: wrapperNode.zoomdata.wrapper_shiftX,
//         wrapper_shiftY: wrapperNode.zoomdata.wrapper_shiftY,
//
//         align: align,
//         initial_left: initial_left,
//         initial_top: initial_top,
//         initial_width: image_width,
//         initial_height: image_height,
//       });
//     }; // onload
//
//   }//changeBox
//
//
//   /**
//    * Открываем попап с картинкой fullImage для заданной миниатюры thumbImage
//    */
//   function openBox(thumbImage, fullImage) {
//     thumbImage.fullImage = fullImage;
//     setElemStyle(thumbImage, {visibility: 'hidden'});  // visibility: hidden;
//
//     var fullsize = getFullSize(thumbImage, fullImage);
//
//     // Создаём враппер размером 1x1 пикселя, который будет сам(!) растягиваться по контенту
//     var wrapperNode = document.createElement('div');
//
//     setElemStyle(wrapperNode, {
//       position: 'absolute',
//       cursor: 'zoom-out',
//       minWidth: '1px',
//       minHeight: '1px',
//       overflowX: 'hidden',
//       zIndex: zIndexCounter,
//     });
//     document.body.appendChild(wrapperNode);
//     wrapperNode.classList.add('zoom-box-wrapper');
//
//     // Вычислим сдвиг (отступ) левого верхнего угла враппера от его содержимого 1x1
//     const wrapper_shiftX = parseInt(window.getComputedStyle(wrapperNode, null).borderLeftWidth) + parseInt(window.getComputedStyle(wrapperNode, null).paddingLeft);
//     const wrapper_shiftY = parseInt(window.getComputedStyle(wrapperNode, null).borderTopWidth) + parseInt(window.getComputedStyle(wrapperNode, null).paddingTop);
//
//     // Вычислим сдвиг (отступ) левого верхнего угла превьюшки от изображения
//     const thumb_shiftX = parseInt(window.getComputedStyle(thumbImage, null).borderLeftWidth);
//     const thumb_shiftY = parseInt(window.getComputedStyle(thumbImage, null).borderTopWidth);
//
//     // Вычислим размер и положение попапа
//     const thumb_width = thumbImage.width;
//     const thumb_height = thumbImage.height;
//     const align = thumbImage.dataset.zoomboxAlign;
//
//     const thumbPos = getElemPosition(thumbImage);		// положение превьюшки на странице
//     const viewport = page_size();					// видимый размер окна (вьюпорт)
//
//     // Вычислим начальную позицию врапера
//     var initial_left, initial_top;
//
//     var initial = {
//       x: {
//         center: viewport.padding_left + viewport.width / 2 - thumb_width / 2 - wrapper_shiftX,
//         self: thumbPos.x - wrapper_shiftX + thumb_shiftX,
//         left: viewport.padding_left,
//         right: viewport.width - thumb_width - wrapper_shiftX,
//       },
//       y: {
//         center: window.pageYOffset + viewport.height / 2 - thumb_height / 2 - wrapper_shiftY,
//         self: thumbPos.y - wrapper_shiftY + thumb_shiftY,
//         top: window.pageYOffset,
//         bottom: window.pageYOffset + viewport.height - thumb_height - wrapper_shiftY,
//       }
//     };
//
//
//     if (align == 'center') {
//       initial_left = initial.x.center;
//       initial_top = initial.y.center;
//     } else if (align == 'left top') {
//       initial_left = initial.x.left;
//       initial_top = initial.y.top;
//     } else if (align == 'center top') {
//       initial_left = initial.x.center;
//       initial_top = initial.y.top;
//     } else if (align == 'right top') {
//       initial_left = initial.x.right;
//       initial_top = initial.y.top;
//     } else if (align == 'right center') {
//       initial_left = initial.x.right;
//       initial_top = initial.y.center;
//     } else if (align == 'right bottom') {
//       initial_left = initial.x.right;
//       initial_top = initial.y.bottom;
//     } else if (align == 'center bottom') {
//       initial_left = initial.x.center;
//       initial_top = initial.y.bottom;
//     } else if (align == 'left bottom') {
//       initial_left = initial.x.left;
//       initial_top = initial.y.bottom;
//     } else if (align == 'left center') {
//       initial_left = initial.x.left;
//       initial_top = initial.y.center;
//     } else {
//       initial_left = initial.x.self;
//       initial_top = initial.y.self;
//     }
//
//     // Помещаем во враппер картинку
//     setElemAttr(fullImage, {border: 0});
//     setElemStyle(fullImage, {display: 'block', width: thumb_width + 'px', height: thumb_height + 'px', transition: trans_length});
//     wrapperNode.appendChild(fullImage);
//
//
//     // Сохраним значения на будущее
//     wrapperNode.zoomdata = {
//       thumbImage: thumbImage,
//       fullImage: fullImage,
//
//       wrapper_shiftX: wrapper_shiftX,
//       wrapper_shiftY: wrapper_shiftY,
//
//       thumb_width: thumb_width,
//       thumb_height: thumb_height,
//       thumb_shiftX: thumb_shiftX,
//       thumb_shiftY: thumb_shiftY,
//       thumb_left: thumbPos.x,
//       thumb_top: thumbPos.y,
//     };	// объект для хранения кастомных данных
//
//
//     if (show_title) {
//       var titleDiv = createElem('div', {}, {}, wrapperNode);
//       titleDiv.textContent = thumbImage.dataset.zoomboxTitle || fullImage.src.replace(/.+\/([^/]+)$/, '$1');
//       titleDiv.classList.add('zoom-box-title');
//       wrapperNode.zoomdata.titleDiv = titleDiv;
//     }
//
//     // Иконки управления можно расположить только тогда, когда уже есть размеры враппера, после вставки в него картинки
//     if (show_close) {
//       var closeDiv = createElem('i', {}, {
//         position: 'absolute',
//         right: '15px',
//         top: '15px',
//         fontSize: '30px',
//         color: 'white',
//         cursor: 'pointer',
//         zIndex: zIndexCounter + 1
//       }, wrapperNode);
//       closeDiv.classList.add('fas');
//       closeDiv.classList.add('fa-times');
//       closeDiv.addEventListener('click', function () {
//         closeBox(wrapperNode)
//       });
//       wrapperNode.zoomdata.closeDiv = closeDiv;
//     }
//
//     // Если попап это галерея
//     if (thumbImage.zoomdata && thumbImage.zoomdata.prevThumb) {
//       var prevDiv = createElem('i', {title: thumbImage.zoomdata.prevIndex}, {
//         position: 'absolute',
//         left: '15px',
//         top: '50%',
//         fontSize: '30px',
//         color: 'white',
//         cursor: 'pointer',
//         zIndex: zIndexCounter + 1
//       }, wrapperNode);
//       prevDiv.classList.add('fas');
//       prevDiv.classList.add('fa-arrow-circle-left');
//       prevDiv.addEventListener('click', function (e) {
//         changeBox(e, wrapperNode, 'prevThumb')
//       });
//       wrapperNode.zoomdata.prevDiv = prevDiv;
//     }
//     if (thumbImage.zoomdata && thumbImage.zoomdata.nextThumb) {
//       var nextDiv = createElem('i', {title: thumbImage.zoomdata.nextIndex}, {
//         position: 'absolute',
//         right: '15px',
//         top: '50%',
//         fontSize: '30px',
//         color: 'white',
//         cursor: 'pointer',
//         zIndex: zIndexCounter + 1
//       }, wrapperNode);
//       nextDiv.classList.add('fas');
//       nextDiv.classList.add('fa-arrow-circle-right');
//       nextDiv.addEventListener('click', function (e) {
//         changeBox(e, wrapperNode, 'nextThumb')
//       });
//       wrapperNode.zoomdata.nextDiv = nextDiv;
//     }
//
//     // Исходная позиция врапера
//     setElemStyle(wrapperNode, {
//       left: initial_left + 'px',
//       top: initial_top + 'px',
//       transition: trans_move
//     });
//
//     // Конечная позиция враппера
//     animateBox({
//       fullImage: fullImage,
//       wrapperNode: wrapperNode,
//
//       full_width: fullsize.width,
//       full_height: fullsize.height,
//
//       wrapper_shiftX: wrapper_shiftX,
//       wrapper_shiftY: wrapper_shiftY,
//
//       align: align,
//       initial_left: initial_left,
//       initial_top: initial_top,
//       initial_width: thumb_width,
//       initial_height: thumb_height,
//     });
//
//
//     wrapperNode.addEventListener('mousedown', dragStart);
//     wrapperNode.addEventListener('mousemove', dragContinue);
//     wrapperNode.addEventListener('mouseleave', dragStop);
//     wrapperNode.addEventListener('mouseout', dragStop);
//     wrapperNode.addEventListener('mouseup', dragStop);
//
//     zIndexCounter++;
//   }//openBox
//
//
//   /**
//    * Начинаем тащить попап, т.е. нажали на кнопку мыши и тянем
//    */
//   function dragStart(e) {
//     e.preventDefault();
//     e.stopPropagation();
//
//     var wrapperNode = this;
//     var pos = getElemPosition(wrapperNode);
//     wrapperNode.zoomdata.viewport = page_size();							// видимый размер окна (вьюпорт)
//
//     var dx = parseInt(event.clientX) - parseInt(pos.x);
//     var dy = parseInt(event.clientY) - parseInt(pos.y);
//
//     wrapperNode.style.transition = '';
//     wrapperNode.zoomdata.shiftX = dx;
//     wrapperNode.zoomdata.shiftY = dy;
//
//     wrapperNode.zoomdata.drag = {
//       start_x: parseInt(pos.x),
//       start_y: parseInt(pos.y),
//     };
//
//     setElemStyle(wrapperNode, {cursor: 'move'});
//   }//dragStart
//
//   /**
//    * Останавливаем движение
//    */
//   function dragStop(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     var wrapperNode = this;
//
//     // Кликаем на кнопки prev/next/close
//     if (e.target.classList.contains('fas')) {
//       delete wrapperNode.zoomdata.drag;
//       setElemStyle(wrapperNode, {cursor: 'zoom-out'});
//       return;
//     }
//
//     var pos = getElemPosition(wrapperNode);
//     if (wrapperNode.zoomdata.drag && pos.x == wrapperNode.zoomdata.drag.start_x && pos.y == wrapperNode.zoomdata.drag.start_y) {
//       delete wrapperNode.zoomdata.drag;
//       closeBox(wrapperNode);
//     } else {
//       delete wrapperNode.zoomdata.drag;
//       setElemStyle(wrapperNode, {cursor: 'zoom-out'});
//     }
//   }//dragStop
//
//   /**
//    * Перемещаем попап
//    */
//   function dragContinue(e) {
//     e.preventDefault();
//     e.stopPropagation();
//
//     var wrapperNode = this;
//     if (!('drag' in wrapperNode.zoomdata)) return;
//
//     var pos = getElemPosition(wrapperNode);
//     var left = parseInt(event.clientX) - parseInt(wrapperNode.zoomdata.shiftX);
//     var top = parseInt(event.clientY) - parseInt(wrapperNode.zoomdata.shiftY);
//
//     var max_width = wrapperNode.zoomdata.viewport.width - left - wrapperNode.zoomdata.wrapper_shiftX;
//
//     // Если очень маленький сдвиг, то ничего не делаем
//     if (Math.abs(left - pos.x) < 5 && Math.abs(top - pos.y) < 5) return;
//     if (max_width < 200) return;
//
//     setElemStyle(wrapperNode, {left: left + 'px', top: top + 'px'});
//
//     if (wrapperNode.zoomdata.final_width > max_width) {
//       setElemStyle(wrapperNode, {maxWidth: max_width + 'px'});
//     } else {
//       wrapperNode.style.maxWidth = '';
//     }
//   }//dragContinue
//
//
//   /**
//    * Удаляем попап-враппер, анимация при удалении
//    */
//   function closeBox(wrapperNode) {
//     var thumbImage = wrapperNode.zoomdata.thumbImage;
//     var fullImage = wrapperNode.zoomdata.fullImage;
//
//     // Через секунду убиваем враппер
//     setTimeout(function () {
//       delete thumbImage.fullImage;
//       setElemStyle(thumbImage, {visibility: 'visible'});	// visibility: hidden;
//       wrapperNode.parentNode.removeChild(wrapperNode);
//     }, trans_time);
//
//
//     var final_left = wrapperNode.zoomdata.thumb_left - wrapperNode.zoomdata.wrapper_shiftX + wrapperNode.zoomdata.thumb_shiftX;
//     var final_top = wrapperNode.zoomdata.thumb_top - wrapperNode.zoomdata.wrapper_shiftY + wrapperNode.zoomdata.thumb_shiftY;
//     var final_width = wrapperNode.zoomdata.thumb_width;
//     var final_height = wrapperNode.zoomdata.thumb_height;
//
//     // Уменьшаем размеры до первоначальных
//     window.getComputedStyle(fullImage).width;
//     window.getComputedStyle(fullImage).height;
//     setElemStyle(fullImage, {transition: trans_length, width: final_width + 'px', height: final_height + 'px'});
//
//     // Возвращаем на место
//     window.getComputedStyle(wrapperNode).left;
//     window.getComputedStyle(wrapperNode).top;
//     setElemStyle(wrapperNode, {transition: trans_move, left: final_left + 'px', top: final_top + 'px'});
//   }//closeBox
//
//
//   /**
//    * Инициализация
//    */
//   function init() {
//     var prevImageNode = null;
//     var allThumbs = document.querySelectorAll('img[data-zoombox-image]');
//
//     allThumbs.forEach(function (imageNode) {
//       setElemStyle(imageNode, {cursor: 'zoom-in'});
//
//       // Если это галерея
//       if (imageNode.dataset.zoomboxGallery) {
//         var gallery = imageNode.dataset.zoomboxGallery;
//         var galleryThumbs = document.querySelectorAll('img[data-zoombox-image][data-zoombox-gallery="' + gallery + '"]');
//         if (galleryThumbs.length > 1) {
//
//           var index = galleryThumbs.indexOf(imageNode);
//           var next = (index + 1 < galleryThumbs.length) ? index + 1 : 0;
//           var prev = (index - 1 >= 0) ? index - 1 : galleryThumbs.length - 1;
//
//           imageNode.zoomdata = {
//             prevThumb: galleryThumbs[prev],
//             nextThumb: galleryThumbs[next],
//             prevIndex: prev,
//             nextIndex: next,
//           };
//         }
//       }
//
//       imageNode.addEventListener('click', function (e) {
//         e.preventDefault();
//         var thumbImage = e.target;
//
//         // Если попап открыт для данной миниатюры, ничего не делаем
//         if (thumbImage.fullImage) {
//           return;
//         }
//
//         var full_src = thumbImage.dataset.zoomboxImage;
//         if (!full_src) return;
//
//         var fullImage = new Image;
//         fullImage.src = full_src;
//         fullImage.onload = function () {
//           openBox(thumbImage, fullImage)
//         };
//       });
//     });
//   }//init
//
//
//   init();
//
// }