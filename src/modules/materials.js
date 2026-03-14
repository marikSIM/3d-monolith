// ============================================
// 3D MONOLITH — УПРАВЛЕНИЕ МАТЕРИАЛАМИ (FDM + SLA)
// encoding: UTF-8 без BOM
// Версия: 2026.1
// ============================================

/**
 * СИСТЕМА УПРАВЛЕНИЯ МАТЕРИАЛАМИ
 * Поддержка филаментов (FDM) и смол (SLA)
 */

window.MaterialsManager = {
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init: function() {
        this.loadMaterials();
        console.log('✅ MaterialsManager инициализирован');
    },
    
    // ===== ЗАГРУЗКА МАТЕРИАЛОВ =====
    loadMaterials: function() {
        const saved = localStorage.getItem('mon_materials_db');
        let materials = saved ? JSON.parse(saved) : null;
        
        // Миграция старых материалов в новый формат
        if (materials && materials.length > 0) {
            const needsMigration = materials.some(m => !m.technology && !m.type);
            if (needsMigration) {
                console.log('🔄 Миграция старых материалов в новый формат...');
                materials = materials.map(m => {
                    // Если нет поля technology, определяем по категории
                    if (!m.technology && !m.type) {
                        const isSla = m.category === 'Смолы' || m.type === 'resin';
                        return {
                            ...m,
                            technology: isSla ? 'sla' : 'fdm',
                            type: isSla ? 'resin' : 'filament',
                            properties: m.properties || { density: m.density || 1.24 },
                            economics: m.economics || {
                                pricePerKg: m.pricePerKg || 1600,
                                pricePerGram: (m.pricePerKg || 1600) / 1000
                            },
                            stock: m.stock || {
                                quantity: m.stock || 5.0,
                                unit: isSla ? 'L' : 'kg',
                                lowStockThreshold: isSla ? 0.5 : 1.0
                            }
                        };
                    }
                    return m;
                });
                // Сохраняем обновлённые данные
                localStorage.setItem('mon_materials_db', JSON.stringify(materials));
                console.log('✅ Миграция завершена');
            }
        }
        
        window.MATERIALS_DB = materials || this.getDefaultMaterials();
        this.exposeMaterialGlobals(window.MATERIALS_DB);
    },

    // ===== ЭКСПОРТ ГЛОБАЛЬНЫХ ССЫЛОК НА МАТЕРИАЛЫ (для совместимости) =====
    exposeMaterialGlobals: function(materials) {
        const list = materials || window.MATERIALS_DB || [];
        list.forEach((mat) => {
            if (!mat || typeof mat.id !== 'string') return;
            // Только валидные JS идентификаторы
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(mat.id)) {
                window[mat.id] = mat;
            }
        });
    },

    // ===== МАТЕРИАЛЫ ПО УМОЛЧАНИЮ =====
    getDefaultMaterials: function() {
        return [
            // FDM МАТЕРИАЛЫ
            {
                id: 'fdm_pla_001',
                technology: 'fdm',
                name: 'PLA+',
                manufacturer: 'Esun',
                type: 'filament',
                properties: {
                    density: 1.24,
                    filamentDiameter: 1.75,
                    printTemperature: { min: 200, max: 230, recommended: 215 },
                    bedTemperature: { min: 50, max: 70, recommended: 60 },
                    fanSpeed: { min: 50, max: 100, recommended: 100 }
                },
                mechanical: {
                    tensileStrength: 50,
                    elongationAtBreak: 5,
                    flexuralModulus: 3500,
                    heatDeflectionTemp: 55
                },
                economics: {
                    pricePerKg: 1600,
                    pricePerGram: 1.6,
                    wastePercent: 5
                },
                stock: {
                    quantity: 5.0,
                    unit: 'kg',
                    lowStockThreshold: 1.0,
                    location: 'Шкаф 1, Полка 2'
                },
                color: '#3b82f6'
            },
            {
                id: 'fdm_abs_001',
                technology: 'fdm',
                name: 'ABS',
                manufacturer: 'Esun',
                type: 'filament',
                properties: {
                    density: 1.05,
                    filamentDiameter: 1.75,
                    printTemperature: { min: 230, max: 260, recommended: 245 },
                    bedTemperature: { min: 80, max: 110, recommended: 100 },
                    fanSpeed: { min: 0, max: 50, recommended: 0 }
                },
                mechanical: {
                    tensileStrength: 40,
                    elongationAtBreak: 20,
                    flexuralModulus: 2100,
                    heatDeflectionTemp: 95
                },
                economics: {
                    pricePerKg: 1500,
                    pricePerGram: 1.5,
                    wastePercent: 8
                },
                stock: {
                    quantity: 3.5,
                    unit: 'kg',
                    lowStockThreshold: 1.0,
                    location: 'Шкаф 1, Полка 3'
                },
                color: '#ef4444'
            },
            {
                id: 'fdm_petg_001',
                technology: 'fdm',
                name: 'PETG',
                manufacturer: 'Esun',
                type: 'filament',
                properties: {
                    density: 1.27,
                    filamentDiameter: 1.75,
                    printTemperature: { min: 220, max: 250, recommended: 235 },
                    bedTemperature: { min: 70, max: 90, recommended: 80 },
                    fanSpeed: { min: 20, max: 80, recommended: 50 }
                },
                economics: {
                    pricePerKg: 1600,
                    pricePerGram: 1.6,
                    wastePercent: 5
                },
                stock: {
                    quantity: 4.0,
                    unit: 'kg',
                    lowStockThreshold: 1.0
                },
                color: '#10b981'
            },
            
            // SLA МАТЕРИАЛЫ
            {
                id: 'sla_standard_001',
                technology: 'sla',
                category: 'Смолы',
                name: 'Standard Gray Resin',
                manufacturer: 'Elegoo',
                type: 'resin',
                properties: {
                    density: 1.15,
                    viscosity: 200,
                    wavelength: 405,
                    shrinkage: 0.3,
                    postCureTime: 30,
                    postCureTemp: 60
                },
                mechanical: {
                    tensileStrength: 40,
                    elongationAtBreak: 15,
                    flexuralModulus: 2000,
                    heatDeflectionTemp: 50
                },
                printSettings: {
                    normalExposure: 2.5,
                    bottomExposure: 30,
                    bottomLayers: 5,
                    layerHeight: { min: 0.01, max: 0.1, recommended: 0.05 },
                    liftSpeed: 3
                },
                economics: {
                    pricePerLiter: 6500,
                    pricePerMl: 6.5,
                    wastePercent: 5
                },
                stock: {
                    quantity: 3.0,
                    unit: 'L',
                    lowStockThreshold: 0.5,
                    expirationDate: '2027-01-01',
                    location: 'Холодильник 1'
                },
                safety: {
                    storageTemperature: { min: 5, max: 30 },
                    shelfLife: 12,
                    hazardous: true
                },
                color: '#8b5cf6'
            },
            {
                id: 'sla_tough_001',
                technology: 'sla',
                category: 'Смолы',
                name: 'Tough Resin',
                manufacturer: 'Elegoo',
                type: 'resin',
                properties: {
                    density: 1.18,
                    viscosity: 250,
                    wavelength: 405,
                    postCureTime: 30,
                    postCureTemp: 60
                },
                economics: {
                    pricePerLiter: 12000,
                    pricePerMl: 12,
                    wastePercent: 5
                },
                stock: {
                    quantity: 1.5,
                    unit: 'L',
                    lowStockThreshold: 0.5,
                    expirationDate: '2027-06-01'
                },
                color: '#f59e0b'
            },
            {
                id: 'sla_waterwashable_001',
                technology: 'sla',
                category: 'Смолы',
                name: 'WaterWashable Resin',
                manufacturer: 'Elegoo',
                type: 'resin',
                properties: {
                    density: 1.12,
                    viscosity: 180,
                    wavelength: 405,
                    postCureTime: 30,
                    postCureTemp: 60
                },
                economics: {
                    pricePerLiter: 7500,
                    pricePerMl: 7.5,
                    wastePercent: 5
                },
                stock: {
                    quantity: 2.0,
                    unit: 'L',
                    lowStockThreshold: 0.5,
                    expirationDate: '2027-03-01'
                },
                color: '#10b981'
            }
        ];
    },
    
    // ===== ПОЛУЧЕНИЕ МАТЕРИАЛОВ ПО ТЕХНОЛОГИИ =====
    getMaterials: function(technology) {
        if (!technology) return window.MATERIALS_DB;
        return window.MATERIALS_DB.filter(m => m.technology === technology);
    },
    
    // ===== ДОБАВЛЕНИЕ МАТЕРИАЛА =====
    addMaterial: function(material) {
        const id = material.technology + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const newMaterial = {
            ...material,
            id: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        window.MATERIALS_DB.push(newMaterial);
        this.saveMaterials();
        console.log(`✅ Добавлен материал ${newMaterial.name}`);
        return newMaterial;
    },
    
    // ===== ОБНОВЛЕНИЕ МАТЕРИАЛА =====
    updateMaterial: function(materialId, updates) {
        const material = this.getMaterial(materialId);
        if (!material) return false;
        
        Object.assign(material, updates);
        material.updatedAt = new Date().toISOString();
        
        this.saveMaterials();
        console.log(`✅ Обновлён материал ${material.name}`);
        return true;
    },
    
    // ===== ПОЛУЧЕНИЕ МАТЕРИАЛА =====
    getMaterial: function(materialId) {
        return window.MATERIALS_DB.find(m => m.id === materialId) || null;
    },
    
    // ===== УДАЛЕНИЕ МАТЕРИАЛА =====
    deleteMaterial: function(materialId) {
        const index = window.MATERIALS_DB.findIndex(m => m.id === materialId);
        if (index === -1) return false;
        
        const material = window.MATERIALS_DB[index];
        window.MATERIALS_DB.splice(index, 1);
        this.saveMaterials();
        console.log(`✅ Удалён материал ${material.name}`);
        return true;
    },
    
    // ===== СОХРАНЕНИЕ МАТЕРИАЛОВ =====
    saveMaterials: function() {
        localStorage.setItem('mon_materials_db', JSON.stringify(window.MATERIALS_DB));
    },
    
    // ===== ПРОВЕРКА ОСТАТКОВ =====
    checkLowStock: function() {
        const lowStockMaterials = window.MATERIALS_DB.filter(m => {
            return m.stock.quantity <= m.stock.lowStockThreshold;
        });
        
        return lowStockMaterials;
    },
    
    // ===== ПРОВЕРКА СРОКА ГОДНОСТИ (SLA) =====
    checkExpiringMaterials: function(days = 30) {
        const now = new Date();
        const expiring = window.MATERIALS_DB.filter(m => {
            if (!m.stock.expirationDate) return false;
            const expDate = new Date(m.stock.expirationDate);
            const diffTime = expDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= days;
        });
        
        return expiring;
    },
    
    // ===== СПИСОК НИЗКИХ ОСТАТКОВ =====
    getLowStockAlerts: function() {
        const lowStock = this.checkLowStock();
        return lowStock.map(m => ({
            id: m.id,
            name: m.name,
            technology: m.technology,
            quantity: m.stock.quantity,
            unit: m.stock.unit,
            threshold: m.stock.lowStockThreshold,
            location: m.stock.location
        }));
    }
};

// ===== БЫСТРЫЕ АЛИАСЫ =====
window.getMaterials = window.MaterialsManager.getMaterials.bind(window.MaterialsManager);
window.getMaterial = window.MaterialsManager.getMaterial.bind(window.MaterialsManager);
window.addMaterial = window.MaterialsManager.addMaterial.bind(window.MaterialsManager);
window.updateMaterial = window.MaterialsManager.updateMaterial.bind(window.MaterialsManager);
window.deleteMaterial = window.MaterialsManager.deleteMaterial.bind(window.MaterialsManager);
window.checkLowStock = window.MaterialsManager.checkLowStock.bind(window.MaterialsManager);

// Автоинициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MaterialsManager.init());
} else {
    window.MaterialsManager.init();
}

console.log('✅ MaterialsManager модуль загружен');
