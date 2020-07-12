/**
 * Интерфейс стандартного объекта
 */
interface FazeObject {
  [key: string]: string;
}

/**
 * Интерфейс описания размера
 *
 * Содержит:
 *   width{number}  - ширина
 *   height{number} - высота
 */
interface FazeSize {
  width: number;
  height: number;
}

/**
 * Интерфейс описания координат
 *
 * Содержит:
 *   x{number} - координата по горизонтали
 *   y{number} - координата по вертикали
 */
interface FazePosition {
  x: number;
  y: number;
}

/**
 * Интерфейс описания размера и координат
 *
 * Содержит:
 *   size{FazeSize}         - объект с описанием размера
 *   position{FazePosition} - объект с описанием координат
 */
interface FazePositionAndSize {
  size: FazeSize;
  position: FazePosition;
}

/**
 * Интерфейс описания диапазаона отключения модулей относительно ширины экрана
 *
 * Содержит:
 *   from{number} - с какого пикселя отключаем
 *   to{number} - до какого пикселя отключаем
 */
interface FazeDisallowRange {
  from?: number,
  to?: number,
}
