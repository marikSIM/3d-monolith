// ============================================
// 3D MONOLITH — БАЗОВЫЕ УТИЛИТЫ
// encoding: UTF-8 без BOM
// ============================================

/**
 * Экранирование HTML для XSS-защиты
 * @param {string} str - Строка для экранирования
 * @returns {string} - Экранированная строка
 */
window.escapeHtml = function(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/**
 * Безопасная вставка HTML с пользовательскими данными
 */
window.safeHtml = function(strings, ...values) {
    return strings.reduce((result, str, i) =>
        result + (i < values.length ? window.escapeHtml(values[i]) : '') + str,
    '');
};

/**
 * Дополнительная функция для экранирования
 */
window.safeEscapeHTML = window.escapeHtml;

/**
 * БЕЗОПАСНЫЙ PARSEJSON С ОБРАБОТКОЙ ОШИБОК
 * @param {string} jsonString - JSON строка
 * @param {any} fallback - Значение по умолчанию при ошибке
 * @returns {any} - Распарсенный объект или fallback
 */
window.safeParseJSON = function(jsonString, fallback = null) {
    if (!jsonString || typeof jsonString !== 'string') {
        return fallback;
    }
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn('⚠️ Ошибка парсинга JSON:', e.message);
        return fallback;
    }
};

/**
 * ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
 */
window.validateString = function(value, fieldName) {
    if (typeof value !== 'string') throw new Error((fieldName || 'Поле') + ' должно быть строкой');
    if (value.length > 1000) throw new Error((fieldName || 'Поле') + ' слишком длинное');
    return value.trim();
};

window.validateNumber = function(value, fieldName, min, max) {
    const num = Number(value);
    if (isNaN(num)) throw new Error((fieldName || 'Поле') + ' должно быть числом');
    if (num < (min || -Infinity) || num > (max || Infinity)) throw new Error((fieldName || 'Поле') + ' вне диапазона');
    return num;
};

window.validateId = function(id, fieldName) {
    if (!id || typeof id !== 'string') throw new Error((fieldName || 'ID') + ' некорректен');
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error((fieldName || 'ID') + ' содержит недопустимые символы');
    return id;
};

console.log('✅ Utils загружен');
