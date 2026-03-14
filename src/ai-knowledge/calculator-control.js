/**
 * 3D MONOLITH AI - УПРАВЛЕНИЕ КАЛЬКУЛЯТОРОМ
 * Файл: calculator-control.js
 * Описание: ИИ может управлять настройками калькулятора
 */

window.AI_CALC_CONTROL = window.AI_CALC_CONTROL || {
    // История изменений
    changeHistory: [],
    
    // Последнее состояние
    lastState: null
};

console.log('✅ AI Calculator Control модуль загружен');
console.log('🎛️ AI_CALC_CONTROL:', window.AI_CALC_CONTROL);
window.AI_CALC_CONTROL.getState = function() {
    const state = {
        printer: document.getElementById('printer-select')?.value || null,
        tech: document.getElementById('tech')?.value || null,
        material: document.getElementById('mat')?.value || null,
        layer: document.getElementById('layer')?.value || null,
        infill: document.getElementById('infill')?.value || null,
        waste: document.getElementById('waste')?.value || null,
        urgent: document.getElementById('urgent')?.value || null,
        discount: document.getElementById('discount')?.value || null,
        modelling: document.getElementById('modelling')?.value || null,
        electricityRate: document.getElementById('electricity-rate')?.value || null,
        partName: document.getElementById('part-name')?.value || null,
        clientName: document.getElementById('client-name')?.value || null,
        manualTime: document.getElementById('manual-time')?.value || null,
        manualPrice: document.getElementById('manual-price')?.value || null,
        timestamp: Date.now()
    };
    
    this.lastState = state;
    return state;
};

// Установка значения
window.AI_CALC_CONTROL.setValue = function(elementId, value, reason = '') {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`⚠️ Элемент ${elementId} не найден`);
        return false;
    }
    
    // Сохраняем старое значение
    const oldValue = element.value;
    
    // Устанавливаем новое
    element.value = value;
    
    console.log(`🎛️ Изменено: ${elementId} = ${value} (${reason})`);
    
    // Создаем событие change
    const event = new Event('change', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    
    // Записываем в историю
    this.changeHistory.push({
        element: elementId,
        oldValue: oldValue,
        newValue: value,
        reason: reason,
        timestamp: Date.now()
    });
    
    // Запускаем пересчет через небольшую задержку
    if (typeof window.autoCalculate === 'function') {
        setTimeout(() => {
            console.log('🔄 Запускаю autoCalculate()');
            window.autoCalculate();
        }, 200);
    }
    
    return true;
};

// Массовая установка значений
window.AI_CALC_CONTROL.setValues = function(values, reason) {
    reason = reason || '';
    const results = {};

    Object.entries(values).forEach(function(key, value) {
        results[key] = this.setValue(key, value, reason);
    }.bind(this));

    return results;
};

// Сброс к значениям по умолчанию
window.AI_CALC_CONTROL.resetToDefaults = function() {
    const defaults = {
        layer: '0.2',
        infill: '20',
        waste: '5',
        urgent: '1',
        discount: '0',
        modelling: '0'
    };
    
    return this.setValues(defaults, 'Сброс к значениям по умолчанию');
};

// Применение пресета
window.AI_CALC_CONTROL.applyPreset = function(presetName) {
    const presets = {
        'fast': {
            layer: '0.3',
            infill: '15',
            reason: 'Пресет: Быстрая печать'
        },
        'quality': {
            layer: '0.1',
            infill: '40',
            reason: 'Пресет: Высокое качество'
        },
        'standard': {
            layer: '0.2',
            infill: '20',
            reason: 'Пресет: Стандартный'
        },
        'strong': {
            layer: '0.15',
            infill: '60',
            reason: 'Пресет: Прочная деталь'
        },
        'economy': {
            layer: '0.3',
            infill: '10',
            reason: 'Пресет: Экономия материала'
        }
    };
    
    const preset = presets[presetName.toLowerCase()];
    if (!preset) {
        console.warn(`⚠️ Пресет ${presetName} не найден`);
        return false;
    }
    
    const { layer, infill, reason } = preset;
    this.setValue('layer', layer, reason);
    this.setValue('infill', infill, reason);
    
    return true;
};

// Оптимизация под материал
window.AI_CALC_CONTROL.optimizeForMaterial = function(materialType) {
    const optimizations = {
        'pla': {
            layer: '0.2',
            infill: '20',
            reason: 'Оптимизация для PLA'
        },
        'abs': {
            layer: '0.2',
            infill: '25',
            reason: 'Оптимизация для ABS (требуется закрытая камера)'
        },
        'petg': {
            layer: '0.2',
            infill: '25',
            reason: 'Оптимизация для PETG'
        },
        'tpu': {
            layer: '0.2',
            infill: '30',
            reason: 'Оптимизация для TPU (гибкий материал)'
        },
        'nylon': {
            layer: '0.15',
            infill: '30',
            reason: 'Оптимизация для Nylon (прочный материал)'
        }
    };
    
    const opt = optimizations[materialType.toLowerCase()];
    if (!opt) {
        console.warn(`⚠️ Оптимизация для ${materialType} не найдена`);
        return false;
    }
    
    this.setValue('layer', opt.layer, opt.reason);
    this.setValue('infill', opt.infill, opt.reason);
    
    return true;
};

// Получение истории изменений
window.AI_CALC_CONTROL.getHistory = function(limit = 20) {
    return this.changeHistory.slice(-limit);
};

// Отмена последнего изменения
window.AI_CALC_CONTROL.undo = function() {
    const lastChange = this.changeHistory.pop();
    if (!lastChange) {
        console.log('ℹ️ Нечего отменять');
        return false;
    }
    
    this.setValue(lastChange.element, lastChange.oldValue, 'Отмена изменения');
    console.log('↩️ Изменение отменено');
    
    return true;
};

// Экспорт истории
window.AI_CALC_CONTROL.exportHistory = function() {
    const data = {
        exported: new Date().toISOString(),
        history: this.changeHistory,
        lastState: this.lastState
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_control_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

console.log('✅ AI Calculator Control модуль загружен');
