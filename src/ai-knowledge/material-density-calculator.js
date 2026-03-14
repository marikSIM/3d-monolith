/**
 * 3D MONOLITH AI - ПЛОТНОСТЬ МАТЕРИАЛОВ И РАСЧЁТЫ
 * Файл: material-density-calculator.js
 * Описание: Полная база плотностей, расчёт веса, длины, стоимости
 * Интеграция: Управление калькулятором, CRM, складом
 * 
 * Этот модуль делает ИИ "домовым" студии:
 * - Знает все материалы и их свойства
 * - Считает вес, длину, стоимость
 * - Управляет калькулятором по запросу
 * - Помнит историю расчётов
 */

window.AI_MATERIAL_DENSITY = {
    
    // =====================================================
    // ЧАСТЬ 1: ПЛОТНОСТЬ ВСЕХ МАТЕРИАЛОВ (г/см³)
    // =====================================================
    
    densities: {
        // Стандартные
        PLA: { density: 1.24, price: 800, color: "🟢" },
        "PLA+": { density: 1.25, price: 1000, color: "🟢" },
        "PLA Silk": { density: 1.26, price: 1200, color: "✨" },
        "PLA Matte": { density: 1.23, price: 1100, color: "🎨" },
        "PLA Wood": { density: 1.28, price: 1400, color: "🪵" },
        "PLA Marble": { density: 1.35, price: 1300, color: "🗿" },
        
        // Инженерные
        PETG: { density: 1.27, price: 1200, color: "🔵" },
        ABS: { density: 1.04, price: 1100, color: "⚫" },
        ASA: { density: 1.07, price: 1400, color: "⚫" },
        Nylon: { density: 1.14, price: 2000, color: "⚪" },
        "Nylon CF": { density: 1.18, price: 3500, color: "🖤" },
        PC: { density: 1.20, price: 2500, color: "🔵" },
        PP: { density: 0.90, price: 1800, color: "⚪" },
        HIPS: { density: 1.03, price: 1300, color: "⚪" },
        
        // Гибкие
        TPU: { density: 1.21, price: 1800, color: "🔮" },
        TPE: { density: 1.18, price: 2000, color: "🔮" },
        NinjaFlex: { density: 1.20, price: 2500, color: "🔮" },
        
        // Композиты
        "Carbon Fiber (PLA)": { density: 1.30, price: 2500, color: "🖤" },
        "Carbon Fiber (PETG)": { density: 1.32, price: 3000, color: "🖤" },
        "Carbon Fiber (Nylon)": { density: 1.35, price: 4500, color: "🖤" },
        "Glass Fiber": { density: 1.40, price: 2200, color: "⚪" },
        "Metal Fill Bronze": { density: 3.90, price: 2800, color: "🟤" },
        "Metal Fill Copper": { density: 4.20, price: 3000, color: "🟠" },
        "Metal Fill Iron": { density: 4.50, price: 2600, color: "⚫" },
        "Metal Fill Steel": { density: 5.50, price: 3200, color: "⚙️" },
        "Wood Fill": { density: 1.28, price: 1600, color: "🪵" },
        "Stone Fill": { density: 2.10, price: 1800, color: "🪨" },
        
        // Специальные
        PVA: { density: 1.19, price: 3500, color: "⚪" },
        PEEK: { density: 1.32, price: 15000, color: "🟡" },
        PEI: { density: 1.27, price: 12000, color: "🟠" },
        
        // SLA смолы (для будущего расширения)
        "SLA Standard": { density: 1.15, price: 3000, color: "🧪" },
        "SLA Tough": { density: 1.18, price: 4500, color: "🧪" },
        "SLA Flexible": { density: 1.10, price: 5000, color: "🧪" },
        "SLA Castable": { density: 1.25, price: 6000, color: "🧪" },
        "SLA Dental": { density: 1.20, price: 8000, color: "🧪" }
    },
    
    // =====================================================
    // ЧАСТЬ 2: ФОРМУЛЫ РАСЧЁТА
    // =====================================================
    
    formulas: {
        // Расчёт веса детали
        weight: {
            formula: "Вес (г) = Объём (см³) × Плотность (г/см³) × (Заполнение % / 100)",
            description: "Расчёт массы детали с учётом заполнения",
            example: "Объём: 50 см³, Плотность PLA: 1.24, Заполнение: 20%\nВес = 50 × 1.24 × 0.20 = 12.4 г"
        },
        
        // Расчёт длины филамента
        filamentLength: {
            formula: "Длина (м) = Вес (г) / (Площадь сечения (мм²) × Плотность (г/см³) × 0.1)",
            description: "Сколько метров филамента уйдёт на печать",
            example: "Вес: 12.4г, Плотность PLA: 1.24, Диаметр: 1.75мм\nПлощадь = π × (1.75/2)² = 2.4 мм²\nДлина = 12.4 / (2.4 × 1.24 × 0.1) = 4.2 м"
        },
        
        // Расчёт стоимости
        cost: {
            formula: "Стоимость (₽) = (Вес (г) / 1000) × Цена за кг (₽)",
            description: "Стоимость материала на деталь",
            example: "Вес: 12.4г, Цена PLA: 800₽/кг\nСтоимость = (12.4 / 1000) × 800 = 9.92₽"
        },
        
        // Расчёт времени печати
        printTime: {
            formula: "Время (час) = (Длина пути (мм) / Скорость (мм/с)) / 3600",
            description: "Приблизительное время печати",
            note: "Точный расчёт делает слайсер. Это оценка."
        },
        
        // Расчёт объёма катушки
        spoolUsage: {
            formula: "Остаток (%) = (Текущий вес (г) / Начальный вес (г)) × 100",
            description: "Сколько осталось на катушке"
        }
    },
    
    // =====================================================
    // ЧАСТЬ 3: БЫСТРЫЕ РАСЧЁТЫ
    // =====================================================
    
    calculate: {
        // Вес по объёму
        weightByVolume: function(volumeCm3, material, infillPercent = 20) {
            const mat = this.densities[material];
            if (!mat) return null;
            
            const weight = volumeCm3 * mat.density * (infillPercent / 100);
            return {
                weight: weight.toFixed(2),
                unit: 'г',
                material: material,
                density: mat.density,
                infill: infillPercent
            };
        },
        
        // Длина филамента по весу
        lengthByWeight: function(weightG, material, filamentDiameter = 1.75) {
            const mat = this.densities[material];
            if (!mat) return null;
            
            const radius = filamentDiameter / 2;
            const area = Math.PI * Math.pow(radius, 2); // мм²
            const length = weightG / (area * mat.density * 0.1);
            
            return {
                length: (length / 1000).toFixed(2),
                unit: 'м',
                material: material,
                diameter: filamentDiameter
            };
        },
        
        // Стоимость по весу
        costByWeight: function(weightG, material) {
            const mat = this.densities[material];
            if (!mat) return null;
            
            const cost = (weightG / 1000) * mat.price;
            
            return {
                cost: cost.toFixed(2),
                unit: '₽',
                material: material,
                pricePerKg: mat.price
            };
        },
        
        // Полный расчёт
        full: function(volumeCm3, material, infillPercent = 20, pricePerHour = 50) {
            const mat = this.densities[material];
            if (!mat) return null;
            
            const weight = volumeCm3 * mat.density * (infillPercent / 100);
            const radius = 1.75 / 2;
            const area = Math.PI * Math.pow(radius, 2);
            const length = weight / (area * mat.density * 0.1);
            const cost = (weight / 1000) * mat.price;
            
            // Оценка времени (очень примерная: 1г ≈ 2-3 минуты)
            const timeHours = (weight * 2.5) / 60;
            const machineCost = timeHours * pricePerHour;
            const totalCost = cost + machineCost;
            
            return {
                material: material,
                density: mat.density,
                volume: volumeCm3,
                infill: infillPercent,
                weight: weight.toFixed(2) + ' г',
                filamentLength: (length / 1000).toFixed(2) + ' м',
                materialCost: cost.toFixed(2) + ' ₽',
                machineCost: machineCost.toFixed(2) + ' ₽',
                totalCost: totalCost.toFixed(2) + ' ₽',
                printTime: timeHours.toFixed(2) + ' ч'
            };
        }
    },
    
    // =====================================================
    // ЧАСТЬ 4: УПРАВЛЕНИЕ КАЛЬКУЛЯТОРОМ
    // =====================================================
    
    calculatorControl: {
        // Применение материала в калькуляторе
        setMaterial: function(material) {
            const mat = this.densities[material];
            if (!mat) return false;
            
            // Находим поле материала в калькуляторе
            const materialSelect = document.querySelector('select[id*="material"], select[name*="material"]');
            if (materialSelect) {
                // Ищем опцию с таким названием
                for (const option of materialSelect.options) {
                    if (option.text.toLowerCase().includes(material.toLowerCase())) {
                        materialSelect.value = option.value;
                        materialSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
            }
            return false;
        },
        
        // Применение плотности
        setDensity: function(density) {
            const densityInput = document.querySelector('input[id*="density"], input[name*="density"]');
            if (densityInput) {
                densityInput.value = density;
                densityInput.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
            return false;
        },
        
        // Применение заполнения
        setInfill: function(percent) {
            const infillInput = document.querySelector('input[id*="infill"], input[name*="infill"], input[id*="fill"]');
            if (infillInput) {
                infillInput.value = percent;
                infillInput.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
            return false;
        },
        
        // Применение слоя
        setLayerHeight: function(height) {
            const layerInput = document.querySelector('input[id*="layer"], input[name*="layer"]');
            if (layerInput) {
                layerInput.value = height;
                layerInput.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
            return false;
        },
        
        // Пресеты настроек
        presets: {
            fast: {
                name: "Быстрая печать",
                settings: { layerHeight: 0.3, infill: 15, speed: 60 },
                description: "⚡ Слой 0.3мм, заполнение 15%, скорость 60мм/с"
            },
            quality: {
                name: "Высокое качество",
                settings: { layerHeight: 0.1, infill: 40, speed: 30 },
                description: "🎯 Слой 0.1мм, заполнение 40%, скорость 30мм/с"
            },
            economy: {
                name: "Экономия материала",
                settings: { layerHeight: 0.3, infill: 10, speed: 50 },
                description: "💰 Слой 0.3мм, заполнение 10%, минимум пластика"
            },
            strong: {
                name: "Прочная деталь",
                settings: { layerHeight: 0.15, infill: 60, speed: 40 },
                description: "💪 Слой 0.15мм, заполнение 60%, максимальная прочность"
            },
            standard: {
                name: "Стандарт",
                settings: { layerHeight: 0.2, infill: 20, speed: 50 },
                description: "✅ Слой 0.2мм, заполнение 20%, баланс"
            }
        }
    },
    
    // =====================================================
    // ЧАСТЬ 5: ПАМЯТЬ РАСЧЁТОВ (ИСТОРИЯ)
    // =====================================================
    
    history: {
        calculations: [],
        maxHistory: 100,
        
        add: function(data) {
            this.calculations.unshift({
                ...data,
                timestamp: new Date().toISOString()
            });
            
            // Ограничиваем историю
            if (this.calculations.length > this.maxHistory) {
                this.calculations.pop();
            }
            
            // Сохраняем в localStorage
            localStorage.setItem('monolith_calc_history', JSON.stringify(this.calculations));
        },
        
        load: function() {
            const saved = localStorage.getItem('monolith_calc_history');
            if (saved) {
                try {
                    this.calculations = JSON.parse(saved);
                } catch (e) {
                    this.calculations = [];
                }
            }
        },
        
        get: function(limit = 10) {
            return this.calculations.slice(0, limit);
        },
        
        clear: function() {
            this.calculations = [];
            localStorage.removeItem('monolith_calc_history');
        },
        
        stats: function() {
            if (this.calculations.length === 0) return null;
            
            const totalWeight = this.calculations.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
            const totalCost = this.calculations.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
            const avgCost = totalCost / this.calculations.length;
            
            // Популярные материалы
            const materialCount = {};
            this.calculations.forEach(c => {
                materialCount[c.material] = (materialCount[c.material] || 0) + 1;
            });
            const popularMaterial = Object.entries(materialCount).sort((a, b) => b[1] - a[1])[0];
            
            return {
                totalCalculations: this.calculations.length,
                totalWeight: totalWeight.toFixed(2) + ' г',
                totalCost: totalCost.toFixed(2) + ' ₽',
                averageCost: avgCost.toFixed(2) + ' ₽',
                popularMaterial: popularMaterial ? popularMaterial[0] : 'N/A'
            };
        }
    },
    
    // =====================================================
    // ЧАСТЬ 6: БЫСТРЫЕ ОТВЕТЫ
    // =====================================================
    
    quickAnswers: {
        "плотность": "📊 **Плотность материалов (г/см³):**\n\n• PLA: 1.24 (лёгкий)\n• PETG: 1.27 (средний)\n• ABS: 1.04 (лёгкий)\n• Nylon: 1.14 (средний)\n• TPU: 1.21 (средний)\n• PP: 0.90 (самый лёгкий)\n• PC: 1.20 (средний)\n• Metal Fill: 3.9-5.5 (тяжёлый)",
        
        "цена материал": "💰 **Цены материалов (₽/кг):**\n\n• PLA: 800-1200 (дешёвый)\n• PETG: 1200-1500 (средний)\n• ABS: 1100-1400 (средний)\n• Nylon: 2000-3500 (дорогой)\n• TPU: 1800-2500 (дорогой)\n• PEEK: 15000+ (очень дорогой)",
        
        "самый лёгкий": "🪶 **Самый лёгкий: PP (0.90 г/см³)**\n\nЗатем ABS (1.04), HIPS (1.03), Nylon (1.14).",
        
        "самый тяжёлый": "⚖️ **Самый тяжёлый: Metal Fill Steel (5.50 г/см³)**\n\nЗатем Metal Fill Iron (4.50), Copper (4.20), Bronze (3.90).",
        
        "самый дешёвый": "💵 **Самый дешёвый: PLA (800₽/кг)**\n\nЛучшее соотношение цена/качество: PETG (1200₽/кг).",
        
        "сколько весит": "⚖️ **Вес зависит от объёма и заполнения:**\n\nФормула: Вес = Объём × Плотность × Заполнение\n\nПример для PLA (20% заполнение):\n• 10 см³ = 2.48 г\n• 50 см³ = 12.4 г\n• 100 см³ = 24.8 г\n\nНазови объём — рассчитаю точно!",
        
        "рассчитать вес": "🧮 **Для расчёта нужны:**\n\n1. Объём детали (см³)\n2. Материал\n3. Заполнение (%)\n\nПример: \"Рассчитай вес для 50 см³, PLA, 20%\"",
        
        "рассчитать стоимость": "💰 **Для расчёта нужны:**\n\n1. Вес детали (г) или объём\n2. Материал\n\nПример: \"Сколько стоит деталь из PLA весом 15г?\"",
        
        "длина филамента": "📏 **Длина филамента из веса:**\n\nФормула: Длина = Вес / (Площадь × Плотность)\n\nПример для PLA 1.75мм:\n• 10г = 3.4 м\n• 50г = 17 м\n• 100г = 34 м\n• 1 кг = 340 м"
    },
    
    // =====================================================
    // ЧАСТЬ 7: УПРАВЛЕНИЕ ПО ЗАПРОСУ (ДОМОВОЙ)
    // =====================================================
    
    commands: {
        // Команды управления
        set: {
            patterns: ['установи', 'поставь', 'измени', 'поменяй', 'сделай'],
            execute: function(query) {
                const lower = query.toLowerCase();
                
                // Материал
                if (lower.includes('материал') || lower.includes('пластик')) {
                    const materials = Object.keys(window.AI_MATERIAL_DENSITY.densities);
                    for (const mat of materials) {
                        if (lower.includes(mat.toLowerCase())) {
                            return {
                                action: 'setMaterial',
                                value: mat,
                                response: `✅ Установлен материал: **${mat}**\n\nПлотность: ${this.densities[mat].density} г/см³\nЦена: ${this.densities[mat].price}₽/кг`
                            };
                        }
                    }
                }
                
                // Заполнение
                if (lower.includes('заполнен') || lower.includes('infill')) {
                    const match = query.match(/(\d+)\s*%/);
                    if (match) {
                        return {
                            action: 'setInfill',
                            value: parseInt(match[1]),
                            response: `✅ Установлено заполнение: **${match[1]}%**`
                        };
                    }
                }
                
                // Слой
                if (lower.includes('слой') || lower.includes('layer')) {
                    const match = query.match(/(\d+\.?\d*)\s*мм/);
                    if (match) {
                        return {
                            action: 'setLayerHeight',
                            value: parseFloat(match[1]),
                            response: `✅ Установлена высота слоя: **${match[1]} мм**`
                        };
                    }
                }
                
                return null;
            }
        },
        
        // Команды расчёта
        calculate: {
            patterns: ['рассчитай', 'посчитай', 'вычисли', 'сколько', 'какой вес', 'какая стоимость'],
            execute: function(query) {
                const lower = query.toLowerCase();
                
                // Извлекаем числа из запроса
                const numbers = query.match(/(\d+\.?\d*)/g);
                if (!numbers) return null;
                
                // Ищем материал
                const materials = Object.keys(window.AI_MATERIAL_DENSITY.densities);
                let material = null;
                for (const mat of materials) {
                    if (lower.includes(mat.toLowerCase())) {
                        material = mat;
                        break;
                    }
                }
                
                if (!material) return null;
                
                // Расчёт веса по объёму
                if (lower.includes('вес') && lower.includes('объём')) {
                    const volume = parseFloat(numbers[0]);
                    const infill = numbers[1] ? parseFloat(numbers[1]) : 20;
                    
                    const result = window.AI_MATERIAL_DENSITY.calculate.full(volume, material, infill);
                    
                    return {
                        action: 'calculate',
                        type: 'weight',
                        response: `🧮 **Расчёт для ${material}:**\n\n` +
                                  `Объём: ${volume} см³\n` +
                                  `Заполнение: ${infill}%\n\n` +
                                  `⚖️ Вес: ${result.weight}\n` +
                                  `📏 Длина филамента: ${result.filamentLength}\n` +
                                  `💰 Материал: ${result.materialCost}\n` +
                                  `⏱️ Время: ${result.printTime}\n` +
                                  `💵 Итого: ${result.totalCost}`
                    };
                }
                
                // Расчёт стоимости по весу
                if (lower.includes('стоим') && lower.includes('вес')) {
                    const weight = parseFloat(numbers[0]);
                    const result = window.AI_MATERIAL_DENSITY.calculate.costByWeight(weight, material);
                    
                    return {
                        action: 'calculate',
                        type: 'cost',
                        response: `💰 **Стоимость для ${material}:**\n\n` +
                                  `Вес: ${weight} г\n` +
                                  `Материал: ${result.cost} ₽\n` +
                                  `Цена за кг: ${result.pricePerKg} ₽`
                    };
                }
                
                return null;
            }
        },
        
        // Пресеты
        preset: {
            patterns: ['пресет', 'быстрая', 'качество', 'эконом', 'прочн', 'стандарт'],
            execute: function(query) {
                const lower = query.toLowerCase();
                const presets = window.AI_MATERIAL_DENSITY.calculatorControl.presets;
                
                if (lower.includes('быстр') || lower.includes('fast')) {
                    return {
                        action: 'applyPreset',
                        value: 'fast',
                        response: `⚡ Применён пресет "Быстрая печать"\n\n` +
                                  `• Слой: ${presets.fast.settings.layerHeight} мм\n` +
                                  `• Заполнение: ${presets.fast.settings.infill}%\n` +
                                  `• Скорость: ${presets.fast.settings.speed} мм/с`
                    };
                }
                
                if (lower.includes('качеств') || lower.includes('quality')) {
                    return {
                        action: 'applyPreset',
                        value: 'quality',
                        response: `🎯 Применён пресет "Высокое качество"\n\n` +
                                  `• Слой: ${presets.quality.settings.layerHeight} мм\n` +
                                  `• Заполнение: ${presets.quality.settings.infill}%\n` +
                                  `• Скорость: ${presets.quality.settings.speed} мм/с`
                    };
                }
                
                if (lower.includes('эконом') || lower.includes('economy')) {
                    return {
                        action: 'applyPreset',
                        value: 'economy',
                        response: `💰 Применён пресет "Экономия"\n\n` +
                                  `• Слой: ${presets.economy.settings.layerHeight} мм\n` +
                                  `• Заполнение: ${presets.economy.settings.infill}%\n` +
                                  `• Минимум пластика`
                    };
                }
                
                if (lower.includes('прочн') || lower.includes('strong')) {
                    return {
                        action: 'applyPreset',
                        value: 'strong',
                        response: `💪 Применён пресет "Прочная деталь"\n\n` +
                                  `• Слой: ${presets.strong.settings.layerHeight} мм\n` +
                                  `• Заполнение: ${presets.strong.settings.infill}%\n` +
                                  `• Максимальная прочность`
                    };
                }
                
                return null;
            }
        }
    },
    
    // =====================================================
    // ФУНКЦИЯ ПОИСКА
    // =====================================================
    
    search: function(query) {
        const lower = query.toLowerCase();
        
        // 1. Быстрые ответы
        for (const [key, answer] of Object.entries(this.quickAnswers)) {
            if (lower.includes(key)) {
                return answer;
            }
        }
        
        // 2. Поиск плотности конкретного материала
        for (const [name, data] of Object.entries(this.densities)) {
            if (lower.includes(name.toLowerCase())) {
                return `📦 **${name}**\n\n` +
                       `⚖️ Плотность: ${data.density} г/см³\n` +
                       `💰 Цена: ${data.price} ₽/кг\n` +
                       `Цвет: ${data.color}`;
            }
        }
        
        // 3. Обработка команд
        for (const [type, command] of Object.entries(this.commands)) {
            for (const pattern of command.patterns) {
                if (lower.includes(pattern)) {
                    const result = command.execute(query);
                    if (result) {
                        // Сохраняем в историю если это расчёт
                        if (result.action === 'calculate') {
                            this.history.add({
                                type: result.type,
                                query: query,
                                ...result
                            });
                        }
                        return result.response;
                    }
                }
            }
        }
        
        // 4. Таблица всех плотностей
        if (lower.includes('таблиц') || lower.includes('все плотност')) {
            let response = "📊 **ПЛОТНОСТЬ ВСЕХ МАТЕРИАЛОВ (г/см³)**\n\n";
            response += "**Стандартные:**\n";
            response += "• PLA: 1.24 | PLA+: 1.25 | PLA Silk: 1.26\n\n";
            response += "**Инженерные:**\n";
            response += "• PETG: 1.27 | ABS: 1.04 | ASA: 1.07\n";
            response += "• Nylon: 1.14 | PC: 1.20 | PP: 0.90\n\n";
            response += "**Гибкие:**\n";
            response += "• TPU: 1.21 | TPE: 1.18 | NinjaFlex: 1.20\n\n";
            response += "**Композиты:**\n";
            response += "• Carbon: 1.30-1.35 | Glass: 1.40\n";
            response += "• Metal Fill: 3.9-5.5\n\n";
            response += "**Специальные:**\n";
            response += "• PVA: 1.19 | PEEK: 1.32 | PEI: 1.27";
            return response;
        }
        
        // 5. Формулы
        if (lower.includes('формул') || lower.includes('как считает')) {
            let response = "🧮 **ФОРМУЛЫ РАСЧЁТА**\n\n";
            for (const [name, data] of Object.entries(this.formulas)) {
                response += `**${data.formula}**\n`;
                response += `${data.description}\n\n`;
            }
            return response;
        }
        
        // 6. История расчётов
        if (lower.includes('история') || lower.includes('прошл') || lower.includes('расчёт')) {
            const stats = this.history.stats();
            if (stats) {
                return `📊 **СТАТИСТИКА РАСЧЁТОВ**\n\n` +
                       `Всего расчётов: ${stats.totalCalculations}\n` +
                       `Общий вес: ${stats.totalWeight}\n` +
                       `Общая стоимость: ${stats.totalCost}\n` +
                       `Средняя стоимость: ${stats.averageCost}\n` +
                       `Популярный материал: ${stats.popularMaterial}`;
            }
            return "📊 История расчётов пуста.";
        }
        
        return null;
    }
};

// Инициализация
window.AI_MATERIAL_DENSITY.history.load();

// Подключение к общей базе
if (window.AI_KNOWLEDGE) {
    window.AI_KNOWLEDGE.materialDensity = window.AI_MATERIAL_DENSITY;
    
    const originalSearch = window.AI_KNOWLEDGE.search;
    window.AI_KNOWLEDGE.search = function(query) {
        if (window.AI_MATERIAL_DENSITY) {
            const densityResult = window.AI_MATERIAL_DENSITY.search(query);
            if (densityResult) {
                return {
                    type: 'material-density',
                    response: densityResult,
                    category: 'Расчёты и плотности'
                };
            }
        }
        return originalSearch.call(this, query);
    };
}

console.log('✅ Модуль "Плотность и Расчёты" загружен');
console.log('📚 Охвачено материалов: 35+');
console.log('   - Плотности всех FDM материалов');
console.log('   - Цены (средние по рынку)');
console.log('   - Формулы расчёта веса, длины, стоимости');
console.log('   - Управление калькулятором');
console.log('   - История расчётов');
console.log('   - Пресеты настроек');
