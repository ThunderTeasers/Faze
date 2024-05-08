/**
 * Контроллер управления изображениями с отложенной загрузкой
 *
 * Данный класс содержит все изображения с отложенной загрузкой которые есть на странице, добавляются они сюда автоматически, во время
 * выполнения метода "hotInitialize", и, в момент скрола/ресайза окна вызывает метод слежения за ними, чтобы понять, нужно ли их уже
 * загружать, или еще нет.
 *
 * Автор: Ерохин Максим
 * Дата: 24.07.2019
 */

import LazyImage from './LazyImage';

/**
 * Класс контроллера
 */
class LazyImageController {
  // Коллекция всех изображений на странице
  readonly lazyImages: Set<LazyImage>;

  /**
   * Конструктор
   */
  constructor() {
    this.lazyImages = new Set<LazyImage>();
  }

  /**
   * Метод добавления нового изображения в коллекцию имеющихся, для дальнейшего отслеживания
   *
   * @param lazyImage - объект изображения
   */
  add(lazyImage: LazyImage) {
    this.lazyImages.add(lazyImage);

    // Проверяем сразу это изображение
    this.checkImage(lazyImage);
  }

  /**
   * Слежение за всеми изображениями на странице, если изображение видимо, удаляем его из общего массива для быстродействия
   */
  watch() {
    this.lazyImages.forEach((lazyImage) => {
      this.checkImage(lazyImage);
    });
  }

  /**
   * Проверка изображеня
   *
   * @param lazyImage - объект изображения
   */
  checkImage(lazyImage: LazyImage) {
    if (lazyImage.check()) {
      this.lazyImages.delete(lazyImage);
    }
  }

  /**
   * Навешивание событий на скролл и ресайз для отслежки видимости изображений
   */
  bind() {
    window.addEventListener('scroll', this.watch.bind(this));
    window.addEventListener('resize', this.watch.bind(this));
  }
}

export default LazyImageController;
