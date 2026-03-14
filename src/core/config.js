// ============================================
// 3D MONOLITH — КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// encoding: UTF-8 без BOM
// ============================================

window.APP_CONFIG = {
    version: '2026.1.0',
    encoding: 'UTF-8',
    language: 'ru',
    
    // Настройки по умолчанию
    defaults: {
        margin: 1.15,
        minOrder: 500,
        setupFee: 150,
        electricity: 5.5
    },
    
    // Материалы по умолчанию
    materials: {
        fdm: {
            "Основные": [{n:"PLA", d:1.24, p:1600}, {n:"ABS", d:1.05, p:1500}, {n:"PETG", d:1.27, p:1600}, {n:"ASA", d:1.07, p:2200}],
            "Гибкие": [{n:"TPU", d:1.21, p:3200}, {n:"TPE", d:1.15, p:3800}],
            "Инженерные": [{n:"Nylon", d:1.1, p:4500}, {n:"Carbon Fiber", d:1.3, p:7500}, {n:"Polycarbonate", d:1.2, p:5000}, {n:"PEEK", d:1.3, p:45000}],
            "Декор": [{n:"Wood", d:1.15, p:3800}, {n:"Metal", d:2.5, p:9500}],
            "Поддержки": [{n:"PVA", d:1.25, p:6500}, {n:"HIPS", d:1.04, p:2200}]
        },
        sla: {
            "Стандартные": [{n:"Standard Gray", d:1.15, p:6500}, {n:"Standard Clear", d:1.12, p:7000}],
            "Прочные": [{n:"Tough", d:1.2, p:14000}, {n:"ABS-Like", d:1.18, p:12000}],
            "Гибкие": [{n:"Flexible", d:1.1, p:18000}, {n:"Elastic", d:1.08, p:22000}],
            "Литьевые": [{n:"Castable", d:1.18, p:45000}, {n:"Castable Wax", d:1.05, p:52000}],
            "Дентальные": [{n:"Dental Model", d:1.25, p:35000}, {n:"Dental Guide", d:1.3, p:42000}, {n:"Tempo", d:1.22, p:38000}],
            "Прозрачные": [{n:"Transparent", d:1.15, p:16000}, {n:"Optical", d:1.18, p:28000}]
        }
    }
};

// Проверка кодировки при загрузке
APP_CONFIG.checkEncoding = function() {
    const testString = 'Тест кодировки 3D MONOLITH';
    const encoded = encodeURIComponent(testString);
    const decoded = decodeURIComponent(encoded);
    
    if (decoded !== testString) {
        console.error('❌ Проблема с кодировкой UTF-8!');
        return false;
    }
    
    console.log('✅ Кодировка UTF-8 работает корректно');
    return true;
};

// Автопроверка при загрузке
document.addEventListener('DOMContentLoaded', () => {
    APP_CONFIG.checkEncoding();
});

console.log('✅ Config загружен');
