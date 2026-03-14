// ============================================
// 3D MONOLITH — КАЛЬКУЛЯТОР СТОИМОСТИ
// encoding: UTF-8 без BOM
// ============================================

window.Calculator = {
    // Базовые коэффициенты
    coefficients: {
        material: 1.0,
        urgency: 1.0,
        complexity: 1.0
    },
    
    // Расчёт стоимости
    calculate: function(params) {
        const {
            volume,        // Объём см³
            weight,        // Вес г
            materialPrice, // Цена материала ₽/кг
            printTime,     // Время печати часы
            printerHourly, // Стоимость часа принтера ₽/ч
            infill = 20,   // Заполнение %
            layer = 0.2,   // Толщина слоя мм
            urgency = 1.0, // Срочность
            discount = 0   // Скидка %
        } = params;
        
        // Стоимость материала
        const materialCost = (weight / 1000) * materialPrice;
        
        // Стоимость печати
        const printCost = printTime * printerHourly;
        
        // Накладные расходы (электроэнергия, аренда)
        const overhead = printCost * 0.15;
        
        // Итого без наценки
        const subtotal = materialCost + printCost + overhead;
        
        // Наценка
        const margin = window.USER_CONFIG?.margin || 1.15;
        const total = subtotal * margin * urgency;
        
        // Скидка
        const finalPrice = total * (1 - discount / 100);
        
        // Минимальный заказ
        const minOrder = window.USER_CONFIG?.minOrder || 500;
        
        return {
            materialCost: Math.round(materialCost),
            printCost: Math.round(printCost),
            overhead: Math.round(overhead),
            subtotal: Math.round(subtotal),
            margin: Math.round(subtotal * (margin - 1)),
            total: Math.round(total),
            finalPrice: Math.max(Math.round(finalPrice), minOrder),
            minOrder: minOrder
        };
    },
    
    // Расчёт объёма по модели
    calculateVolume: function(mesh) {
        if (!mesh || !mesh.geometry) return 0;
        
        const positions = mesh.geometry.attributes.position;
        let volume = 0;
        
        for (let i = 0; i < positions.count; i += 3) {
            const p1 = new THREE.Vector3().fromBufferAttribute(positions, i);
            const p2 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
            const p3 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
            
            volume += p1.dot(p2.cross(p3)) / 6;
        }
        
        return Math.abs(volume) / 1000; // см³
    },
    
    // Расчёт веса
    calculateWeight: function(volume, density) {
        return volume * density;
    },
    
    // Расчёт времени печати
    calculatePrintTime: function(volume, infill, layerHeight) {
        const baseSpeed = 50; // мм³/с
        const infillFactor = 0.1 + (infill / 100) * 0.9;
        const layerFactor = 0.2 / layerHeight;
        
        return (volume * infillFactor * layerFactor) / baseSpeed / 3600; // часы
    }
};

// Экспорт для удобства
window.calculateCost = window.Calculator.calculate.bind(window.Calculator);

console.log('✅ Calculator загружен');
