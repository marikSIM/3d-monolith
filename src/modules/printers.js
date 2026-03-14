// ============================================
// 3D MONOLITH — УПРАВЛЕНИЕ ПАРКОМ ПРИНТЕРОВ
// encoding: UTF-8 без BOM
// Версия: 2026.1
// ============================================

/**
 * СИСТЕМА УПРАВЛЕНИЯ ПАРКОМ ПРИНТЕРОВ
 * Поддержка FDM и SLA технологий с раздельными конфигурациями
 */

window.PrinterFarm = {
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init: function() {
        this.loadPrinterFarms();
        this.loadPrinterConfigs();
        console.log('✅ PrinterFarm инициализирован');
    },
    
    // ===== ЗАГРУЗКА ПАРКОВ ПРИНТЕРОВ =====
    loadPrinterFarms: function() {
        // Загрузка FDM парка
        const fdmSaved = localStorage.getItem('mon_printer_farm_fdm');
        window.PRINTER_FARM_FDM = fdmSaved ? JSON.parse(fdmSaved) : [];
        
        // Загрузка SLA парка
        const slaSaved = localStorage.getItem('mon_printer_farm_sla');
        window.PRINTER_FARM_SLA = slaSaved ? JSON.parse(slaSaved) : [];
        
        console.log(`📊 Загружено принтеров: FDM=${window.PRINTER_FARM_FDM.length}, SLA=${window.PRINTER_FARM_SLA.length}`);
    },
    
    // ===== КОНФИГУРАЦИИ ПО ТЕХНОЛОГИЯМ =====
    loadPrinterConfigs: function() {
        window.PRINTER_CONFIGS = {
            fdm: {
                printSpeed: { min: 20, max: 600, unit: 'мм/с', default: 250 },
                layerHeight: { min: 0.05, max: 0.4, unit: 'мм', default: 0.2 },
                nozzleDiameter: { options: [0.2, 0.4, 0.6, 0.8], unit: 'мм', default: 0.4 },
                printTemperature: { min: 180, max: 300, unit: '°C', default: 220 },
                bedTemperature: { min: 0, max: 110, unit: '°C', default: 60 },
                filamentDiameter: { options: [1.75, 2.85], unit: 'мм', default: 1.75 },
                infillDensity: { min: 0, max: 100, unit: '%', default: 20 },
                wallThickness: { min: 0.4, max: 4.8, unit: 'мм', default: 0.8 },
                supportDensity: { min: 0, max: 100, unit: '%', default: 15 },
                fanSpeed: { min: 0, max: 100, unit: '%', default: 100 }
            },
            sla: {
                layerHeight: { min: 0.01, max: 0.1, unit: 'мм', default: 0.05 },
                normalExposure: { min: 1, max: 60, unit: 'сек', default: 2.5 },
                bottomExposure: { min: 10, max: 120, unit: 'сек', default: 30 },
                bottomLayers: { min: 3, max: 10, unit: 'шт', default: 5 },
                liftSpeed: { min: 1, max: 10, unit: 'мм/мин', default: 3 },
                retractSpeed: { min: 1, max: 15, unit: 'мм/мин', default: 5 },
                resinType: { options: ['Standard', 'Tough', 'Flexible', 'Castable', 'Dental'], unit: '', default: 'Standard' },
                screenResolution: { options: ['4K', '6K', '8K', '12K'], unit: '', default: '4K' },
                supportDensity: { options: ['light', 'medium', 'heavy'], default: 'medium' },
                supportType: { options: ['normal', 'tree', 'hybrid'], default: 'tree' },
                antiAlias: { min: 0, max: 16, unit: 'x', default: 4 },
                lightOffDelay: { min: 0, max: 10, unit: 'сек', default: 1 },
                postCureTime: { min: 5, max: 120, unit: 'мин', default: 30 },
                postCureTemp: { min: 40, max: 80, unit: '°C', default: 60 }
            }
        };
    },
    
    // ===== СОЗДАНИЕ НОВОГО ПРИНТЕРА =====
    createPrinter: function(technology, data = {}) {
        const id = technology + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        
        const basePrinter = {
            id: id,
            technology: technology,
            name: data.name || (technology === 'fdm' ? 'Новый FDM принтер' : 'Новый SLA принтер'),
            manufacturer: data.manufacturer || '',
            model: data.model || '',
            serialNumber: data.serialNumber || '',
            status: {
                state: 'active', // active, maintenance, broken, printing
                currentJob: null,
                totalPrintHours: 0,
                lastMaintenance: timestamp,
                nextMaintenance: this.addMonths(timestamp, 3),
                nozzleCondition: technology === 'fdm' ? 100 : undefined,
                bedCondition: technology === 'fdm' ? 100 : undefined,
                filmCondition: technology === 'sla' ? 100 : undefined,
                screenCondition: technology === 'sla' ? 100 : undefined
            },
            statistics: {
                totalPrints: 0,
                successfulPrints: 0,
                failedPrints: 0,
                totalMaterialUsed: 0,
                averagePrintTime: 0,
                successRate: 0
            },
            createdAt: timestamp,
            updatedAt: timestamp
        };
        
        // Добавляем специфичные поля для технологии
        if (technology === 'fdm') {
            basePrinter.specs = {
                buildVolume: { x: data.buildVolumeX || 200, y: data.buildVolumeY || 200, z: data.buildVolumeZ || 200, unit: 'мм' },
                nozzleDiameter: data.nozzleDiameter || 0.4,
                filamentDiameter: data.filamentDiameter || 1.75,
                maxPrintSpeed: data.maxPrintSpeed || 250,
                maxAccel: data.maxAccel || 20000,
                heatedBed: data.heatedBed !== false,
                maxBedTemp: data.maxBedTemp || 100,
                maxNozzleTemp: data.maxNozzleTemp || 300,
                chamberHeating: data.chamberHeating || false,
                maxChamberTemp: data.maxChamberTemp || 0,
                filamentSensor: data.filamentSensor !== false,
                bedLeveling: data.bedLeveling || 'auto',
                kinematics: data.kinematics || 'corexy'
            };
            
            basePrinter.defaultSettings = {
                layerHeight: data.layerHeight || 0.2,
                wallThickness: data.wallThickness || 0.8,
                infillDensity: data.infillDensity || 20,
                printSpeed: data.printSpeed || 250,
                travelSpeed: data.travelSpeed || 500,
                printTemperature: data.printTemperature || 220,
                bedTemperature: data.bedTemperature || 60,
                fanSpeed: data.fanSpeed || 100,
                supportEnabled: data.supportEnabled !== false,
                supportDensity: data.supportDensity || 15,
                brimEnabled: data.brimEnabled || false,
                brimWidth: data.brimWidth || 5
            };
            
            basePrinter.economics = {
                hourlyRate: data.hourlyRate || 250,
                powerConsumption: data.powerConsumption || 0.15,
                purchasePrice: data.purchasePrice || 0,
                maintenanceCostPerHour: data.maintenanceCostPerHour || 5,
                nozzleReplacementCost: data.nozzleReplacementCost || 500,
                nozzleLifetime: data.nozzleLifetime || 500
            };
            
        } else if (technology === 'sla') {
            basePrinter.specs = {
                buildVolume: { x: data.buildVolumeX || 200, y: data.buildVolumeY || 120, z: data.buildVolumeZ || 200, unit: 'мм' },
                screenResolution: data.screenResolution || '4K',
                pixelSize: data.pixelSize || 35,
                lightSource: data.lightSource || 'UV LED',
                wavelength: data.wavelength || 405,
                zAxisType: data.zAxisType || 'dual',
                resinTank: {
                    capacity: data.vatCapacity || 1.2,
                    filmLifetime: data.filmLifetime || 2000,
                    filmReplacementCost: data.filmReplacementCost || 3000
                }
            };
            
            basePrinter.defaultSettings = {
                layerHeight: data.layerHeight || 0.05,
                normalExposure: data.normalExposure || 2.5,
                bottomExposure: data.bottomExposure || 30,
                bottomLayers: data.bottomLayers || 5,
                liftSpeed: data.liftSpeed || 3,
                retractSpeed: data.retractSpeed || 5,
                supportDensity: data.supportDensity || 'medium',
                supportType: data.supportType || 'tree',
                antiAlias: data.antiAlias || 4,
                lightOffDelay: data.lightOffDelay || 1,
                postCureTime: data.postCureTime || 30,
                postCureTemp: data.postCureTemp || 60
            };
            
            basePrinter.economics = {
                hourlyRate: data.hourlyRate || 180,
                powerConsumption: data.powerConsumption || 0.05,
                purchasePrice: data.purchasePrice || 0,
                maintenanceCostPerHour: data.maintenanceCostPerHour || 3,
                filmReplacementCost: data.filmReplacementCost || 3000,
                filmLifetime: data.filmLifetime || 2000,
                resinWastePercent: data.resinWastePercent || 5
            };
        }
        
        // Сохраняем в соответствующий парк
        const farm = technology === 'fdm' ? window.PRINTER_FARM_FDM : window.PRINTER_FARM_SLA;
        farm.push(basePrinter);
        this.savePrinterFarms();
        
        console.log(`✅ Создан принтер ${basePrinter.name} (${technology.toUpperCase()})`);
        return basePrinter;
    },
    
    // ===== ПОЛУЧЕНИЕ ПРИНТЕРА =====
    getPrinter: function(printerId) {
        // Поиск в FDM парке
        let printer = window.PRINTER_FARM_FDM.find(p => p.id === printerId);
        if (printer) return printer;
        
        // Поиск в SLA парке
        printer = window.PRINTER_FARM_SLA.find(p => p.id === printerId);
        return printer || null;
    },
    
    // ===== ОБНОВЛЕНИЕ ПРИНТЕРА =====
    updatePrinter: function(printerId, updates) {
        const printer = this.getPrinter(printerId);
        if (!printer) {
            console.error(`❌ Принтер ${printerId} не найден`);
            return false;
        }
        
        // Обновляем поля
        Object.assign(printer, updates);
        printer.updatedAt = new Date().toISOString();
        
        this.savePrinterFarms();
        console.log(`✅ Обновлён принтер ${printer.name}`);
        return true;
    },
    
    // ===== УДАЛЕНИЕ ПРИНТЕРА =====
    deletePrinter: function(printerId) {
        const printer = this.getPrinter(printerId);
        if (!printer) return false;
        
        const farm = printer.technology === 'fdm' ? window.PRINTER_FARM_FDM : window.PRINTER_FARM_SLA;
        const index = farm.findIndex(p => p.id === printerId);
        
        if (index > -1) {
            farm.splice(index, 1);
            this.savePrinterFarms();
            console.log(`✅ Удалён принтер ${printer.name}`);
            return true;
        }
        
        return false;
    },
    
    // ===== СОХРАНЕНИЕ ПАРКОВ =====
    savePrinterFarms: function() {
        localStorage.setItem('mon_printer_farm_fdm', JSON.stringify(window.PRINTER_FARM_FDM));
        localStorage.setItem('mon_printer_farm_sla', JSON.stringify(window.PRINTER_FARM_SLA));
    },
    
    // ===== ПОЛУЧЕНИЕ ВСЕХ ПРИНТЕРОВ =====
    getAllPrinters: function(technology) {
        if (technology === 'fdm') return window.PRINTER_FARM_FDM;
        if (technology === 'sla') return window.PRINTER_FARM_SLA;
        return [...window.PRINTER_FARM_FDM, ...window.PRINTER_FARM_SLA];
    },
    
    // ===== ПОЛУЧЕНИЕ АКТИВНЫХ ПРИНТЕРОВ =====
    getActivePrinters: function(technology) {
        const printers = this.getAllPrinters(technology);
        return printers.filter(p => p.status.state === 'active');
    },
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    addMonths: function(dateStr, months) {
        const date = new Date(dateStr);
        date.setMonth(date.getMonth() + months);
        return date.toISOString();
    },
    
    // ===== СТАТИСТИКА =====
    updatePrinterStatistics: function(printerId, printData) {
        const printer = this.getPrinter(printerId);
        if (!printer) return;
        
        const stats = printer.statistics;
        stats.totalPrints++;
        
        if (printData.success) {
            stats.successfulPrints++;
        } else {
            stats.failedPrints++;
        }
        
        stats.successRate = Math.round((stats.successfulPrints / stats.totalPrints) * 100);
        stats.totalMaterialUsed += printData.materialUsed || 0;
        
        // Скользящее среднее времени печати
        const totalPrints = stats.totalPrints;
        stats.averagePrintTime = ((stats.averagePrintTime * (totalPrints - 1)) + printData.printTime) / totalPrints;
        
        printer.updatedAt = new Date().toISOString();
        this.savePrinterFarms();
    }
};

// ===== БЫСТРЫЕ АЛИАСЫ =====
window.getPrinterFarm = window.PrinterFarm.getAllPrinters.bind(window.PrinterFarm);
window.getPrinter = window.PrinterFarm.getPrinter.bind(window.PrinterFarm);
window.createPrinter = window.PrinterFarm.createPrinter.bind(window.PrinterFarm);
window.updatePrinter = window.PrinterFarm.updatePrinter.bind(window.PrinterFarm);
window.deletePrinter = window.PrinterFarm.deletePrinter.bind(window.PrinterFarm);

// Автоинициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.PrinterFarm.init());
} else {
    window.PrinterFarm.init();
}

console.log('✅ PrinterFarm модуль загружен');
