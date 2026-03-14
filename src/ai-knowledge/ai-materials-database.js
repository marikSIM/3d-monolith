/**
 * 3D MONOLITH AI - ПОЛНАЯ БАЗА МАТЕРИАЛОВ
 * Файл: ai-materials-database.js
 * Описание: Все существующие материалы для 3D-печати (FDM + SLA)
 */

window.AI_MATERIALS_DATABASE = {
    
    // === FDM МАТЕРИАЛЫ (Термопласты) ===
    fdm: {
        pla: {
            name: "PLA (Полилактид)",
            type: "FDM",
            category: "Стандартные",
            description: "Биоразлагаемый пластик из кукурузы или сахарного тростника. Самый популярный материал для начинающих.",
            
            temperatures: {
                nozzle: "190-220°C",
                nozzle_min: 190,
                nozzle_max: 220,
                bed: "50-60°C",
                bed_min: 50,
                bed_max: 60,
                chamber: "не требуется"
            },
            
            properties: {
                strength: 6,
                flexibility: 3,
                durability: 5,
                heatResistance: 3,
                easeOfPrinting: 9,
                detailQuality: 7
            },
            
            pros: [
                "Легко печатать",
                "Минимальная усадка",
                "Безопасен (нетоксичен)",
                "Биоразлагаемый",
                "Не требует закрытой камеры",
                "Дешёвый",
                "Большой выбор цветов"
            ],
            
            cons: [
                "Хрупкий",
                "Боится температур >55°C",
                "Не для функциональных деталей",
                "Разлагается от влаги"
            ],
            
            applications: [
                "Макеты и прототипы",
                "Декоративные изделия",
                "Игрушки и фигурки",
                "Обучающие модели",
                "Косплей и реквизит",
                "Предметы интерьера"
            ],
            
            storage: "Хранить в сухом месте, в герметичном пакете с силикагелем. Срок годности: 1-2 года.",
            drying: "Обычно не требует. При увлажнении: 45°C, 4-6 часов.",
            
            safety: "✅ Безопасен. Нетоксичен при печати. Можно печатать в жилых помещениях.",
            
            recommendations: {
                beginner: true,
                functional: false,
                outdoor: false,
                heatResistant: false,
                flexible: false,
                detailed: true
            }
        },
        
        abs: {
            name: "ABS (Акрилонитрилбутадиенстирол)",
            type: "FDM",
            category: "Инженерные",
            description: "Прочный ударопрочный пластик. Используется в автомобильной и электронной промышленности.",
            
            temperatures: {
                nozzle: "230-250°C",
                nozzle_min: 230,
                nozzle_max: 250,
                bed: "90-110°C",
                bed_min: 90,
                bed_max: 110,
                chamber: "40-50°C (обязательно)"
            },
            
            properties: {
                strength: 8,
                flexibility: 5,
                durability: 8,
                heatResistance: 7,
                easeOfPrinting: 5,
                detailQuality: 6
            },
            
            pros: [
                "Высокая прочность",
                "Ударопрочный",
                "Термостойкий (до 100°C)",
                "Можно шлифовать и склеивать",
                "Обрабатывается ацетоном",
                "Долговечный"
            ],
            
            cons: [
                "Сильная усадка",
                "Требует закрытой камеры",
                "Токсичные испарения (стирол)",
                "Сложно печатать"
            ],
            
            applications: [
                "Функциональные детали",
                "Корпуса электроники",
                "Автомобильные запчасти",
                "Инструменты",
                "Прототипы",
                "Лего-совместимые детали"
            ],
            
            storage: "Герметично, в сухом месте. Избегать влаги. Срок: 2-3 года.",
            drying: "70°C, 4-6 часов перед печатью.",
            
            safety: "⚠️ Печатать только в проветриваемом помещении! Выделяет стирол. Требуется закрытая камера с фильтрацией.",
            
            recommendations: {
                beginner: false,
                functional: true,
                outdoor: true,
                heatResistant: true,
                flexible: false,
                detailed: false
            }
        },
        
        petg: {
            name: "PETG (Полиэтилентерефталат-гликоль)",
            type: "FDM",
            category: "Стандартные",
            description: "Золотая середина между PLA и ABS. Прочный, химически стойкий, легко печатается.",
            
            temperatures: {
                nozzle: "220-245°C",
                nozzle_min: 220,
                nozzle_max: 245,
                bed: "70-80°C",
                bed_min: 70,
                bed_max: 80,
                chamber: "не требуется"
            },
            
            properties: {
                strength: 8,
                flexibility: 6,
                durability: 8,
                heatResistance: 6,
                easeOfPrinting: 8,
                detailQuality: 6
            },
            
            pros: [
                "Прочнее PLA",
                "Гибче ABS",
                "Химически стойкий",
                "Водоустойчивый",
                "Легче печатать чем ABS",
                "Минимальная усадка"
            ],
            
            cons: [
                "Склонен к стрингингу",
                "Царапает сопло",
                "Сложнее снять поддержки",
                "Гигроскопичен"
            ],
            
            applications: [
                "Водоустойчивые детали",
                "Механизмы и шарниры",
                "Ёмкости для жидкостей",
                "Прототипы",
                "Функциональные детали",
                "Уличные изделия"
            ],
            
            storage: "Герметично, избегать влаги. Срок: 2-3 года.",
            drying: "50°C, 4-6 часов.",
            
            safety: "✅ Безопасен. Минимальные испарения. Можно печатать в жилых помещениях.",
            
            recommendations: {
                beginner: true,
                functional: true,
                outdoor: true,
                heatResistant: false,
                flexible: false,
                detailed: false
            }
        },
        
        tpu: {
            name: "TPU (Термопластичный полиуретан)",
            type: "FDM",
            category: "Гибкие",
            description: "Эластичный резиноподобный материал. Износостойкий и виброгасящий.",
            
            temperatures: {
                nozzle: "210-230°C",
                nozzle_min: 210,
                nozzle_max: 230,
                bed: "50-60°C",
                bed_min: 50,
                bed_max: 60,
                chamber: "не требуется"
            },
            
            properties: {
                strength: 7,
                flexibility: 10,
                durability: 9,
                heatResistance: 5,
                easeOfPrinting: 4,
                detailQuality: 5
            },
            
            pros: [
                "Эластичный",
                "Износостойкий",
                "Виброгасящий",
                "Химически стойкий",
                "УФ-стойкий"
            ],
            
            cons: [
                "Требует Direct-экструдер",
                "Сложно печатать на высоких скоростях",
                "Влагопоглощающий",
                "Дорогой"
            ],
            
            applications: [
                "Чехлы и накладки",
                "Уплотнители и прокладки",
                "Амортизаторы",
                "Гибкие шарниры",
                "Колёса и ролики",
                "Протекторы"
            ],
            
            storage: "Герметично, с силикагелем. Срок: 1-2 года.",
            drying: "55°C, 6-8 часов.",
            
            safety: "✅ Безопасен. Нетоксичен.",
            
            recommendations: {
                beginner: false,
                functional: true,
                outdoor: true,
                heatResistant: false,
                flexible: true,
                detailed: false
            }
        },
        
        nylon: {
            name: "Nylon (Полиамид, PA)",
            type: "FDM",
            category: "Инженерные",
            description: "Сверхпрочный износостойкий материал. Используется для функциональных деталей.",
            
            temperatures: {
                nozzle: "240-270°C",
                nozzle_min: 240,
                nozzle_max: 270,
                bed: "70-90°C",
                bed_min: 70,
                bed_max: 90,
                chamber: "40-50°C"
            },
            
            properties: {
                strength: 10,
                flexibility: 7,
                durability: 10,
                heatResistance: 7,
                easeOfPrinting: 3,
                detailQuality: 5
            },
            
            pros: [
                "Сверхпрочный",
                "Износостойкий",
                "Низкий коэффициент трения",
                "Гибкий",
                "Химически стойкий"
            ],
            
            cons: [
                "Крайне гигроскопичен",
                "Требует высоких температур",
                "Сложная печать",
                "Сильная усадка"
            ],
            
            applications: [
                "Шестерни и подшипники",
                "Функциональные запчасти",
                "Инструменты",
                "Прототипы",
                "Износостойкие детали",
                "Втулки"
            ],
            
            storage: "Только в герметичной таре с осушителем! Срок: 1-2 года.",
            drying: "70°C, 10-12 часов. Обязательно перед каждой печатью!",
            
            safety: "✅ Безопасен при правильной температуре. Требует вентиляции.",
            
            recommendations: {
                beginner: false,
                functional: true,
                outdoor: true,
                heatResistant: true,
                flexible: false,
                detailed: false
            }
        },
        
        pc: {
            name: "PC (Поликарбонат)",
            type: "FDM",
            category: "Инженерные",
            description: "Один из самых прочных термопластов. Прозрачный, термостойкий.",
            
            temperatures: {
                nozzle: "260-300°C",
                nozzle_min: 260,
                nozzle_max: 300,
                bed: "90-110°C",
                bed_min: 90,
                bed_max: 110,
                chamber: "50-70°C"
            },
            
            properties: {
                strength: 10,
                flexibility: 4,
                durability: 9,
                heatResistance: 9,
                easeOfPrinting: 2,
                detailQuality: 5
            },
            
            pros: [
                "Экстремальная прочность",
                "Термостойкий (до 145°C)",
                "Прозрачный",
                "Ударопрочный"
            ],
            
            cons: [
                "Очень сложно печатать",
                "Требует высоких температур",
                "Сильная усадка",
                "Гигроскопичен"
            ],
            
            applications: [
                "Бронированные элементы",
                "Термостойкие детали",
                "Прозрачные изделия",
                "Защитные экраны",
                "Высоконагруженные детали"
            ],
            
            storage: "Герметично, с осушителем. Срок: 2-3 года.",
            drying: "80°C, 6-8 часов.",
            
            safety: "⚠️ Требует вентиляции. Высокие температуры печати.",
            
            recommendations: {
                beginner: false,
                functional: true,
                outdoor: true,
                heatResistant: true,
                flexible: false,
                detailed: false
            }
        },
        
        peek: {
            name: "PEEK (Полиэфирэфиркетон)",
            type: "FDM",
            category: "Высокотемпературные",
            description: "Экстремально прочный высокотемпературный материал. Аэрокосмический уровень.",
            
            temperatures: {
                nozzle: "360-400°C",
                nozzle_min: 360,
                nozzle_max: 400,
                bed: "120-150°C",
                bed_min: 120,
                bed_max: 150,
                chamber: "70-90°C"
            },
            
            properties: {
                strength: 10,
                flexibility: 3,
                durability: 10,
                heatResistance: 10,
                easeOfPrinting: 1,
                detailQuality: 4
            },
            
            pros: [
                "Экстремальная термостойкость (до 250°C)",
                "Химически инертный",
                "Биосовместимый",
                "Высокая прочность"
            ],
            
            cons: [
                "Очень дорогой",
                "Требует спец. принтер",
                "Очень сложно печатать",
                "Высокие температуры"
            ],
            
            applications: [
                "Аэрокосмические компоненты",
                "Медицинские импланты",
                "Химическая промышленность",
                "Высокотемпературные детали"
            ],
            
            storage: "Герметично, с осушителем. Срок: 3-5 лет.",
            drying: "120°C, 6 часов.",
            
            safety: "⚠️ Требует промышленной вентиляции. Очень высокие температуры.",
            
            recommendations: {
                beginner: false,
                functional: true,
                outdoor: true,
                heatResistant: true,
                flexible: false,
                detailed: false
            }
        }
    },
    
    // === SLA МАТЕРИАЛЫ (Фотополимеры) ===
    sla: {
        standard: {
            name: "Стандартная смола (Standard Resin)",
            type: "SLA",
            category: "Стандартные",
            description: "Универсальная фотополимерная смола для высокоточной печати.",
            
            properties: {
                strength: 6,
                flexibility: 3,
                durability: 5,
                heatResistance: 4,
                detailQuality: 10,
                surfaceFinish: 10
            },
            
            pros: [
                "Высочайшая детализация",
                "Гладкая поверхность",
                "Минимальные слои",
                "Идеально для миниатюр"
            ],
            
            cons: [
                "Хрупкая",
                "Токсична до отверждения",
                "Требует постобработки",
                "Дорогая"
            ],
            
            applications: [
                "Миниатюры и фигурки",
                "Ювелирные модели",
                "Стоматологические модели",
                "Высокоточные прототипы",
                "Художественные изделия"
            ],
            
            curing: "УФ-отверждение: 365-405 нм, 5-10 минут",
            washing: "Изопропиловый спирт (IPA), 5-10 минут",
            
            safety: "⚠️ ТОКСИЧНА ДО ОТВЕРЖДЕНИЯ!\n• Нитриловые перчатки (обязательно!)\n• Защитные очки\n• Принудительная вентиляция\n• Избегать контакта с кожей"
        },
        
        tough: {
            name: "Прочная смола (Tough Resin)",
            type: "SLA",
            category: "Инженерные",
            description: "Ударопрочная смола для функциональных деталей.",
            
            properties: {
                strength: 8,
                flexibility: 5,
                durability: 8,
                heatResistance: 5,
                detailQuality: 9,
                surfaceFinish: 9
            },
            
            pros: [
                "Высокая ударопрочность",
                "Меньше хрупкая чем стандартная",
                "Высокая детализация",
                "Функциональные детали"
            ],
            
            cons: [
                "Дороже стандартной",
                "Требует постобработки",
                "Токсична"
            ],
            
            applications: [
                "Функциональные прототипы",
                "Шарниры и защёлки",
                "Инструменты",
                "Корпуса"
            ],
            
            curing: "УФ-отверждение: 365-405 нм, 10-15 минут",
            washing: "Изопропиловый спирт (IPA), 5-10 минут",
            
            safety: "⚠️ ТОКСИЧНА ДО ОТВЕРЖДЕНИЯ!\n• Нитриловые перчатки\n• Защитные очки\n• Вентиляция"
        },
        
        flexible: {
            name: "Гибкая смола (Flexible Resin)",
            type: "SLA",
            category: "Гибкие",
            description: "Эластичная фотополимерная смола.",
            
            properties: {
                strength: 6,
                flexibility: 9,
                durability: 7,
                heatResistance: 4,
                detailQuality: 8,
                surfaceFinish: 8
            },
            
            pros: [
                "Эластичная",
                "Высокая детализация",
                "Износостойкая"
            ],
            
            cons: [
                "Сложная постобработка",
                "Дорогая",
                "Меньше деталей"
            ],
            
            applications: [
                "Прокладки",
                "Уплотнители",
                "Гибкие шарниры",
                "Протезы",
                "Мягкие накладки"
            ],
            
            curing: "УФ-отверждение: 365-405 нм, 15-20 минут",
            washing: "Изопропиловый спирт (IPA), 10 минут",
            
            safety: "⚠️ ТОКСИЧНА ДО ОТВЕРЖДЕНИЯ!\n• Перчатки обязательно\n• Вентиляция"
        },
        
        castable: {
            name: "Литьевая смола (Castable Resin)",
            type: "SLA",
            category: "Специальные",
            description: "Смола для ювелирного литья. Выгорает без золы.",
            
            properties: {
                strength: 5,
                flexibility: 3,
                durability: 4,
                heatResistance: 3,
                detailQuality: 10,
                surfaceFinish: 10
            },
            
            pros: [
                "Идеальна для литья",
                "Выгорает без остатка",
                "Высочайшая детализация",
                "Гладкая поверхность"
            ],
            
            cons: [
                "Очень дорогая",
                "Только для литья",
                "Хрупкая"
            ],
            
            applications: [
                "Ювелирные изделия",
                "Зубные протезы",
                "Литьё по выплавляемым моделям",
                "Мастер-модели"
            ],
            
            curing: "УФ-отверждение: 365-405 нм, 5-10 минут",
            washing: "Изопропиловый спирт (IPA), 5 минут",
            
            safety: "⚠️ ТОКСИЧНА ДО ОТВЕРЖДЕНИЯ!\n• Перчатки\n• Очки\n• Вентиляция"
        },
        
        waterWashable: {
            name: "Смываемая водой смола (Water Washable)",
            type: "SLA",
            category: "Стандартные",
            description: "Смола которую можно мыть водой вместо спирта.",
            
            properties: {
                strength: 6,
                flexibility: 3,
                durability: 5,
                heatResistance: 4,
                detailQuality: 9,
                surfaceFinish: 9
            },
            
            pros: [
                "Можно мыть водой",
                "Не нужен IPA",
                "Дешевле в эксплуатации",
                "Высокая детализация"
            ],
            
            cons: [
                "Менее прочная",
                "Дольше сохнет",
                "Токсична"
            ],
            
            applications: [
                "Миниатюры",
                "Прототипы",
                "Модели",
                "Фигурки"
            ],
            
            curing: "УФ-отверждение: 365-405 нм, 5-10 минут",
            washing: "Вода, 10-15 минут, затем IPA для финиша",
            
            safety: "⚠️ ТОКСИЧНА ДО ОТВЕРЖДЕНИЯ!\n• Перчатки\n• Очки\n• Вентиляция"
        },
        
        highTemp: {
            name: "Термостойкая смола (High Temp Resin)",
            type: "SLA",
            category: "Инженерные",
            description: "Смола выдерживающая высокие температуры.",
            
            properties: {
                strength: 7,
                flexibility: 3,
                durability: 8,
                heatResistance: 9,
                detailQuality: 8,
                surfaceFinish: 8
            },
            
            pros: [
                "Термостойкость до 238°C",
                "Высокая прочность",
                "Химически стойкая"
            ],
            
            cons: [
                "Очень дорогая",
                "Сложная печать",
                "Токсична"
            ],
            
            applications: [
                "Термостойкие вставки",
                "Формы для литья",
                "Горячие воздуховоды",
                "Высокотемпературные прототипы"
            ],
            
            curing: "УФ-отверждение: 365-405 нм, 15-20 минут",
            washing: "Изопропиловый спирт (IPA), 10 минут",
            
            safety: "⚠️ ТОКСИЧНА ДО ОТВЕРЖДЕНИЯ!\n• Перчатки\n• Очки\n• Вентиляция"
        }
    },
    
    // === ФУНКЦИЯ ПОИСКА МАТЕРИАЛА ===
    findMaterial: function(query) {
        const q = query.toLowerCase();
        
        // Поиск по всем категориям
        for (const category of ['fdm', 'sla']) {
            for (const [key, material] of Object.entries(this[category])) {
                if (q.includes(key) || 
                    q.includes(material.name.toLowerCase()) ||
                    material.applications.some(app => q.includes(app.toLowerCase())) ||
                    (material.description && q.includes(material.description.toLowerCase().split(' ')[0]))) {
                    return { category, key, material };
                }
            }
        }
        
        return null;
    },
    
    // === ФУНКЦИЯ РЕКОМЕНДАЦИИ ===
    recommendMaterial: function(requirements) {
        const req = requirements.toLowerCase();
        const recommendations = [];
        
        // FDM рекомендации
        if (req.includes('начинающ') || req.includes('прост')) {
            recommendations.push(this.fdm.pla);
        }
        if (req.includes('прочн') || req.includes('функциональн')) {
            recommendations.push(this.fdm.petg, this.fdm.abs);
        }
        if (req.includes('гибк') || req.includes('эластичн')) {
            recommendations.push(this.fdm.tpu);
        }
        if (req.includes('термостойк') || req.includes('жаропрочн')) {
            recommendations.push(this.fdm.pc, this.fdm.peek);
        }
        if (req.includes('улиц') || req.includes('уличн')) {
            recommendations.push(this.fdm.petg, this.fdm.abs);
        }
        if (req.includes('детал') || req.includes('миниатюр') || req.includes('высок')) {
            recommendations.push(this.sla.standard);
        }
        if (req.includes('ювелирн') || req.includes('лить')) {
            recommendations.push(this.sla.castable);
        }
        
        return recommendations;
    }
};

console.log('✅ AI_MATERIALS_DATABASE загружен');
console.log('📚 Доступные материалы:');
console.log('   FDM: PLA, ABS, PETG, TPU, Nylon, PC, PEEK');
console.log('   SLA: Standard, Tough, Flexible, Castable, WaterWashable, HighTemp');
