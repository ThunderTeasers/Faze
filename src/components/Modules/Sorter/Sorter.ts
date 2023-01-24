import './Sorter.scss';
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

class Sorter extends Module {
  // DOM элементы заголовков сортировщика
  private headerNodes: NodeListOf<HTMLElement>;

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
      name: 'Sorter',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    this.headerNodes = document.querySelectorAll('[data-faze-sorter-head]');
    this.headerNodes.forEach((headNode: HTMLElement) => {
      if (!headNode.dataset.fazeSorterHead) {
        console.error(`Не задана группа для заголовка ${headNode.textContent}`);
      }

      let data: HTMLElement[];

      const bodyNode = document.querySelector(`[data-faze-sorter-body=${headNode.dataset.fazeSorterHead}]`);
      if (bodyNode) {
        data = Array.from((bodyNode.children || []) as any);
      } else {
        data = Array.from(document.querySelectorAll(`[data-faze-sorter-data=${headNode.dataset.fazeSorterHead}]`));
      }

      if (data.length) {
        const parentNode = data[0].parentNode as HTMLElement;
        if (!parentNode) {
          return;
        }

        if (!headNode.dataset.fazeSorterValue) {
          console.error(`Не задан атрибут сортировки для заголовка ${headNode.textContent}`);
        }

        const dataSortValue = headNode.dataset.fazeSorterValue || '';
        const dataSortValueString = `fazeSorter${dataSortValue[0].toUpperCase()}${dataSortValue.slice(1)}`;

        const parserConfig = this.detectParserForColumn(data, dataSortValueString);

        // Флаг обратной сортировки
        let descFlag = false;

        Faze.Helpers.createElement('i', { class: 'fas fa-sort sort-arrow' }, {}, headNode);

        headNode.addEventListener('click', () => {
          this.headerNodes.forEach((tmpHeadNode: HTMLElement) => {
            const arrowNodeTmp = tmpHeadNode.querySelector('.sort-arrow');
            if (arrowNodeTmp) {
              arrowNodeTmp.classList.remove('fa-sort-up');
              arrowNodeTmp.classList.remove('fa-sort-down');
              arrowNodeTmp.classList.add('fa-sort');
            }
          });

          const arrowNodeTmp = headNode.querySelector('.sort-arrow');
          if (arrowNodeTmp) {
            arrowNodeTmp.classList.remove('fa-sort');
            if (descFlag) {
              arrowNodeTmp.classList.remove('fa-sort-up');
              arrowNodeTmp.classList.add('fa-sort-down');
            } else {
              arrowNodeTmp.classList.remove('fa-sort-down');
              arrowNodeTmp.classList.add('fa-sort-up');
            }
          }

          data.sort((a, b) => {
            const aValue = a.dataset[dataSortValueString] || '';
            const bValue = b.dataset[dataSortValueString] || '';

            const aFormatted = parserConfig.format(aValue);
            const bFormatted = parserConfig.format(bValue);

            if (parserConfig.type === 'text') {
              return descFlag ? (bFormatted < aFormatted ? -1 : 1) : aFormatted < bFormatted ? -1 : 1;
            } else {
              return descFlag ? (bFormatted as number) - (aFormatted as number) : (aFormatted as number) - (bFormatted as number);
            }
          });

          parentNode.innerHTML = '';
          data.forEach((node: HTMLElement) => {
            parentNode.append(node);
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

  private detectParserForColumn(nodes: HTMLElement[], dataSortValueString: string): DataParser {
    // Создаем массив для подстчета совпадений каждого  парсера в строке
    const parserCounts: ParserData[] = Faze.Helpers.DataParsers.map((dataParser: DataParser) => {
      return {
        id: dataParser.id,
        count: 0,
      };
    });

    // Проходимся по всем объектам группы и увеличиваем кол-во совпадений для парсера
    nodes.forEach((data: HTMLElement) => {
      for (let i = 0; i < Faze.Helpers.DataParsers.length; i++) {
        if (data.dataset[dataSortValueString] && Faze.Helpers.DataParsers[i].is(data.dataset[dataSortValueString])) {
          parserCounts[i].count++;
          return;
        }
      }
    });

    // Сортируем парсер по убыванию количества совпадений, чтобы в дальшнейшем вырать парсер,
    // который чаще всего совпадает с ячейками
    parserCounts.sort((a: ParserData, b: ParserData) => {
      return b.count - a.count;
    });

    return Faze.Helpers.DataParsers.find((cellParser: DataParser) => cellParser.id === parserCounts[0].id);
  }

  /**
   * Инициализация модуля по data атрибутам
   *
   * @param node DOM элемент на который нужно инициализировать плагин
   */
  static initializeByDataAttributes(node: HTMLElement): void {
    new Sorter(node);
  }
}

export default Sorter;
