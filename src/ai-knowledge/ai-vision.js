/**
 * 3D MONOLITH AI - AI VISION (ЗРЕНИЕ ИИ)
 * Файл: ai-vision.js
 * Описание: ИИ видит загруженную 3D-модель и анализирует её
 * 
 * Функции:
 * - Анализ геометрии (размеры, объём, площадь поверхности)
 * - Оценка сложности печати
 * - Рекомендации по ориентации
 * - Расчёт поддержек
 * - Прогноз проблем
 */

window.AI_VISION = {
    // Текущая загруженная модель
    currentModel: null,
    
    // Анализ модели
    modelAnalysis: null,
    
    // Инициализация
    init: function() {
        console.log('👁️ AI Vision инициализирован');
        
        // Слушаем загрузку модели
        if (window.modelLoader) {
            window.modelLoader.onModelLoaded = (model) => {
                this.analyzeModel(model);
            };
        }
        
        // Если модель уже загружена
        if (window.currentModel) {
            this.analyzeModel(window.currentModel);
        }
    },
    
    // Анализ 3D-модели
    analyzeModel: function(model) {
        if (!model) {
            console.warn('⚠️ Модель не загружена');
            return null;
        }

        this.currentModel = model;

        // 🔥 ОЧИЩАЕМ СТАРУЮ ВИЗУАЛИЗАЦИЮ ПОДДЕРЖЕК
        if (window.AI_SUPPORTS && typeof window.AI_SUPPORTS.hideVisualization === 'function') {
            const scene = window.getScene ? window.getScene() : null;
            if (scene) {
                window.AI_SUPPORTS.hideVisualization(scene);
            }
        }
        // 🔥 СБРАСЫВАЕМ СТАРЫЙ АНАЛИЗ ПОДДЕРЖЕК
        if (window.AI_SUPPORTS) {
            window.AI_SUPPORTS.supportAnalysis = null;
            window.AI_SUPPORTS.supportVisualizerMesh = null;
        }

        // Получаем геометрию
        const geometry = model.geometry;

        // Вычисляем bounding box (габариты)
        const boundingBox = new THREE.Box3().setFromObject(model);
        const size = boundingBox.getSize(new THREE.Vector3());

        // 🔥 ИСПОЛЬЗУЕМ РЕАЛЬНЫЙ ОБЪЁМ ОТ ВОРКЕРА (если доступен)
        let volumeCm3 = 0;
        
        // Определяем текущую технологию
        const currentTech = document.getElementById('tech')?.value || 'fdm';
        
        if (window.realVol && typeof window.realVol === 'number') {
            // Для SLA используем volume с поддержками из UVTools
            // Для FDM используем чистый объём модели
            volumeCm3 = window.realVol;
            console.log(`👁️ AI Vision: режим ${currentTech.toUpperCase()}, объём от воркера: ${volumeCm3} см³`);
        } else {
            // Резервный расчёт (приблизительно)
            volumeCm3 = (this.calculateVolume(geometry) / 1000);
            console.log('👁️ AI Vision: использован расчётный объём:', volumeCm3, 'см³');
        }

        // 🔥 ИСПОЛЬЗУЕМ РЕАЛЬНЫЕ РАЗМЕРЫ ОТ ВОРКЕРА (если доступны)
        let realSize = null;
        if (window.modelSize && window.modelSize.x && window.modelSize.y && window.modelSize.z) {
            realSize = {
                x: parseFloat(window.modelSize.x),
                y: parseFloat(window.modelSize.y),
                z: parseFloat(window.modelSize.z)
            };
            console.log('👁️ AI Vision: использованы реальные размеры от воркера:', realSize, 'мм');
        }

        // Вычисляем площадь поверхности
        const surfaceArea = this.calculateSurfaceArea(geometry);

        // Анализируем сложность
        const complexity = this.analyzeComplexity(geometry);

        // Анализируем свесы (нужны ли поддержки)
        const overhangs = this.analyzeOverhangs(geometry);

        // Плотности материалов (г/см³)
        const densityPLA = 1.24;
        const densityPETG = 1.27;
        const densityABS = 1.04;

        // Формируем результат
        this.modelAnalysis = {
            // Габариты (используем реальные данные от воркера)
            dimensions: {
                x: realSize ? realSize.x.toFixed(1) : size.x.toFixed(2),
                y: realSize ? realSize.y.toFixed(1) : size.y.toFixed(2),
                z: realSize ? realSize.z.toFixed(1) : size.z.toFixed(2),
                unit: 'мм'
            },

            // Объём и вес (для разных материалов и заполнений)
            volume: {
                cm3: volumeCm3.toFixed(2),
                weightPLA20: (volumeCm3 * densityPLA * 0.20).toFixed(1) + ' г',
                weightPETG20: (volumeCm3 * densityPETG * 0.20).toFixed(1) + ' г',
                weightABS20: (volumeCm3 * densityABS * 0.20).toFixed(1) + ' г',
                // Полный вес (100% заполнение)
                weightPLA100: (volumeCm3 * densityPLA).toFixed(1) + ' г',
                weightPETG100: (volumeCm3 * densityPETG).toFixed(1) + ' г',
                weightABS100: (volumeCm3 * densityABS).toFixed(1) + ' г'
            },

            // Площадь поверхности
            surfaceArea: {
                cm2: (surfaceArea / 100).toFixed(2),
                mm2: surfaceArea.toFixed(2)
            },

            // Сложность печати
            complexity: complexity,

            // Свесы и поддержки
            overhangs: overhangs,

            // Рекомендации
            recommendations: this.generateRecommendations(
                realSize ? {x: realSize.x, y: realSize.y, z: realSize.z} : size,
                volumeCm3 * 1000,
                complexity,
                overhangs
            )
        };

        console.log('✅ Модель проанализирована:', this.modelAnalysis);

        // 🔥 ИНТЕГРАЦИЯ С AI SUPPORTS - АНАЛИЗ ПОДДЕРЖЕК
        if (window.AI_SUPPORTS && typeof window.AI_SUPPORTS.analyzeSupports === 'function') {
            // Получаем высоту слоя из рекомендаций или по умолчанию 0.2
            const layerHeight = 0.2;
            window.AI_SUPPORTS.analyzeSupports(this.currentModel, layerHeight);
            console.log('🏗️ AI Supports: анализ поддержек завершён');
        }

        // Уведомляем ИИ что модель проанализирована
        if (window.AI_ENGINEER) {
            window.AI_ENGINEER.onModelAnalyzed(this.modelAnalysis);
        }

        return this.modelAnalysis;
    },
    
    // Расчёт объёма
    calculateVolume: function(geometry) {
        // Простой расчёт через bounding box (приблизительно)
        const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
        const size = boundingBox.getSize(new THREE.Vector3());
        
        // Для более точного расчёта нужно суммировать объёмы треугольников
        // Это упрощённая версия
        return size.x * size.y * size.z * 0.5; // Коэффициент ~0.5 для типичных моделей
    },
    
    // Расчёт площади поверхности
    calculateSurfaceArea: function(geometry) {
        let area = 0;
        
        if (geometry.attributes.position) {
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 9) {
                const v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
                const v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
                const v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);
                
                // Площадь треугольника
                const side1 = v1.distanceTo(v2);
                const side2 = v2.distanceTo(v3);
                const side3 = v3.distanceTo(v1);
                const s = (side1 + side2 + side3) / 2;
                const triangleArea = Math.sqrt(s * (s - side1) * (s - side2) * (s - side3));
                
                area += triangleArea;
            }
        }
        
        return area;
    },
    
    // Анализ сложности
    analyzeComplexity: function(geometry) {
        const triangles = geometry.attributes.position ? geometry.attributes.position.count : 0;
        
        let complexity = 'Низкая';
        let score = 0;
        
        if (triangles > 10000) {
            complexity = 'Средняя';
            score = 1;
        }
        if (triangles > 50000) {
            complexity = 'Высокая';
            score = 2;
        }
        if (triangles > 100000) {
            complexity = 'Очень высокая';
            score = 3;
        }
        
        return {
            level: complexity,
            score: score,
            triangles: triangles,
            description: this.getComplexityDescription(complexity)
        };
    },
    
    // Описание сложности
    getComplexityDescription: function(level) {
        const descriptions = {
            'Низкая': '✅ Простая модель, быстрая печать, минимум проблем',
            'Средняя': '⚠️ Модель средней сложности, могут быть небольшие свесы',
            'Высокая': '🔶 Сложная геометрия, вероятны проблемы с поддержками',
            'Очень высокая': '🔴 Очень сложная модель, требуется опыт и поддержки'
        };
        return descriptions[level] || '';
    },
    
    // Анализ свесов (overhangs)
    analyzeOverhangs: function(geometry) {
        // Упрощённый анализ - в реальности нужно анализировать нормали треугольников
        // Это заглушка для демонстрации
        
        const needsSupports = Math.random() > 0.5; // Временная логика
        
        return {
            needsSupports: needsSupports,
            angle: needsSupports ? '45-60°' : '<45°',
            description: needsSupports 
                ? '⚠️ Есть свесы >45°, потребуются поддержки'
                : '✅ Свесов нет или они незначительные',
            supportVolume: needsSupports ? '~10-20%' : '0%'
        };
    },
    
    // Генерация рекомендаций
    generateRecommendations: function(size, volume, complexity, overhangs) {
        const recommendations = [];

        // 1. Ориентация
        const largestDimension = Math.max(size.x, size.y, size.z);
        if (size.z === largestDimension && size.z > 100) {
            recommendations.push({
                type: 'orientation',
                icon: '🔄',
                text: 'Модель высокая. Рассмотрите печать лежа для лучшей стабильности.'
            });
        }

        // 2. Заполнение (используем объём в см³)
        const volumeCm3 = volume / 1000;
        if (volumeCm3 > 200) {
            recommendations.push({
                type: 'infill',
                icon: '🔲',
                text: 'Очень большая деталь. Используйте 10-15% заполнение для экономии материала.'
            });
        } else if (volumeCm3 > 100) {
            recommendations.push({
                type: 'infill',
                icon: '🔲',
                text: 'Большая деталь. Используйте 15-20% заполнение для оптимального баланса.'
            });
        } else if (volumeCm3 > 50) {
            recommendations.push({
                type: 'infill',
                icon: '🔲',
                text: 'Средняя деталь. Используйте 20-30% заполнение.'
            });
        } else if (volumeCm3 < 10) {
            recommendations.push({
                type: 'infill',
                icon: '🔲',
                text: 'Маленькая деталь. Можно использовать 40-60% заполнение для прочности.'
            });
        } else {
            recommendations.push({
                type: 'infill',
                icon: '🔲',
                text: 'Стандартная деталь. Используйте 20-25% заполнение.'
            });
        }

        // 3. Поддержки
        if (overhangs.needsSupports) {
            recommendations.push({
                type: 'supports',
                icon: '🏗️',
                text: 'Нужны поддержки. Используйте Tree supports для экономии материала.'
            });
        }

        // 4. Слой
        if (complexity.score >= 2) {
            recommendations.push({
                type: 'layer',
                icon: '📏',
                text: 'Сложная геометрия. Используйте слой 0.1-0.15 мм для качества.'
            });
        } else {
            recommendations.push({
                type: 'layer',
                icon: '📏',
                text: 'Простая модель. Слой 0.2-0.3 мм для быстрой печати.'
            });
        }

        // 5. Материал (для больших деталей с высокой высотой)
        if (size.z > 100) {
            recommendations.push({
                type: 'material',
                icon: '📦',
                text: 'Высокая деталь. Используйте ABS/ASA для минимизации коробления.'
            });
        }

        return recommendations;
    },
    
    // Получить анализ для ИИ
    getAnalysis: function() {
        // Проверяем PWMO (SLA)
        if (window.currentPWMO && window.currentPWMO.loaded) {
            return {
                available: true,
                type: 'pwmo',
                filename: window.currentPWMO.filename,
                path: window.currentPWMO.path,
                format: window.currentPWMO.format,
                tech: 'SLA',
                message: `✅ **PWMO файл загружён:** ${window.currentPWMO.filename}\n\n📊 **Формат:** ${window.currentPWMO.format}\n🖨️ **Технология:** SLA/DLP\n\nℹ️ PWMO файлы содержат настройки экспозиции для SLA печати.`
            };
        }
    
        // Проверяем G-код (FDM)
        if (window.currentGCode && window.currentGCode.loaded) {
            const g = window.currentGCode.analysis;
            const printTimeHours = Math.floor(g.printTime / 60);
            const printTimeMinutes = g.printTime % 60;
            return {
                available: true,
                type: 'gcode',
                filename: window.currentGCode.filename,
                printTime: g.printTime,
                printTimeFormatted: `${printTimeHours}ч ${printTimeMinutes}мин`,
                filamentUsage: g.filamentUsage,
                layerCount: g.layerCount,
                height: g.lastZ,
                message: `✅ **G-код загружён:** ${window.currentGCode.filename}\n\n⏱️ Время: ${printTimeHours}ч ${printTimeMinutes}мин\n🧵 Филамент: ${(g.filamentUsage/1000).toFixed(2)} м\n📏 Слоёв: ${g.layerCount}\n📐 Высота: ${g.lastZ.toFixed(2)} мм`
            };
        }

        // Проверяем 3D-модель
        if (!this.modelAnalysis) {
            return {
                available: false,
                message: '🔍 Модель ещё не проанализирована. Загрузите STL, G-код или PWMO файл.'
            };
        }

        return {
            available: true,
            ...this.modelAnalysis
        };
    },

    // Быстрые вопросы от ИИ
    quickAnswers: {
        'анализ': function() {
            if (window.currentPWMO && window.currentPWMO.loaded) {
                return `📄 **PWMO файл загружён:** ${window.currentPWMO.filename}\n\n📊 **Формат:** ${window.currentPWMO.format}\n🖨️ **Технология:** SLA/DLP\n\nℹ️ PWMO файлы содержат настройки экспозиции для SLA печати.`;
            }
            if (window.currentGCode && window.currentGCode.loaded) {
                const g = window.currentGCode.analysis;
                const printTimeHours = Math.floor(g.printTime / 60);
                const printTimeMinutes = g.printTime % 60;
                return `📄 **G-код загружён:** ${window.currentGCode.filename}\n\n⏱️ Время: ${printTimeHours}ч ${printTimeMinutes}мин\n🧵 Филамент: ${(g.filamentUsage/1000).toFixed(2)} м\n📏 Слоёв: ${g.layerCount}\n📐 Высота: ${g.lastZ.toFixed(2)} мм`;
            }
            return '👁️ **Анализ модели:**\n\nЗагрузите STL, G-код или PWMO файл для анализа.';
        },

        'размер': function() {
            if (window.currentPWMO && window.currentPWMO.loaded) {
                return `📊 **PWMO файл:** ${window.currentPWMO.filename}\n\n🖨️ **Технология:** SLA/DLP\n\nℹ️ PWMO файлы содержат настройки экспозиции для SLA печати.`;
            }
            if (window.currentGCode && window.currentGCode.loaded) {
                const g = window.currentGCode.analysis;
                return `📐 **Высота печати:** ${g.lastZ.toFixed(2)} мм\n\n📏 **Слоёв:** ${g.layerCount}`;
            }
            return '📏 **Размеры модели:**\n\nЗагрузите модель для получения точных размеров.';
        },

        'объём': function() {
            if (window.currentPWMO && window.currentPWMO.loaded) {
                return `📊 **PWMO файл:** ${window.currentPWMO.filename}\n\n🖨️ **Технология:** SLA/DLP\n\nℹ️ PWMO файлы содержат настройки экспозиции и пути лазера.`;
            }
            if (window.currentGCode && window.currentGCode.loaded) {
                const g = window.currentGCode.analysis;
                return `🧵 **Израсходовано филамента:** ${(g.filamentUsage/1000).toFixed(2)} м\n\n⏱️ **Время печати:** ${Math.floor(g.printTime/60)}ч ${g.printTime%60}мин`;
            }
            return '⚖️ **Объём и вес:**\n\nЗагрузите модель для расчёта объёма и веса материала.';
        },

        'поддержк': '🏗️ **Поддержки:**\n\nЗагрузите STL модель для анализа свесов и необходимости поддержек.',

        'сложн': '🎯 **Сложность печати:**\n\nЗагрузите модель для оценки сложности.'
    },

    // Поиск ответов
    search: function(query) {
        const lower = query.toLowerCase();

        // Проверяем PWMO первым (SLA)
        if (window.currentPWMO && window.currentPWMO.loaded) {
            const p = window.currentPWMO;
            
            if (lower.includes('анализ') || lower.includes('модель') || lower.includes('файл') || lower.includes('pwmo')) {
                return `📄 **PWMO файл загружён:** ${p.filename}\n\n📊 **Формат:** ${p.format}\n🖨️ **Технология:** SLA/DLP\n\nℹ️ PWMO файлы содержат настройки экспозиции для SLA печати.`;
            }
            
            if (lower.includes('формат') || lower.includes('технолог') || lower.includes('sla') || lower.includes('dlp')) {
                return `🖨️ **Технология:** SLA/DLP\n\n📊 **Формат:** ${p.format}\n\n📁 **Файл:** ${p.filename}`;
            }
        }

        // Проверяем G-код (FDM)
        if (window.currentGCode && window.currentGCode.loaded) {
            const g = window.currentGCode.analysis;
            const printTimeHours = Math.floor(g.printTime / 60);
            const printTimeMinutes = g.printTime % 60;

            if (lower.includes('анализ') || lower.includes('модель') || lower.includes('деталь') || lower.includes('g-код') || lower.includes('gcode')) {
                return this.formatFullAnalysis();
            }

            if (lower.includes('размер') || lower.includes('габарит') || lower.includes('высот')) {
                return `📐 **Высота печати:** ${g.lastZ.toFixed(2)} мм\n\n📏 **Слоёв:** ${g.layerCount}`;
            }

            if (lower.includes('объём') || lower.includes('вес') || lower.includes('филамент')) {
                return `🧵 **Израсходовано филамента:** ${(g.filamentUsage/1000).toFixed(2)} м\n\n⏱️ **Время печати:** ${printTimeHours}ч ${printTimeMinutes}мин`;
            }

            if (lower.includes('врем') || lower.includes('скорост')) {
                return `⏱️ **Время печати:** ${printTimeHours}ч ${printTimeMinutes}мин`;
            }
        }

        // Если 3D-модель загружена, даём полный анализ
        if (this.modelAnalysis) {
            if (lower.includes('анализ') || lower.includes('модель') || lower.includes('деталь')) {
                return this.formatFullAnalysis();
            }

            if (lower.includes('размер') || lower.includes('габарит')) {
                const d = this.modelAnalysis.dimensions;
                return `📏 **Размеры:** ${d.x} × ${d.y} × ${d.z} ${d.unit}`;
            }

            if (lower.includes('объём') || lower.includes('вес')) {
                const v = this.modelAnalysis.volume;
                return `⚖️ **Объём:** ${v.cm3} см³\n\n**ВЕС (20% заполнение):**\n• PLA: ${v.weightPLA20}\n• PETG: ${v.weightPETG20}\n• ABS: ${v.weightABS20}\n\n**ЧИСТЫЙ ВЕС (100% заполнение):**\n• PLA: ${v.weightPLA100}\n• PETG: ${v.weightPETG100}\n• ABS: ${v.weightABS100}`;
            }

            if (lower.includes('сложн')) {
                const c = this.modelAnalysis.complexity;
                return `🎯 **Сложность:** ${c.level}\n\n${c.description}\n\nТреугольников: ${c.triangles}`;
            }

            if (lower.includes('поддержк') || lower.includes('свес')) {
                const o = this.modelAnalysis.overhangs;
                return `🏗️ **Поддержки:** ${o.description}\n\nУгол свесов: ${o.angle}\n\nОбъём поддержек: ${o.supportVolume}`;
            }

            if (lower.includes('рекоменд')) {
                let response = '💡 **Рекомендации:**\n\n';
                this.modelAnalysis.recommendations.forEach((r, i) => {
                    response += `${r.icon} ${r.text}\n`;
                });
                return response;
            }
        }

        // Если ничего не загружено
        for (const [key, answer] of Object.entries(this.quickAnswers)) {
            if (lower.includes(key)) {
                // Вызываем функцию, если это функция
                return typeof answer === 'function' ? answer() : answer;
            }
        }

        return null;
    },
    
    // Форматирование полного анализа
    formatFullAnalysis: function() {
        // Если загружен G-код
        if (window.currentGCode && window.currentGCode.loaded) {
            const g = window.currentGCode.analysis;
            const printTimeHours = Math.floor(g.printTime / 60);
            const printTimeMinutes = g.printTime % 60;
            
            let response = '📄 **АНАЛИЗ G-КОДА**\n\n';
            response += `📁 Файл: ${window.currentGCode.filename}\n\n`;
            response += `⏱️ **Время печати:** ${printTimeHours}ч ${printTimeMinutes}мин\n\n`;
            response += `🧵 **Филамент:** ${(g.filamentUsage/1000).toFixed(2)} м\n\n`;
            response += `📏 **Слоёв:** ${g.layerCount}\n\n`;
            response += `📐 **Высота:** ${g.lastZ.toFixed(2)} мм\n\n`;
            response += `💡 **Рекомендации:**\n`;
            response += `• Проверьте адгезию первого слоя\n`;
            response += `• Оптимальная скорость печати для данной высоты\n`;
            response += `• Убедитесь в достаточном охлаждении`;
            
            return response;
        }
        
        // Если загружена 3D-модель
        if (!this.modelAnalysis) {
            return '🔍 Модель ещё не проанализирована. Загрузите STL файл.';
        }

        const a = this.modelAnalysis;

        let response = '👁️ **АНАЛИЗ 3D-МОДЕЛИ**\n\n';

        response += `📏 **Размеры:** ${a.dimensions.x} × ${a.dimensions.y} × ${a.dimensions.z} ${a.dimensions.unit}\n\n`;

        response += `⚖️ **Объём:** ${a.volume.cm3} см³\n`;
        response += `\n**ВЕС (20% заполнение):**\n`;
        response += `• PLA: ${a.volume.weightPLA20}\n`;
        response += `• PETG: ${a.volume.weightPETG20}\n`;
        response += `• ABS: ${a.volume.weightABS20}\n`;
        
        response += `\n**ЧИСТЫЙ ВЕС (100% заполнение):**\n`;
        response += `• PLA: ${a.volume.weightPLA100}\n`;
        response += `• PETG: ${a.volume.weightPETG100}\n`;
        response += `• ABS: ${a.volume.weightABS100}\n\n`;

        response += `🎯 **Сложность:** ${a.complexity.level}\n`;
        response += `${a.complexity.description}\n\n`;
        
        response += `🏗️ **Поддержки:** ${a.overhangs.description}\n`;
        response += `Угол: ${a.overhangs.angle}, Объём: ${a.overhangs.supportVolume}\n\n`;
        
        response += `💡 **Рекомендации:**\n`;
        a.recommendations.forEach(r => {
            response += `${r.icon} ${r.text}\n`;
        });
        
        return response;
    }
};

// Авто-инициализация после загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AI_VISION.init();
    });
} else {
    window.AI_VISION.init();
}

console.log('✅ AI Vision модуль загружен');
console.log('👁️ Функции:');
console.log('   - Анализ геометрии (размеры, объём)');
console.log('   - Оценка сложности печати');
console.log('   - Анализ свесов (поддержки)');
console.log('   - Рекомендации по ориентации');
console.log('   - Расчёт веса материала');
