import Faze from './components/Core/Faze';
import Shortcuts from './components/Core/Shortcuts';
import Helpers from './components/Helpers/Helpers';

// Навешивание общих события ядра
Faze.bind();

// Инициализация плагинов по data атрибутам
Faze.hotInitialize();

// @ts-ignore
window.Faze = Faze;

// Инициализация помощников
Helpers.initialize();

// Инициализация полезных сокращений
Shortcuts.initialize();
