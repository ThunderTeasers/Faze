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
