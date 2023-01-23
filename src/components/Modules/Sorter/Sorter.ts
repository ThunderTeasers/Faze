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

class Sorter extends Module {
  // DOM элементы заголовков сортировщика
  private headerNodes: NodeListOf<HTMLElement>;

  private tbodyNode: HTMLElement;

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
      name: 'Sorter',
    });
  }

  /**
   * Инициализация
   */
  protected initialize(): void {
    this.headerNodes = document.querySelectorAll('[data-faze-sorter-head]');
    this.headerNodes.forEach((head: HTMLElement) => {
      if (!head.dataset.fazeSorterHead) {
        alert(`Не задана группа для заголовка ${head.textContent}`);
      }

      let data: HTMLElement[];

      const bodyNode = document.querySelector(`[data-faze-sorter-body=${head.dataset.fazeSorterHead}]`);
      if (bodyNode) {
        data = Array.from((bodyNode.children || []) as any);
      } else {
        data = Array.from(document.querySelectorAll(`[data-faze-sorter-data=${head.dataset.fazeSorterHead}]`));
      }

      if (data.length) {
        const parentNode = data[0].parentNode;

        if (!head.dataset.fazeSorterValue) {
          alert(`Не задан атрибут сортировки для заголовка ${head.textContent}`);
        }

        const dataSortValue = head.dataset.fazeSorterValue || '';
        const dataSortValueString = `fazeSorter${dataSortValue[0].toUpperCase()}${dataSortValue.slice(1)}`;

        const parserConfig = this.detectParserForColumn(data, dataSortValueString);

        // Флаг обратной сортировки
        let descFlag = false;

        Faze.Helpers.createElement('i', { class: 'fas fa-sort sort-arrow' }, {}, head);

        head.addEventListener('click', () => {
          heads.forEach((head) => {
            head.querySelector('.sort-arrow').classList.remove('fa-sort-up');
            head.querySelector('.sort-arrow').classList.remove('fa-sort-down');
            head.querySelector('.sort-arrow').classList.add('fa-sort');
          });

          head.querySelector('.sort-arrow').classList.remove('fa-sort');

          if (descFlag) {
            head.querySelector('.sort-arrow').classList.remove('fa-sort-up');
            head.querySelector('.sort-arrow').classList.add('fa-sort-down');
          } else {
            head.querySelector('.sort-arrow').classList.remove('fa-sort-down');
            head.querySelector('.sort-arrow').classList.add('fa-sort-up');
          }

          data.sort((a, b) => {
            const aValue = a.dataset[dataSortValueString] || '';
            const bValue = b.dataset[dataSortValueString] || '';

            aFormatted = parserConfig.format(aValue);
            bFormatted = parserConfig.format(bValue);

            if (parserConfig.type === 'text') {
              return descFlag ? (bFormatted < aFormatted ? -1 : 1) : aFormatted < bFormatted ? -1 : 1;
            } else {
              return descFlag ? bFormatted - aFormatted : aFormatted - bFormatted;
            }
          });

          parentNode.innerHTML = '';
          data.forEach((data) => {
            parentNode.append(data);
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
}
