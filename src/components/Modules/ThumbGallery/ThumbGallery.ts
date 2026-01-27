/**
 * Плагин галереи превью товара
 *
 * Модуль галереи превью представляет собой реализацию компактного способа просмотреть изображения на сайте без захода на конечную страницу товара
 * или услуги, движением курсора по-главному изображению можно менять его, просматривая другие, которые автоматически будут изменяться
 * в зависимости от положения курсора.
 *
 * Автор: Ерохин Максим
 * Дата: 29.06.2021
 */

import './ThumbGallery.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Структура конфига галереи
 *
 * Содержит:
 *   data - данные об изображениях, содержаться в формате массива JSON(текстом)
 *   gap - гирина расстояния между элементами
 *   amount - количество слайдов
 */
interface Config {
  data?: string;
  gap: number;
  amount: number;
  touchMove: boolean;
  mouseMove: boolean;
}

/**
 * Класс галереи
 */
class ThumbGallery extends Module {
  // Ширина изображения
  private imageWidth: number;

  // Ширина враппера
  private holderWidth: number;

  // Список фотографий
  private imagesData: Array<string>;

  // DOM элемент враппера галереи
  private holderNode: HTMLDivElement;

  // DOM элемент враппера галереи
  private galleryNode?: HTMLDivElement;

  // DOM элементы элементов пагинации
  private galleryElementsNodes: Array<HTMLDivElement>;

  constructor(node?: HTMLElement, config?: Partial<Config>, rawData?: string) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      data: undefined,
      gap: 0.4,
      amount: 5,
      touchMove: true,
      mouseMove: false,
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Faze.Helpers.deepMerge(defaultConfig, config),
      name: 'ThumbGallery',
      additionalParams: {
        rawData,
      },
    });
  }

  /**
   * Инициализация
   */
  initialize(): void {
    // Инициализация переменных
    this.imageWidth = this.node.getBoundingClientRect().width;
    this.holderWidth = this.node.getBoundingClientRect().width;
    this.imagesData = [];
    this.galleryNode = undefined;
    this.galleryElementsNodes = [];
    this.config.data = this.additionalParams?.rawData || this.node.dataset.fazeThumbgalleryData;

    // Классы
    this.node.classList.toggle('faze-thumbgallery-touchmove', this.config.touchMove);
    this.node.classList.toggle('faze-thumbgallery-mousemove', this.config.mouseMove);

    // Инициализация
    super.initialize();
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.bindChange();
    this.bindScroll();
  }

  /**
   * Создание HTML галереи
   *
   * Создает HTML структуру галереи на основе данных, полученных из data атрибута
   */
  build(): void {
    super.build();

    // Создание галереи
    this.parseProductJSON();

    if (this.imagesData.length > 0) {
      this.buildImagesCarousel();
      this.generateSliderHTML();
      this.manageHolderWidth();
    }
  }

  /**
   * Реинициализация галереи
   *
   * @param data Новый массив изображений
   */
  reinitialize(data: string): void {
    // Очищаем всё
    this.imageWidth = this.node.getBoundingClientRect().width;
    this.holderWidth = this.node.getBoundingClientRect().width;
    this.imagesData = [];
    this.galleryElementsNodes.forEach((galleryElementNode) => galleryElementNode.remove());
    this.galleryElementsNodes = [];
    this.galleryNode?.remove();

    // Присваиваем новые данные
    this.config.data = data;

    // Создание галереи
    this.build();
  }

  /**
   * Навешивание события на скролл для отслеживания текущего активного элемента галереи
   *
   * @private
   */
  private bindScroll() {
    Faze.Events.listener('scrollend', this.holderNode, () => {
      // Получаем текущий индекс
      const currentPhotoIndex = Math.round((this.holderNode.scrollLeft || 0) / this.imageWidth);

      // Ставим активный элемент
      Faze.Helpers.activateItem(this.galleryElementsNodes, currentPhotoIndex);
    });
  }

  /**
   * Навешивание событий изменения изображения при движении курсора
   *
   * @private
   */
  private bindChange(): void {
    // Навешиваем событие изменения изображения относительно положения курсора
    Faze.Events.listener('mousemove', this.node, (event: MouseEvent) => {
      // Получаем необходимые данные
      const total = this.imagesData.length;

      // Если нет изображений в галереи, то нет смысла в дальнейшем коде
      if (total <= 1) {
        return;
      }

      // Получаем корректные координаты родителя
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = event.clientX - rect.left;

      // Общая ширина пустого пространства(отступов между элементами)
      const totalSpace = total * this.config.gap;

      // Ширина фото в слайдере
      const sliderPhotoWidth = (this.holderWidth - totalSpace) / total;

      // Индекс фотографии которую нужно вывести
      let currentPhotoIndex = Math.floor(offsetX / sliderPhotoWidth);

      // Защита от выхода за границы
      if (currentPhotoIndex < 0) {
        currentPhotoIndex = 0;
      } else if (currentPhotoIndex > total - 1) {
        currentPhotoIndex = total - 1;
      }

      // Скроллим галерею
      this.holderNode.scrollLeft = currentPhotoIndex * this.holderWidth;

      // Ставим активный элемент
      Faze.Helpers.activateItem(this.galleryElementsNodes, currentPhotoIndex);
    });
  }

  /**
   * Парсинг текста в JSON Для получения изображения для галереи
   */
  private parseProductJSON(): void {
    // Если нет данных или не начинается как JSON, то пропускаем элемент
    if (!this.config.data || !this.config.data.startsWith('[')) {
      this.imagesData = [];
      return;
    }

    // Парсинг JSON
    let jsonData: any = Faze.Helpers.parseJSON(this.config.data) || [];

    // Если один элемент, то пропускаем
    if (jsonData.length === 0) {
      this.imagesData = [];
      return;
    }

    // Сокращаем до заданного количества
    jsonData = jsonData.slice(0, this.config.amount);

    // Получаем финальный результат
    this.imagesData = jsonData;
  }

  /**
   * Построение HTML кода
   * 
   * @private
   */
  private buildImagesCarousel(): void {
    this.node.innerHTML = `
      <div class="faze-thumbgallery-holder">
        ${this.imagesData.map(image => `<img src="${image}">`).join('')}
      </div>
    `;

    this.holderNode = this.node.querySelector('.faze-thumbgallery-holder') as HTMLDivElement;
  }

  /**
   * Проставление корректной ширины
   * 
   * @private
   */
  private manageHolderWidth(): void {
    this.holderNode.style.width = `${this.imageWidth}px`;
  }

  /**
   * Генерация HTML для пагинации галереи
   *
   * @private
   */
  private generateSliderHTML(): void {
    // Создаём DOM элемент слайдера фотографий
    this.galleryNode = document.createElement('div');
    this.galleryNode.className = 'faze-thumbgallery-gallery';
    this.galleryNode.dataset.fazeThumbgalleryTotal = this.imagesData.length.toString();

    // Генерируем HTML для элементов слайдера
    this.generateSliderElementsHTML();

    // Добавляем созданный слайдер к элементу
    this.node.appendChild(this.galleryNode);

    // Получаем ширину одного изображения
    const imageNode = this.node.querySelector('img');
    if (imageNode) {
      this.imageWidth = imageNode.getBoundingClientRect().width;
    }
  }

  /**
   * Генерация HTML для элемента пагинации галереи
   *
   * @private
   */
  private generateSliderElementsHTML(): void {
    // Создаём DOM элементы отдельных фотографий
    this.imagesData.forEach((photoData, photoIndex) => {
      const photoNode = document.createElement('div');
      photoNode.className = 'faze-thumbgallery-gallery-element';

      // Первому элементу ставим "active"
      if (photoIndex === 0) {
        photoNode.classList.add('active');
      }

      // Добавляем в массив для дальнейшей работы
      this.galleryElementsNodes.push(photoNode);

      // Добавляем во враппер
      this.galleryNode?.appendChild(photoNode);
    });
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node - DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new ThumbGallery(node, {
      data: node.dataset.fazeThumbgalleryData,
      gap: parseFloat(node.dataset.fazeThumbgalleryGap || '0'),
      amount: parseInt(node.dataset.fazeThumbgalleryGap || '5', 10),
      touchMove: (node.dataset.fazeThumbgalleryTouchMove || 'true') === 'true',
      mouseMove: (node.dataset.fazeThumbgalleryMouseMove || 'false') === 'true',
    });

    // Отслеживаем изменение в атрибуте содержащий данные изображений
    Faze.Observer.watchNode({
      node,
      callback: () => {
        (node as any).self.reinitialize(node.dataset.fazeThumbgalleryData);
      },
      type: 0,
      attribute: 'data-faze-thumbgallery-data',
    });
  }
}

export default ThumbGallery;
