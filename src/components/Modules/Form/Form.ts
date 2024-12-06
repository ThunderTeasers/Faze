/**
 * Плагин формы
 *
 * Автор: Ерохин Максим
 * Дата: 06.12.2024
 */

import './Form.scss';
import Module from '../../Core/Module';

/**
 * Структура возвращаемого объекта в пользовательском методе
 *
 * Содержит:
 *   node - DOM элемент где происходит работа модуля
 *   inputsNode - DOM элементы инпутов
 */
interface CallbackData {
  node: HTMLElement;
  inputsNode: NodeListOf<HTMLInputElement>;
}

/**
 * Структура конфига
 *
 * Содержит:
 *   callbacks
 *     created - пользовательская функция, исполняющаяся при создании
 *     changed - пользовательская функция, исполняющаяся после сабмита формы
 */
interface Config {
  callbacks: {
    created?: (data: CallbackData) => void;
    submitted?: (data: CallbackData) => void;
  };
}

/**
 * Класс
 */
class Form extends Module {}

export default Form;
