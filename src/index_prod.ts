import Faze from './components/Core/Faze';
import Shortcuts from './components/Core/Shortcuts';

// Инициализация плагинов по data атрибутам
Faze.hotInitialize();

// @ts-ignore
window.Faze = Faze;

// Инициализация полезных сокращений
Shortcuts.initialize();
