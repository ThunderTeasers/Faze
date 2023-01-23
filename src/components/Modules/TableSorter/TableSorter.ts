import './TableSorter.scss';
import Module from '../../Core/Module';
import Faze from '../../Core/Faze';
import { DataParser } from '../../Helpers/Helpers';

/**
 * Структура конфига
 * callbacks
 *   created - пользовательская функция, исполняющаяся после создания модуля
 *   changed - пользовательская функция, исполняющаяся после изменения сортировки колонки
 */
interface Config {
  callbacks: {
    changed?: () => void;
  };
}

/**
 * Структура объекта с данными парсера данных
 */
interface ParserData {
  id: string;
  count: number;
}

class TableSorter extends Module {
  // DOM элементы шапок таблицы
  private theadCellsNodes: NodeListOf<HTMLElement>;

  // DOM элемент тела таблицы
  private tbodyNode: HTMLElement;

  // DOM элементы строк таблицы
  private tbodyRowsNodes: HTMLElement[];

  /**
   * Стандартный конструктор
   *
   * @param node DOM элемент на который навешивается модуль
   * @param config Конфиг модуля
   */
  constructor(node?: HTMLElement, config?: Partial<Config>) {
    // Конфиг по умолчанию
    const defaultConfig: Config = {
      callbacks: {
        changed: undefined,
      },
    };

    // Инициализируем базовый класс
    super({
      node,
      config: Object.assign(defaultConfig, config),
      name: 'TableSorter',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    super.initialize();

    // Инициализация переменных
    this.theadCellsNodes = this.node.querySelectorAll<HTMLElement>('thead th, thead td, [data-faze-tablesorter="header"] [data-faze-tablesorter="cell"]');
    this.tbodyNode = this.node?.querySelector('tbody, [data-faze-tablesorter="body"]') as HTMLElement;
    this.tbodyRowsNodes = Array.from(this.tbodyNode.querySelectorAll('tr, [data-faze-tablesorter="row"]') || []);

    this.theadCellsNodes.forEach((theadCell: HTMLElement, columnIndex: number) => {
      if (theadCell.dataset.fazeTablesorterActive !== 'false') {
        let parserConfig: DataParser;

        // Если data атрибутом задан тип данных в столбце
        if (theadCell.dataset.fazeTablesorterType) {
          const columnType = theadCell.dataset.fazeTablesorterType;

          parserConfig = {
            id: null,
            is: null,
            format: (text: string) => {
              if (columnType === 'numeric') {
                return Faze.Helpers.formatFloat(text != '' ? text.trim() : '0');
              } else if (columnType === 'date') {
                return Faze.Helpers.formatFloat(text != '' ? new Date(text).getTime() : '0');
              }
              return text.toLowerCase().trim();
            },
            type: columnType,
          };
        } else {
          parserConfig = this.detectParserForColumn(columnIndex);
        }

        // Флаг обратной сортировки
        let descFlag = false;

        // Добавление стрелок и классов сортировки для заголовков
        theadCell.classList.add('faze-tablesorter-header');

        const arrowNode = Faze.Helpers.createElement('i', { class: 'fas fa-sort sort-arrow' }, {}, theadCell);

        // Переключение иконки сортировки
        theadCell.addEventListener('click', () => {
          this.theadCellsNodes.forEach((th: HTMLElement) => {
            const arrowNodeTmp = th.querySelector('.sort-arrow');
            if (arrowNodeTmp) {
              arrowNodeTmp.classList.remove('fa-sort-up');
              arrowNodeTmp.classList.remove('fa-sort-down');
              arrowNodeTmp.classList.add('fa-sort');
            }
          });

          arrowNode.classList.remove('fa-sort');

          if (descFlag) {
            arrowNode.classList.remove('fa-sort-up');
            arrowNode.classList.add('fa-sort-down');
          } else {
            arrowNode.classList.remove('fa-sort-down');
            arrowNode.classList.add('fa-sort-up');
          }

          this.tbodyRowsNodes.sort((a: HTMLElement, b: HTMLElement) => {
            const aCell = this.getCell(a, columnIndex);
            const bCell = this.getCell(b, columnIndex);

            if (!aCell || !bCell) {
              return 0;
            }

            let aCellFormatted: string | number;
            let bCellFormatted: string | number;

            // Проверяем наличие специального значения для сравнения
            if (aCell.dataset.fazeTablesorterValue && bCell.dataset.fazeTablesorterValue) {
              aCellFormatted = parserConfig.format(aCell.dataset.fazeTablesorterValue);
              bCellFormatted = parserConfig.format(bCell.dataset.fazeTablesorterValue);
            } else {
              aCellFormatted = parserConfig.format(aCell.textContent || '');
              bCellFormatted = parserConfig.format(bCell.textContent || '');
            }

            if (parserConfig.type === 'text') {
              return descFlag ? (bCellFormatted < aCellFormatted ? -1 : 1) : aCellFormatted < bCellFormatted ? -1 : 1;
            } else {
              return descFlag ? (bCellFormatted as number) - (aCellFormatted as number) : (aCellFormatted as number) - (bCellFormatted as number);
            }
          });

          this.tbodyNode.innerHTML = '';
          this.tbodyRowsNodes.forEach((tbodyRow) => {
            this.tbodyNode.append(tbodyRow);
          });

          descFlag = !descFlag;
        });
      }
    });
  }

  /**
   * Навешивание событий
   */
  protected bind(): void {}

  private detectParserForColumn(index: number): DataParser {
    // Создаем массив для подстчёта совпадений каждого парсера в строке
    const parserCounts: ParserData[] = Faze.Helpers.DataParsers.map((cellParser: DataParser) => {
      return {
        id: cellParser.id,
        count: 0,
      };
    });

    // Проходимся по всем строкам определенного столбца и увеличиваем кол-во совпадений для парсера
    this.tbodyRowsNodes.forEach((tbodyRow: HTMLElement) => {
      for (let i = 0; i < Faze.Helpers.DataParsers.length; i++) {
        const cell = this.getCell(tbodyRow, index);
        if (cell) {
          const cellValue = cell.dataset.fazeTablesorterValue ? cell.dataset.fazeTablesorterValue.trim() : cell.textContent?.trim();
          if (Faze.Helpers.DataParsers[i].is(cellValue) && cellValue != '') {
            parserCounts[i].count++;
            return;
          }
        }
      }
    });

    // Сортируем парсер по убыванию количества совпадений, чтобы в дальшнейшем вырать парсер,
    // который чаще всего совпадает с ячейками
    parserCounts.sort((a: ParserData, b: ParserData) => b.count - a.count);

    // Возвращаем найденный парсер
    return Faze.Helpers.DataParsers.find((cellParser: DataParser) => cellParser.id === parserCounts[0].id);
  }

  /**
   * Получение ячейки в таблице
   *
   * @param node DOM элемент таблицы
   * @param index Индекс ячейки
   */
  private getCell(node: HTMLElement, index: number): HTMLElement | null {
    return node.querySelector(`td:nth-of-type(${index + 1}), [data-faze-tablesorter="cell"]:nth-of-type(${index + 1}`);
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new TableSorter(node);
  }
}

export default TableSorter;
