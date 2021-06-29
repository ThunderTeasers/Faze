/**
 * Плагин галереи превью товара
 *
 * Модуль галареи превью представляет из себя реализацию компактного способа просмотреть изображения на сайте без захода на конечную страницу товара
 * или услуги, движением курсора по главному изображени можно менять его, просматривая другие, которые автоматически будут изменяться
 * в зависимости от положения курсора.
 *
 * Автор: Ерохин Максим, plarson.ru
 * Дата: 29.06.2021
 */

import './ThumbGallery.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

/**
 * Структура конфига табов
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
}

/**
 * Класс табов
 */
class ThumbGallery extends Module {
  // DOM элемент изображения
  private imageNode?: HTMLImageElement | null;

  // Список фотографий
  private imagesData: Array<string>;

  // DOM элементы элементов пагинации
  private galleryElementsNodes: Array<HTMLDivElement>;

  constructor(node?: HTMLElement, config?: Partial<Config>, rawData?: string) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      data: undefined,
      gap: 0.4,
      amount: 5,
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
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
    this.imageNode = this.node?.querySelector('img');
    this.imagesData = [];
    this.galleryElementsNodes = [];
    this.config.data = this.additionalParams?.rawData || this.node.dataset.fazeThumbgalleryData;

    // Инициализация
    super.initialize();

    // Создание галереи
    this.parseProductJSON();
    this.generateSliderHTML();
  }

  /**
   * Навешивание событий
   */
  bind(): void {
    super.bind();

    this.bindChange();
  }

  /**
   * Реинициализация галереи
   *
   * @param data Новый массив изображений
   */
  reinitialize(data: string): void {
    this.imagesData = [];
    this.galleryElementsNodes = [];
    this.config.data = data;

    // Создание галереи
    this.parseProductJSON();
    this.generateSliderHTML();
  }

  /**
   * Навешивание событий изменения изображения при движении курсора
   *
   * @private
   */
  private bindChange(): void {
    // Получаем необходимые данные
    const total = this.imagesData.length;

    // Ширина изображения на котором распологаются элементы, относительно неё идут все рассчёты
    const imageWidth = this.node.getBoundingClientRect().width;

    // Общая ширина пустого пространства(отступов между элементами)
    const totalSpace = total * this.config.gap;

    // Ширина фото в слайдере
    const sliderPhotoWidth = (imageWidth - totalSpace) / total;

    // Навешиваем событие изменения изображения относительно положения курсора
    this.node.addEventListener('mousemove', (event: any) => {
      // Индекс фотографии которую нужно вывести
      let currentPhotoIndex = Math.floor(event.layerX / sliderPhotoWidth);

      // Защита от выхода за границы
      if (currentPhotoIndex < 0) {
        currentPhotoIndex = 0;
      } else if (currentPhotoIndex > total - 1) {
        currentPhotoIndex = total - 1;
      }

      // Присваиваем новое изображение
      if (this.imageNode) {
        this.imageNode.src = this.imagesData[currentPhotoIndex];
      }

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
    let jsonData;
    try {
      jsonData = JSON.parse(this.config.data);
    } catch (error) {
      console.error(error);
    }

    // Если один элемент, то пропускаем
    if (jsonData.length <= 1) {
      this.imagesData = [];
      return;
    }

    // Сокращаем до заданного количества
    jsonData = jsonData.slice(0, this.config.amount);

    // Получаем финальный результат
    this.imagesData = jsonData;
  }

  /**
   * Генерация HTML для пагинации галереи
   *
   * @private
   */
  private generateSliderHTML(): void {
    // Создаём DOM элемент слайдера фотографий
    const photosSliderNode = document.createElement('div');
    photosSliderNode.className = 'faze-thumbgallery-gallery';
    photosSliderNode.dataset.fazeThumbgalleryTotal = this.imagesData.length.toString();

    // Генерируем HTML для элементов слайдера
    this.generateSliderElementsHTML(photosSliderNode);

    // Ставим первое изображение
    if (this.imageNode && this.imagesData.length > 0) {
      [this.imageNode.src] = this.imagesData;
    }

    // Добавляем созданный слайдер к элементу
    this.node.appendChild(photosSliderNode);
  }

  /**
   * Генерация HTML для элемента пагинации галереи
   *
   * @param photosSliderNode{HTMLDivElement} DOM элемент враппера пагинации галереи
   *
   * @private
   */
  private generateSliderElementsHTML(photosSliderNode: HTMLDivElement): void {
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

      photosSliderNode.appendChild(photoNode);
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
    });
  }
}

export default ThumbGallery;
