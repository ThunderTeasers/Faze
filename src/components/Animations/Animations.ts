/**
 * Класс отвечающий за анимации элементов, содержит как основной метод "animate" для описание любых анимаций, так и методы помощники для
 * более локального изменения данных DOM элемента, например "animatePositionAndSize" для изменения позиции и размера элемента.
 */

import Faze from '../Core/Faze';

/**
 * Тип для определения типа данных передаваемых в данные анимации
 */
type FazeAnimationData = FazeObject | FazePositionAndSize | FazePosition | FazeSize;

/**
 * Интерфейс описания анимации
 *
 * Содержит:
 *   node{HTMLElement} - DOM элемент который анимируем
 *   from{FazeAnimationData} - объект содержащий начальные данные о позиции и размере
 *   to{FazeAnimationData} - объект содержащий конечные данные о позиции и размере
 *   rawTo{FazeAnimationData} - объект содержащий чистые исходные данные конечной точки анимации, т.к. они могут измениться в методах
 *                              помощниках и должны будут передать обратно чистые данные
 *   transition{string} - CSS правило для анимации
 *   time{number} - время анимации в миллисекундах
 *   rewriteFromData{boolean} - перезаписывать ли переменную "from" данными из переменной "to"
 */
interface FazeAnimation {
  readonly node: HTMLElement;
  readonly from: FazeAnimationData;
  readonly to: FazeAnimationData;
  readonly rawTo?: FazeAnimationData;
  readonly transition?: string;
  readonly time: number;
}

/**
 * Интерфейс описания анимации позиции и размера
 */
interface FazeAnimationPositionAndSize extends FazeAnimation {
  readonly from: FazePositionAndSize;
  readonly to: FazePositionAndSize;
  readonly rawTo?: FazeAnimationData;
}

/**
 * Интерфейс описания анимации позиции
 */
interface FazeAnimationPosition extends FazeAnimation {
  readonly from: FazePosition;
  readonly to: FazePosition;
  readonly rawTo?: FazePosition;
}

/**
 * Интерфейс описания анимации размера
 */
interface FazeAnimationSize extends FazeAnimation {
  readonly from: FazeSize;
  readonly to: FazeSize;
  readonly rawTo?: FazeSize;
}

class Animations {
  /**
   * Анимация изменения элемента
   *
   * @param animationData{FazeAnimation} - данные для анимации
   *
   * @return{FazeAnimationData} - данные конечной точки анимации
   */
  static animate(animationData: FazeAnimation): Promise<FazeAnimationData> {
    return new Promise<FazeAnimationData>((resolve) => {
      // Проставляем правило для анимации элементо
      animationData.node.style.transition = animationData.transition || 'all 2s';

      // Проставляем все CSS правила для элемента
      Faze.Helpers.setElementStyle(animationData.node, animationData.from as FazeObject);

      // Ставим в стек увеличение враппера до номрального состояния
      setTimeout(() => {
        // Задаём первичные данные от которых идет анимация
        Faze.Helpers.setElementStyle(animationData.node, animationData.to as FazeObject);
      }, 100);

      // Активируем промис после анимации
      setTimeout(() => {
        // Возвращаем либо чистое значение, если оно есть(оно будет только в случае если мы вызываем данный метод из методом помощников,
        // они ОБАЗАНЫ вернуть переменную "rawTo", т.к. изменяют исходную переменную "to"
        resolve(animationData.rawTo || animationData.to);
      }, animationData.time);
    });
  }

  /**
   * Анимация изменения только позиции и размера элемента
   *
   * @param animationData{FazeAnimation} - данные для анимации
   *
   * @return{FazeAnimationData} - данные конечной точки анимации
   */
  static animatePositionAndSize(animationData: FazeAnimationPositionAndSize): Promise<FazePositionAndSize> {
    return this.animate({
      node: animationData.node,
      from: Faze.Helpers.fromPositionAndSizeToStyles(animationData.from),
      to: Faze.Helpers.fromPositionAndSizeToStyles(animationData.to),
      rawTo: animationData.to,
      time: animationData.time,
      transition: 'width 0.5s, height 0.5s, left 0.5s, top 0.5s',
    }) as Promise<FazePositionAndSize>;
  }

  /**
   * Анимация изменения только позиции и размера элемента
   *
   * @param animationData{FazeAnimationPosition} - данные для анимации
   *
   * @return{FazePosition} - данные конечной точки анимации
   */
  static animatePosition(animationData: FazeAnimationPosition): Promise<FazePosition> {
    return this.animate({
      node: animationData.node,
      from: Faze.Helpers.fromPositionToStyles(animationData.from),
      to: Faze.Helpers.fromPositionToStyles(animationData.to),
      rawTo: animationData.to,
      time: animationData.time,
      transition: 'left 0.5s, top 0.5s',
    }) as Promise<FazePosition>;
  }

  /**
   * Анимация изменения только позиции и размера элемента
   *
   * @param animationData{FazeAnimationSize} - данные для анимации
   *
   * @return{FazeSize} - данные конечной точки анимации
   */
  static animateSize(animationData: FazeAnimationSize): Promise<FazeSize> {
    return this.animate({
      node: animationData.node,
      from: Faze.Helpers.fromSizeToStyles(animationData.from),
      to: Faze.Helpers.fromSizeToStyles(animationData.to),
      rawTo: animationData.to,
      time: animationData.time,
      transition: 'width 0.5s, height 0.5s',
    }) as Promise<FazeSize>;
  }
}

export default Animations;
