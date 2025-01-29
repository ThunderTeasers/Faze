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

  /**
   * Вставка DOM элемента до указанного
   *
   * @param node{HTMLElement} DOM элемент который вставляем
   * @param referenceNode{HTMLElement} DOM элемент до которого вставляем
   */
  static insertBefore(node: HTMLElement, referenceNode: HTMLElement): void {
    node.parentNode?.insertBefore(referenceNode, node);
  }
}

export default DOM;
