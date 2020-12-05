namespace Faze {
  /**
   * Класс для работы с датами
   */
  export class Date {
    /**
     * Возвращает день недели в человекочитаемом виде
     *
     * @param day{number} День недели 0-6
     * @param isShort{boolean} Нужно ли сокращение
     *
     * @return{string} День недели в человекочитаемом виде
     */
    static getDayOfWeek(day: number, isShort: boolean = false): string {
      let result;
      switch (day) {
        case 0:
          result = isShort ? 'Пн' : 'Понедельник';
          break;
        case 1:
          result = isShort ? 'Вт' : 'Вторник';
          break;
        case 2:
          result = isShort ? 'Ср' : 'Среда';
          break;
        case 3:
          result = isShort ? 'Чт' : 'Четверг';
          break;
        case 4:
          result = isShort ? 'Пт' : 'Пятница';
          break;
        case 5:
          result = isShort ? 'Сб' : 'Суббота';
          break;
        case 6:
          result = isShort ? 'Вс' : 'Воскресенье';
          break;
        default:
          result = '';

          throw new Error('Несуществующий индекс дня недели!');
      }

      return result;
    }

    /**
     * Возвращает месяц в человекочитаемом виде
     *
     * @param month{number} Индекс месяца
     * @param isDeclination{boolean} Нужно ли склонение месяца
     *
     * @return{string} Месяц в человекочитаемом виде
     */
    static getMonth(month: number, isDeclination: boolean = false): string {
      let result;

      switch (month) {
        case 0:
          result = isDeclination ? 'Января' : 'Январь';
          break;
        case 1:
          result = isDeclination ? 'Февраля' : 'Февраль';
          break;
        case 2:
          result = isDeclination ? 'Марта' : 'Март';
          break;
        case 3:
          result = isDeclination ? 'Апреля' : 'Апрель';
          break;
        case 4:
          result = isDeclination ? 'Мая' : 'Май';
          break;
        case 5:
          result = isDeclination ? 'Июня' : 'Июнь';
          break;
        case 6:
          result = isDeclination ? 'Июля' : 'Июль';
          break;
        case 7:
          result = isDeclination ? 'Августа' : 'Август';
          break;
        case 8:
          result = isDeclination ? 'Сентября' : 'Сентябрь';
          break;
        case 9:
          result = isDeclination ? 'Октября' : 'Октябрь';
          break;
        case 10:
          result = isDeclination ? 'Ноября' : 'Ноябрь';
          break;
        case 11:
          result = isDeclination ? 'Декабря' : 'Декабрь';
          break;
        default:
          result = '';

          throw new Error('Несуществующий индекс месяца!');
      }

      return result;
    }
  }
}

export default Faze.Date;