/**
 * Класс отвечающий за анимации элементов, содержит как основной метод "animate" для описание любых анимаций, так и методы помощники для
 * более локального изменения данных DOM элемента, например "animatePositionAndSize" для изменения позиции и размера элемента.
 */

import Faze from '../Core/Faze';

/**
 * Тип для определения типа данных передаваемых в данные анимации
 */
type FazeAnimationData = FazeObject | FazePositionAndSize;

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
 *   afterAnimationCallback{() => void | undefined} - пользовательская функция, исполняющаяся после анимации
 */
interface FazeAnimation {
  readonly node: HTMLElement;
  readonly from: FazeAnimationData;
  readonly to: FazeAnimationData;
  readonly rawTo?: FazeAnimationData;
  readonly transition?: string;
  readonly time: number;
  readonly afterAnimationCallback?: () => void;
}

/**
 * Интерфейс описания анимации
 *
 * Содержит:
 *   node{HTMLElement} - DOM элемент который анимируем
 *   from{FazePositionAndSize} - объект содержащий начальные данные о позиции и размере
 *   from{FazePositionAndSize} - объект содержащий конечные данные о позиции и размере
 *   time{number} - время анимации в миллисекундах
 *   afterAnimationCallback{() => void | undefined} - пользовательская функция, исполняющаяся после анимации
 */
interface FazeAnimationPositionAndSize extends FazeAnimation {
  readonly from: FazePositionAndSize;
  readonly to: FazePositionAndSize;
  readonly rawTo?: FazeAnimationData;
}

class Animations {
  /**
   * Анимация изменения элемента
   *
   * @param animationData{FazeAnimation} - данные для анимации
   */
  static animate(animationData: FazeAnimation): FazeAnimationData {
    // Проставляем правило для анимации элементо
    animationData.node.style.transition = animationData.transition || 'all 2s';

    // Проставляем все CSS правила для элемента
    Faze.Helpers.setElementStyle(animationData.node, animationData.from as FazeObject);

    // Ставим в стек увеличение враппера до номрального состояния
    setTimeout(() => {
      // Задаём первичные данные от которых идет анимация
      Faze.Helpers.setElementStyle(animationData.node, animationData.to as FazeObject);
    }, 100);

    // Если пользовательская функция существует, исполняем её, но с небольшой задержкой в 200 миллисекунд
    if (typeof animationData.afterAnimationCallback === 'function') {
      setTimeout(() => {
        if (animationData.afterAnimationCallback) {
          animationData.afterAnimationCallback();
        }
      }, animationData.time);
    }

    // Возвращаем либо чистое значение, если оно есть(оно будет только в случае если мы вызываем данный метод из методом помощников,
    // они ОБАЗАНЫ вернуть переменную "rawTo", т.к. изменяют исходную переменную "to"
    return animationData.rawTo || animationData.to;
  }

  /**
   * Анимация изменения только позиции и размера элемента
   *
   * @param animationData{FazeAnimation} - данные для анимации
   */
  static animatePositionAndSize(animationData: FazeAnimationPositionAndSize): FazePositionAndSize {
    return this.animate({
      node: animationData.node,
      from: Faze.Helpers.fromPositionAndSizeToStyles(animationData.from),
      to: Faze.Helpers.fromPositionAndSizeToStyles(animationData.to),
      rawTo: animationData.to,
      time: animationData.time,
      transition: 'width 0.5s, height 0.5s, left 0.5s, top 0.5s',
      afterAnimationCallback: animationData.afterAnimationCallback,
    }) as FazePositionAndSize;
  }
}

export default Animations;
