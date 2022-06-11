/**
 * Класс помощник для работы с DOM деревом
 */
class DOM {
  /**
   * Вставка DOM элемента после указанного
   *
   * @param node{HTMLElement} DOM элемент который вставляем
   * @param referenceNode{HTMLElement} DOM элемент после которого вставляем
   */
  static insertAfter(node: HTMLElement, referenceNode: HTMLElement): void {
    referenceNode.parentNode?.insertBefore(node, referenceNode.nextSibling);
  }
}

export default DOM;
