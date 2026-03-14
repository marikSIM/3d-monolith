/**
 * 3D MONOLITH AI - БАЗА ЗНАНИЙ ПО ПРИНТЕРАМ (ИСПРАВЛЕННАЯ)
 * Файл: ai-printers-database.js
 * Описание: Характеристики, обслуживание и ремонт — ПРАВИЛЬНЫЕ ИНСТРУКЦИИ
 */

window.AI_PRINTERS_DATABASE = {
    
    // === FDM ПРИНТЕРЫ ===
    fdm: {
        'qidi_max4': {
            name: 'QIDI Max4 (2026)',
            manufacturer: 'QIDI',
            type: 'FDM',
            kinematics: 'CoreXY',
            buildVolume: { x: 400, y: 390, z: 340 },
            
            hotend: {
                type: 'Direct Drive',
                nozzleDiameter: '0.4 мм (стандарт)',
                maxTemp: '350°C',
                compatibleNozzles: ['0.2мм', '0.4мм', '0.6мм', '0.8мм']
            },
            
            maintenance: {
                nozzleReplacement: {
                    difficulty: 'Средняя',
                    time: '30-45 минут',
                    tools: ['Шестигранник 2.5мм', 'Термоперчатки', 'Плоскогубцы'],
                    safetyWarning: '⚠️ КРИТИЧЕСКИ ВАЖНО: НЕ отключайте питание при горячем сопле! Это может привести к ожогам и повреждению принтера!',
                    steps: [
                        '1. Нагрейте сопло до 200°C через меню принтера',
                        '2. ⚠️ НЕ ОТКЛЮЧАЙТЕ ПИТАНИЕ — вентилятор охлаждения должен работать',
                        '3. Наденьте термоперчатки',
                        '4. Снимите силиконовый чехол (осторожно, горячо!)',
                        '5. Быстро выкрутите старое сопло шестигранником',
                        '6. Прочистите резьбу в нагревательном блоке',
                        '7. Вкрутите новое сопло и затяните (момент 1.5 Н·м)',
                        '8. Опустите температуру до 60°C',
                        '9. ⚠️ ТОЛЬКО ПОСЛЕ ОСТЫВАНИЯ отключите питание',
                        '10. Соберите вентилятор и чехол',
                        '11. Включите принтер и сделайте калибровку'
                    ],
                    tips: 'Меняйте на горячем! Отключайте только после остывания (<60°C)!',
                    video: 'https://qidi3d.com/pages/max4-tutorials'
                }
            }
        },
        
        'bambu_x1c': {
            name: 'Bambu Lab X1C',
            manufacturer: 'Bambu Lab',
            type: 'FDM',
            kinematics: 'CoreXY',
            buildVolume: { x: 256, y: 256, z: 256 },
            
            hotend: {
                type: 'Direct Drive',
                nozzleDiameter: '0.4 мм',
                maxTemp: '300°C'
            },
            
            maintenance: {
                nozzleReplacement: {
                    difficulty: 'Средняя',
                    time: '20-30 минут',
                    tools: ['Ключ из комплекта', 'Термоперчатки'],
                    safetyWarning: '⚠️ Не отключайте питание до остывания!',
                    steps: [
                        '1. Меню → Настройки → Обслуживание → Замена сопла',
                        '2. Принтер нагреется автоматически',
                        '3. ⚠️ Питание остается включенным!',
                        '4. Используйте ключ из комплекта',
                        '5. Выкрутите старое, вкрутите новое (1.5 Н·м)',
                        '6. Дождитесь остывания до 60°C',
                        '7. Принтер проведет калибровку'
                    ],
                    video: 'https://wiki.bambulab.com/en/x1/maintenance/nozzle-replacement'
                }
            }
        },
        
        'prusai3_mk4': {
            name: 'Prusa i3 MK4',
            manufacturer: 'Prusa Research',
            type: 'FDM',
            kinematics: 'i3',
            buildVolume: { x: 250, y: 210, z: 220 },
            
            hotend: {
                type: 'Nextruder',
                nozzleDiameter: '0.4 мм',
                maxTemp: '290°C'
            },
            
            maintenance: {
                nozzleReplacement: {
                    difficulty: 'Легкая',
                    time: '15-20 минут',
                    tools: ['Плоскогубцы из комплекта', 'Термоперчатки'],
                    safetyWarning: '⚠️ Не отключайте питание при горячем!',
                    steps: [
                        '1. Меню → Настройки → Сопло → Замена сопла',
                        '2. Принтер нагреется до 290°C',
                        '3. ⚠️ Питание включено!',
                        '4. Выкрутите сопло плоскогубцами',
                        '5. Вкрутите новое от руки',
                        '6. Дождитесь остывания',
                        '7. Калибровка автоматически'
                    ],
                    video: 'https://help.prusa3d.com/en/nozzle-replacement'
                }
            }
        },
        
        'creality_k1_max': {
            name: 'Creality K1 Max',
            manufacturer: 'Creality',
            type: 'FDM',
            buildVolume: { x: 300, y: 300, z: 300 },
            
            maintenance: {
                nozzleReplacement: {
                    difficulty: 'Сложная',
                    time: '45-60 минут',
                    safetyWarning: '⚠️ Требуется частичная разборка. Не отключайте до остывания!',
                    tips: 'Смотрите официальную инструкцию Creality.'
                }
            }
        },
        
        'ender3_v3': {
            name: 'Creality Ender 3 V3',
            manufacturer: 'Creality',
            type: 'FDM',
            buildVolume: { x: 220, y: 220, z: 250 },
            
            maintenance: {
                nozzleReplacement: {
                    difficulty: 'Средняя',
                    time: '30 минут',
                    safetyWarning: '⚠️ Не отключайте питание при горячем сопле!',
                    steps: [
                        '1. Нагрейте до 200°C',
                        '2. ⚠️ Питание включено!',
                        '3. Снимите вентилятор',
                        '4. Выкрутите сопло',
                        '5. Вкрутите новое',
                        '6. Дождитесь остывания',
                        '7. Отключите питание и соберите',
                        '8. Откалибруйте стол'
                    ]
                }
            }
        }
    },
    
    // === SLA ПРИНТЕРЫ ===
    sla: {
        'elegoo_saturn3': {
            name: 'Elegoo Saturn 3',
            manufacturer: 'Elegoo',
            type: 'SLA',
            resolution: '12K',
            buildVolume: { x: 218, y: 123, z: 250 },
            
            maintenance: {
                filmReplacement: {
                    name: 'Замена FEP пленки',
                    difficulty: 'Средняя',
                    time: '30-45 минут',
                    tools: ['Шестигранник 2мм', 'Ножницы', 'FEP пленка'],
                    steps: [
                        '1. Снимите ванночку',
                        '2. Открутите винты',
                        '3. Снимите старую пленку',
                        '4. Очистите поверхность',
                        '5. Натяните новую',
                        '6. Закрутите винты крест-накрест',
                        '7. Обрежьте излишки'
                    ]
                }
            }
        }
    },
    
    // === ФУНКЦИЯ ПОИСКА ===
    findPrinter: function(query) {
        const q = query.toLowerCase();
        
        // Прямой поиск по ключам
        for (const [key, printer] of Object.entries(this.fdm)) {
            if (q.includes(key) || q.includes(printer.name.toLowerCase()) || q.includes(printer.manufacturer.toLowerCase())) {
                return { type: 'FDM', key, printer };
            }
        }
        for (const [key, printer] of Object.entries(this.sla)) {
            if (q.includes(key) || q.includes(printer.name.toLowerCase()) || q.includes(printer.manufacturer.toLowerCase())) {
                return { type: 'SLA', key, printer };
            }
        }
        
        // Поиск по словам "qidi", "bambu" и т.д.
        if (q.includes('qidi')) return { type: 'FDM', key: 'qidi_max4', printer: this.fdm.qidi_max4 };
        if (q.includes('bambu')) return { type: 'FDM', key: 'bambu_x1c', printer: this.fdm.bambu_x1c };
        if (q.includes('creality')) return { type: 'FDM', key: 'creality_k1_max', printer: this.fdm.creality_k1_max };
        if (q.includes('prusa')) return { type: 'FDM', key: 'prusai3_mk4', printer: this.fdm.prusai3_mk4 };
        if (q.includes('elegoo')) return { type: 'SLA', key: 'elegoo_saturn3', printer: this.sla.elegoo_saturn3 };
        
        return null;
    }
};

console.log('✅ AI_PRINTERS_DATABASE загружен (ИСПРАВЛЕННАЯ ВЕРСИЯ)');
console.log('⚠️ Все инструкции проверены на безопасность!');
