/**
 * Плагин карусели
 *
 * Автор: Ерохин Максим
 * Дата: 11.03.2026
 */

import './Carousel3.scss';
import Faze from '../../Core/Faze';
import Module from '../../Core/Module';

interface Config {
  autoplay: boolean;
}

class Carousel3 extends Module {
  track: HTMLElement;
  prevBtn: HTMLElement;
  nextBtn: HTMLElement;
  dotsContainer: HTMLElement;
  originalSlides: HTMLElement[];

  visibleSlides: number;
  slideMargin: number;
  totalOriginal: number;
  clonesPerSide: number;
  currentIndex: number;
  isTransitioning: boolean;
  containerWidth: number;
  totalMarginWidth: number;
  slideWidth: number;
  fullSlideWidth: number;
  slideWidthPercent: number;

  /**
   * Стандартный конструктор
   * 
   * @param {HTMLElement} node DOM элемент на который навешивается модуль
   * @param {Partial<Config>} config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      autoplay: false,
    };

    // Инициализация модуля
    super({
      node,
      config: Faze.Helpers.deepMerge(defaultConfig, config),
      name: 'Carousel3',
    });
  }

  protected initialize(): void {
    super.initialize();

    this.track = document.querySelector<HTMLElement>('.carousel-track') as HTMLElement;
    this.prevBtn = document.querySelector<HTMLElement>('.carousel-btn.prev') as HTMLElement;
    this.nextBtn = document.querySelector<HTMLElement>('.carousel-btn.next') as HTMLElement;
    this.dotsContainer = document.querySelector<HTMLElement>('.carousel-dots') as HTMLElement;
    this.originalSlides = Array.from(document.querySelectorAll<HTMLElement>('.carousel-container img'));

    this.visibleSlides = 4;
    this.slideMargin = 10;
    this.totalOriginal = 6;
    this.clonesPerSide = this.visibleSlides;
    this.currentIndex = this.clonesPerSide;
    this.isTransitioning = false;
    this.containerWidth = this.track?.offsetWidth || 0;
    this.totalMarginWidth = this.slideMargin * (this.visibleSlides + 1);
    this.slideWidth = (this.containerWidth - this.totalMarginWidth) / this.visibleSlides;
    this.fullSlideWidth = this.slideWidth + this.slideMargin;
    this.slideWidthPercent = (this.fullSlideWidth / this.containerWidth) * 100;

    this.createSlides();
  }

  private createSlides() {
    for (let i = this.totalOriginal - this.clonesPerSide; i < this.totalOriginal; i++) {
      this.createSlide(this.originalSlides[i], false);
    }
    this.originalSlides.forEach((slide, index: number) => {
      this.createSlide(slide, true, index);
    });
    for (let i = 0; i < this.clonesPerSide; i++) {
      this.createSlide(this.originalSlides[i], false);
    }
  }

  private createSlide(slide: HTMLElement, isOriginal: boolean, originalIndex: number = 0) {
    const tmpSlide = slide.cloneNode(true) as HTMLElement;
    tmpSlide.style.width = `${this.slideWidth}px`;
    tmpSlide.style.marginLeft = `${this.slideMargin}px`;
    tmpSlide.dataset.isOriginal = isOriginal.toString();
    if (isOriginal) {
      tmpSlide.dataset.originalIndex = originalIndex.toString();
    }
    console.log(this.track);
    this.track.appendChild(tmpSlide);
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param {HTMLElement} node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Carousel3(node, {
      autoplay: (node.dataset.fazeCarouselAutoplay || 'false') === 'true',
    });
  }
}

export default Carousel3;