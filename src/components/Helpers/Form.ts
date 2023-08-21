import Faze from '../Core/Faze';

class Form {
  /**
   * Инициализация
   */
  static initialize(): void {
    Form.bindFileInput();
  }

  /**
   * Отслеживание на добавление новый DOM элементов
   */
  static watch(): void {
    Form.watchFileInput();
  }

  /**
   * Отслеживание добавления новый инпутов для навешивания событий
   */
  static watchFileInput(): void {
    Faze.Observer.watch('.faze-file-input', (node: HTMLElement) => {
      Form.fileInput(node);
    });
  }

  /**
   * Навешивания событий для изменения подписи при загрузке файла
   */
  static bindFileInput(): void {
    document.querySelectorAll<HTMLElement>('.faze-file-input').forEach((node: HTMLElement) => {
      Form.fileInput(node);
    });
  }

  /**
   * Изменение названия подписи если добавили файл
   *
   * @param node{HTMLElement} DOM элемент группы формы
   */
  private static fileInput(node: HTMLElement): void {
    // DOM элемент инпута
    const inputNode = node.querySelector<HTMLInputElement>('.faze-file-input-file');

    // DOM элемент подписи
    const captionNode = node.querySelector('.faze-file-input-caption');

    // Если хоть одного нет, то выходим
    if (!inputNode || !captionNode) {
      return;
    }

    // При изменении пишем в подпись имена файлов
    inputNode.addEventListener('change', () => {
      captionNode.textContent = Array.from(inputNode.files as any)
        .map((file: any) => file.name)
        .join(', ');
    });
  }
}

export default Form;
