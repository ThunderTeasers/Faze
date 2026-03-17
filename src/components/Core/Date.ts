namespace Faze {
  /**
   * Класс для работы с датами
   */
  export class Date {
    // Дни недели
    private static readonly DAYS_OF_WEEK = [
      ['Понедельник', 'Пн'],
      ['Вторник', 'Вт'],
      ['Среда', 'Ср'],
      ['Четверг', 'Чт'],
      ['Пятница', 'Пт'],
      ['Суббота', 'Сб'],
      ['Воскресенье', 'Вс'],
    ];

    // Месяца
    private static readonly MONTHS = [
      ['Январь', 'Января'],
      ['Февраль', 'Февраля'],
      ['Март', 'Марта'],
      ['Апрель', 'Апреля'],
      ['Май', 'Мая'],
      ['Июнь', 'Июня'],
      ['Июль', 'Июля'],
      ['Август', 'Августа'],
      ['Сентябрь', 'Сентября'],
      ['Октябрь', 'Октября'],
      ['Ноябрь', 'Ноября'],
      ['Декабрь', 'Декабря'],
    ];

    /**
     * Возвращает день недели в человекочитаемом виде
     *
     * @param day{number} День недели 0-6
     * @param isShort{boolean} Нужно ли сокращение
     *
     * @return{string} День недели в человекочитаемом виде
     */
    static getDayOfWeek(day: number, isShort: boolean = false): string {
      if (day < 0 || day > 6) {
        throw new Error('Несуществующий индекс дня недели!');
      }

      return Faze.Date.DAYS_OF_WEEK[day][isShort ? 1 : 0];
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
      if (month < 0 || month > 11) {
        throw new Error('Несуществующий индекс месяца!');
      }

      return Faze.Date.MONTHS[month][isDeclination ? 1 : 0];
    }
  }
}

export default Faze.Date;
