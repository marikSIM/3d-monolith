// ============================================
// 3D MONOLITH — КАЛЬКУЛЯТОР С УЧЁТОМ ПАРАМЕТРОВ ПРИНТЕРА
// encoding: UTF-8 без BOM
// Версия: 2026.1
// ============================================

/**
 * РАСЧЁТ ВРЕМЕНИ ПЕЧАТИ (FDM)
 */
window.CalculatorFD = {
    calculatePrintTime: function(model, printer, settings) {
        // Базовое время из слайсера (если есть)
        if (model.slicerTime) {
            return this.adjustTimeForPrinter(model.slicerTime, printer, settings);
        }
        
        const volume = model.volume || 0; // см³
        const layerHeight = settings.layerHeight || printer.defaultSettings.layerHeight;
        const printSpeed = settings.printSpeed || printer.defaultSettings.printSpeed;
        const infillDensity = settings.infillDensity || printer.defaultSettings.infillDensity;
        
        // Расчёт количества слоёв
        const modelHeight = model.dimensions?.z || 0;
        const layerCount = modelHeight / layerHeight;
        
        // Расчёт длины пути экструдера
        const perimeterLength = this.calculatePerimeterLength(model, layerHeight);
        const infillLength = this.calculateInfillLength(model, infillDensity, layerHeight);
        const travelLength = this.calculateTravelLength(model, layerCount);
        
        const totalLength = perimeterLength + infillLength + travelLength;
        
        // Время печати
        const printTime = totalLength / printSpeed;
        
        // Дополнительные операции
        const setupTime = 5 / 60; // часов (прогрев, калибровка)
        const cooldownTime = 10 / 60; // часов (остывание)
        const supportRemovalTime = this.estimateSupportRemoval(model, settings) / 60;
        
        const totalTime = printTime + setupTime + cooldownTime + supportRemovalTime;
        
        return {
            printTime: printTime * 60, // минут
            totalTime: totalTime * 60, // минут
            layers: Math.round(layerCount),
            filamentLength: totalLength, // мм
            filamentWeight: this.calculateFilamentWeight(totalLength, settings.filamentDiameter || 1.75)
        };
    },
    
    calculatePerimeterLength: function(model, layerHeight) {
        // Упрощённый расчёт периметра
        const perimeter = model.volume || 0;
        return perimeter * 10; // эвристический коэффициент
    },
    
    calculateInfillLength: function(model, infillDensity, layerHeight) {
        const volume = model.volume || 0;
        const infillFactor = infillDensity / 100;
        return volume * infillFactor * 5;
    },
    
    calculateTravelLength: function(model, layerCount) {
        const volume = model.volume || 0;
        return volume * layerCount * 0.1;
    },
    
    calculateFilamentWeight: function(length, diameter) {
        const radius = diameter / 2;
        const volume = Math.PI * radius * radius * length / 1000; // см³
        const density = 1.24; // г/см³ (PLA)
        return volume * density; // г
    },
    
    estimateSupportRemoval: function(model, settings) {
        if (!settings.supportEnabled) return 0;
        return 5 + (model.volume || 0) * 0.5; // минут
    },
    
    adjustTimeForPrinter: function(baseTime, printer, settings) {
        const speedFactor = printer.defaultSettings.printSpeed / 250;
        return baseTime / speedFactor;
    }
};

/**
 * РАСЧЁТ ВРЕМЕНИ ПЕЧАТИ (SLA)
 */
window.CalculatorSLA = {
    calculatePrintTime: function(model, printer, settings) {
        // Базовое время из слайсера (если есть)
        if (model.slicerTime) {
            return this.adjustTimeForPrinter(model.slicerTime, printer, settings);
        }
        
        const layerHeight = settings.layerHeight || printer.defaultSettings.layerHeight;
        const normalExposure = settings.normalExposure || printer.defaultSettings.normalExposure;
        const bottomExposure = settings.bottomExposure || printer.defaultSettings.bottomExposure;
        const bottomLayers = settings.bottomLayers || printer.defaultSettings.bottomLayers;
        const liftSpeed = settings.liftSpeed || printer.defaultSettings.liftSpeed;
        
        // Расчёт количества слоёв
        const modelHeight = model.dimensions?.z || 0;
        const layerCount = Math.ceil(modelHeight / layerHeight);
        
        // Время экспозиции
        const bottomExposureTime = bottomLayers * bottomExposure;
        const normalExposureTime = (layerCount - bottomLayers) * normalExposure;
        
        // Время подъёма/опускания
        const liftHeight = printer.specs.buildVolume.z;
        const liftTime = layerCount * (liftHeight / liftSpeed / 60);
        
        // Время ожидания между слоями
        const lightOffDelay = printer.defaultSettings.lightOffDelay || 1;
        const delayTime = layerCount * lightOffDelay;
        
        // Общее время
        const exposureTime = (bottomExposureTime + normalExposureTime) / 60; // минуты
        const mechanicalTime = liftTime + delayTime; // минуты
        
        // Пост-обработка
        const washingTime = 10; // минут (мойка)
        const curingTime = printer.defaultSettings.postCureTime; // минут (сушка)
        const supportRemovalTime = this.estimateSLASupportRemoval(model, settings);
        
        const totalTime = exposureTime + mechanicalTime + washingTime + curingTime + supportRemovalTime;
        
        // Расчёт расхода смолы
        const modelVolume = model.volume || 0; // см³
        const supportVolume = modelVolume * (settings.supportDensity === 'heavy' ? 0.3 : 
                                              settings.supportDensity === 'medium' ? 0.15 : 0.08);
        const totalResinVolume = (modelVolume + supportVolume) * 1.05; // 5% на потери
        const density = 1.15; // г/см³
        const resinWeight = totalResinVolume * density;
        
        return {
            printTime: (exposureTime + mechanicalTime) / 60, // часы
            totalTime: totalTime / 60, // часы
            layers: layerCount,
            resinVolume: totalResinVolume, // мл
            resinWeight: resinWeight, // г
            supportVolume: supportVolume // мл
        };
    },
    
    estimateSLASupportRemoval: function(model, settings) {
        return 10 + (model.volume || 0) * 0.8; // минут
    },
    
    adjustTimeForPrinter: function(baseTime, printer, settings) {
        return baseTime; // SLA время более стабильно
    }
};

/**
 * РАСЧЁТ ДЛЯ SLA (полный цикл)
 */
window.CalculatorSLA.calculate = function() {
    // Получаем данные из UI
    const tech = document.getElementById('tech')?.value || 'sla';
    const matVal = document.getElementById('mat')?.value || '1.15|6500'; // Standard Resin
    const matParts = matVal.split('|');
    const density = parseFloat(matParts[0]) || 1.15;
    const pricePerLiter = parseFloat(matParts[1]) || 6500;
    
    console.log('🔹 SLA расчёт:', { density, pricePerLiter, matVal });

    const time = parseFloat(document.getElementById('manual-time')?.value) || 0;
    if (time === 0) {
        const priceDisplay = document.getElementById('price-val');
        if (priceDisplay) priceDisplay.innerText = "Укажите время печати 🕒";
        return;
    }

    // Получаем объём из PWMO или рассчитываем по времени
    let volumeCm3 = parseFloat(window.realVol) || 0;
    if (volumeCm3 === 0) {
        // Расчёт по времени: 1 час ≈ 0.65г смолы
        volumeCm3 = (time * 0.65) / density;
    }

    const weightGrams = volumeCm3 * density;
    const materialCost = (volumeCm3 / 1000) * pricePerLiter; // см³ → литры
    console.log('🔹 Материал:', volumeCm3.toFixed(1), 'см³ ×', pricePerLiter, '₽/л =', materialCost.toFixed(2), '₽');
    
    // Получаем тариф принтера
    const pId = document.getElementById('printer-select')?.value || "custom";
    const pConf = window.PRINTER_PRESETS[pId] || { hourly: 250, power: 0.15 };
    
    // Стоимость времени печати
    const printerTimeCost = time * pConf.hourly;
    
    // Электроэнергия (SLA потребляет ~0.1-0.15 кВт)
    const electricityRate = parseFloat(document.getElementById('electricity-rate')?.value) || 5.5;
    const electricityCost = pConf.power * electricityRate * time;
    
    // Пост-обработка (мойка + засветка)
    const postProcessingCost = 150; // фиксированная стоимость
    
    // Дополнительные работы
    const modellingCost = parseFloat(document.getElementById('modelling')?.value) || 0;
    
    // Полная себестоимость
    const productionCost = materialCost + printerTimeCost + electricityCost + postProcessingCost + modellingCost;
    
    // Наценка
    const currentMargin = window.USER_CONFIG.margin || 1.25;
    const setupFee = window.USER_CONFIG.setupFee || 150;
    const minLimit = window.USER_CONFIG.minOrder || 300;
    const urgentFactor = parseFloat(document.getElementById('urgent')?.value) || 1.0;
    const discountFactor = (100 - (parseFloat(document.getElementById('discount')?.value) || 0)) / 100;
    
    // Цена с маржой
    const priceWithMargin = (productionCost + setupFee) * currentMargin * urgentFactor;
    
    // Налог
    const taxRateInput = parseFloat(document.getElementById('bn-tax')?.value || localStorage.getItem('mon_tax_rate') || 6);
    const taxFactor = taxRateInput / 100;
    const priceWithTax = priceWithMargin / (1 - taxFactor);
    
    // Скидка клиента
    const priceWithClientDiscount = priceWithTax * discountFactor;
    
    // Итоговая цена
    let total = Math.max(priceWithClientDiscount, minLimit);
    
    // Отображение
    const priceDisplay = document.getElementById('price-val');
    if (priceDisplay) {
        priceDisplay.innerText = Math.round(total).toLocaleString('ru-RU') + ' ₽';
        priceDisplay.style.color = "#fff";
    }
    
    // Отображение веса и объёма
    const weightDisplay = document.getElementById('st-w-total');
    if (weightDisplay) {
        weightDisplay.innerText = weightGrams.toFixed(1);
    }
    
    const volumeDisplay = document.getElementById('real-vol-display');
    if (volumeDisplay) {
        volumeDisplay.innerText = volumeCm3.toFixed(1);
    }
    
    console.log(`✅ SLA расчёт: ${volumeCm3.toFixed(1)}см³, ${weightGrams.toFixed(1)}г, ${time.toFixed(1)}ч, ${Math.round(total)}₽`);
    
    return {
        volume: volumeCm3,
        weight: weightGrams,
        time: time,
        materialCost: Math.round(materialCost),
        totalCost: Math.round(total)
    };
};

/**
 * РАСЧЁТ СТОИМОСТИ (FDM)
 */
window.CalculatorCostFDM = {
    calculate: function(printTime, material, printer, settings, electricityRate = 5.5) {
        const printTimeHours = printTime.totalTime / 60;
        
        // Стоимость материала
        const materialCost = printTime.filamentWeight / 1000 * material.pricePerKg;
        
        // Стоимость работы принтера
        const printerCost = printTimeHours * printer.economics.hourlyRate;
        
        // Стоимость электроэнергии
        const electricityCost = printTimeHours * printer.economics.powerConsumption * electricityRate;
        
        // Амортизация сопла
        const nozzleWear = (printTimeHours / printer.economics.nozzleLifetime) * printer.economics.nozzleReplacementCost;
        
        // Обслуживание
        const maintenanceCost = printTimeHours * printer.economics.maintenanceCostPerHour;
        
        // Поддержки
        const supportCost = materialCost * (settings.supportEnabled ? 0.1 : 0);
        
        const totalCost = materialCost + printerCost + electricityCost + nozzleWear + maintenanceCost + supportCost;
        
        return {
            material: Math.round(materialCost),
            printer: Math.round(printerCost),
            electricity: Math.round(electricityCost),
            depreciation: Math.round(nozzleWear),
            maintenance: Math.round(maintenanceCost),
            supports: Math.round(supportCost),
            total: Math.round(totalCost),
            printTime: printTimeHours
        };
    }
};

/**
 * РАСЧЁТ СТОИМОСТИ (SLA)
 */
window.CalculatorCostSLA = {
    calculate: function(printTime, material, printer, settings, electricityRate = 5.5) {
        const printTimeHours = printTime.totalTime;
        
        // Стоимость смолы
        const resinCost = printTime.resinVolume / 1000 * material.pricePerLiter;
        
        // Стоимость работы принтера
        const printerCost = printTimeHours * printer.economics.hourlyRate;
        
        // Стоимость электроэнергии
        const electricityCost = printTimeHours * printer.economics.powerConsumption * electricityRate;
        
        // Амортизация плёнки FEP/PVF
        const filmWear = (printTimeHours / printer.economics.filmLifetime) * printer.economics.filmReplacementCost;
        
        // Расход изопропилового спирта
        const alcoholCost = 50 / 1000 * 500; // 50мл * 500₽/л
        
        // Отходы смолы
        const wasteCost = resinCost * (material.wastePercent / 100 || 0.05);
        
        const totalCost = resinCost + printerCost + electricityCost + filmWear + alcoholCost + wasteCost;
        
        return {
            resin: Math.round(resinCost),
            printer: Math.round(printerCost),
            electricity: Math.round(electricityCost),
            filmWear: Math.round(filmWear),
            alcohol: Math.round(alcoholCost),
            waste: Math.round(wasteCost),
            total: Math.round(totalCost),
            printTime: printTimeHours
        };
    }
};

// ===== УНИВЕРСАЛЬНЫЙ КАЛЬКУЛЯТОР =====
window.PrinterCalculator = {
    calculate: function(model, printer, material, settings, electricityRate = 5.5) {
        if (!printer || !model) {
            return null;
        }
        
        let printTime, cost;
        
        if (printer.technology === 'fdm') {
            printTime = window.CalculatorFDM.calculatePrintTime(model, printer, settings);
            cost = window.CalculatorCostFDM.calculate(printTime, material, printer, settings, electricityRate);
        } else if (printer.technology === 'sla') {
            printTime = window.CalculatorSLA.calculatePrintTime(model, printer, settings);
            cost = window.CalculatorCostSLA.calculate(printTime, material, printer, settings, electricityRate);
        }
        
        return {
            printTime: printTime,
            cost: cost,
            technology: printer.technology
        };
    }
};

console.log('✅ PrinterCalculator модуль загружен');
