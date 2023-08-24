import Faze from './components/Core/Faze';
import Shortcuts from './components/Core/Shortcuts';
import Globals from './components/Core/Globals';
import Helpers from './components/Helpers/Helpers';
import Form from './components/Helpers/Form';

// Навешивание общих события ядра
Faze.bind();

// Инициализация плагинов по data атрибутам
Faze.hotInitialize();

// @ts-ignore
window.Faze = Faze;

// Инициализация помощников
Helpers.initialize();
Form.initialize();
Form.watch();

// Инициализация полезных сокращений
Shortcuts.initialize();
Globals.initialize();
