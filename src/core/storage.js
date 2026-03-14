// ============================================
// 3D MONOLITH — УПРАВЛЕНИЕ ХРАНИЛИЩЕМ
// encoding: UTF-8 без BOM
// ============================================

window.StorageManager = {
    // Префикс для всех ключей
    prefix: 'mon_',
    
    // Сохранение данных
    save: function(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
            return false;
        }
    },
    
    // Загрузка данных
    load: function(key, fallback = null) {
        try {
            const serialized = localStorage.getItem(this.prefix + key);
            if (serialized === null) return fallback;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            return fallback;
        }
    },
    
    // Удаление данных
    remove: function(key) {
        localStorage.removeItem(this.prefix + key);
    },
    
    // Очистка всех данных
    clear: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    },
    
    // Проверка доступного места
    getFreeSpace: function() {
        const free = 5 * 1024 * 1024 - JSON.stringify(localStorage).length;
        return {
            bytes: free,
            kb: Math.round(free / 1024),
            mb: (free / (1024 * 1024)).toFixed(2)
        };
    },
    
    // Проверка заполненности
    getUsagePercent: function() {
        const total = 5 * 1024 * 1024;
        const used = JSON.stringify(localStorage).length;
        return (used / total) * 100;
    }
};

// Алиасы для обратной совместимости
window.saveToStorage = window.StorageManager.save.bind(window.StorageManager);
window.loadFromStorage = window.StorageManager.load.bind(window.StorageManager);

console.log('✅ StorageManager загружен');
