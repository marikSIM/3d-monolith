/**
 * 3D MONOLITH AI - AI SUPPORTS ANALYSIS (АНАЛИЗ ПОДДЕРЖЕК)
 * Файл: ai-supports.js
 * Описание: ИИ анализирует модель и определяет зоны, требующие поддержек
 *
 * Функции:
 * - Анализ углов свесов (overhangs)
 * - Визуализация проблемных зон (красным цветом)
 * - Рекомендации по типам поддержек
 * - Расчёт объёма поддержек
 */

window.AI_SUPPORTS = {
    // Текущий анализ поддержек
    supportAnalysis: null,

    // Меш для визуализации поддержек
    supportVisualizerMesh: null,

    // Инициализация
    init: function() {
        console.log('🏗️ AI Supports модуль инициализирован');
    },

    // Анализ модели на необходимость поддержек
    analyzeSupports: function(model, layerHeight = 0.2) {
        if (!model) {
            console.warn('⚠️ Модель не загружена');
            return null;
        }

        const geometry = model.geometry;
        const positions = geometry.attributes.position.array;
        const triangleCount = positions.length / 9;

        // 🔥 АНАЛИЗ ПО ГРАНЯМ (не по вершинам!)
        const overhangTriangles = [];
        const normalTriangles = [];

        for (let i = 0; i < triangleCount; i++) {
            // Получаем 3 вершины треугольника
            const v1 = new THREE.Vector3(
                positions[i * 9 + 0],
                positions[i * 9 + 1],
                positions[i * 9 + 2]
            );
            const v2 = new THREE.Vector3(
                positions[i * 9 + 3],
                positions[i * 9 + 4],
                positions[i * 9 + 5]
            );
            const v3 = new THREE.Vector3(
                positions[i * 9 + 6],
                positions[i * 9 + 7],
                positions[i * 9 + 8]
            );

            // 🔥 Вычисляем нормаль грани через векторное произведение
            const edge1 = new THREE.Vector3().subVectors(v2, v1);
            const edge2 = new THREE.Vector3().subVectors(v3, v1);
            const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

            // 🔥 Y-компонента нормали определяет тип поверхности:
            // normalY > 0 — грань смотрит вверх (пол/потолок)
            // normalY ≈ 0 — вертикальная стена
            // normalY < 0 — грань смотрит вниз (свес!)
            const normalY = normal.y;

            // 🔥 Угол свеса от горизонтали (0° = горизонтально вверх, 90° = вертикально, 180° = горизонтально вниз)
            const clampedNormalY = Math.max(-1, Math.min(1, normalY));
            const angleFromUp = Math.acos(clampedNormalY) * (180 / Math.PI);

            // 🔥 ПРАВИЛЬНАЯ ЛОГИКА для 3D печати:
            // 0-45° от верха — нормальная поверхность, поддержка не нужна
            // 45-90° — наклон/вертикаль, обычно не нужна поддержка
            // 90-135° — свес, желательна поддержка
            // 135-180° — сильный свес, обязательна поддержка
            
            // 🔥 Если грань смотрит вниз (angle > 90°) — это свес!
            if (angleFromUp > 90) {
                // Центр треугольника
                const centerX = (v1.x + v2.x + v3.x) / 3;
                const centerY = (v1.y + v2.y + v3.y) / 3;
                const centerZ = (v1.z + v2.z + v3.z) / 3;

                // 🔥 Серьёзность по углу от верха
                // 90-110° — незначительный свес
                // 110-135° — проблемный свес
                // >135° — критический свес
                const severity = angleFromUp > 135 ? 'critical' : (angleFromUp > 110 ? 'warning' : 'minor');

                overhangTriangles.push({
                    index: i,
                    angle: angleFromUp,
                    overhangAngle: angleFromUp - 90, // Угол от горизонтали
                    normal: {x: normal.x, y: normal.y, z: normal.z},
                    position: {
                        x: centerX,
                        y: centerY,
                        z: centerZ
                    },
                    severity: severity
                });
            } else {
                normalTriangles.push(i);
            }
        }

        // Рассчитываем статистику
        const totalTriangles = overhangTriangles.length + normalTriangles.length;
        const overhangPercentage = totalTriangles > 0 ? (overhangTriangles.length / totalTriangles * 100).toFixed(1) : '0';

        // Определяем зоны поддержек
        const supportZones = this.calculateSupportZones(overhangTriangles, geometry);

        // Формируем результат
        this.supportAnalysis = {
            needsSupports: overhangTriangles.length > 0,
            overhangCount: overhangTriangles.length,
            overhangPercentage: overhangPercentage + '%',
            overhangTriangles: overhangTriangles,
            supportZones: supportZones,
            layerHeight: layerHeight,

            // Статистика по серьёзности
            criticalZones: overhangTriangles.filter(t => t.severity === 'critical').length,
            warningZones: overhangTriangles.filter(t => t.severity === 'warning').length,
            minorZones: overhangTriangles.filter(t => t.severity === 'minor').length,

            // Рекомендации
            recommendations: this.generateSupportRecommendations(overhangTriangles, supportZones, layerHeight)
        };

        console.log('🏗️ Анализ поддержек завершён:', this.supportAnalysis);
        console.log(`   Всего треугольников: ${totalTriangles}`);
        console.log(`   Свесы: ${overhangTriangles.length} (${overhangPercentage}%)`);
        console.log(`   Критические: ${this.supportAnalysis.criticalZones}`);
        console.log(`   Проблемные: ${this.supportAnalysis.warningZones}`);

        return this.supportAnalysis;
    },

    // Расчёт зон поддержек
    calculateSupportZones: function(overhangTriangles, geometry) {
        const zones = [];

        if (overhangTriangles.length === 0) return zones;

        // Группируем треугольники по Z-уровням (высота)
        const zLevels = {};
        const layerThickness = 5; // мм (группируем по 5мм)

        overhangTriangles.forEach(tri => {
            const zLevel = Math.floor(tri.position.z / layerThickness) * layerThickness;
            if (!zLevels[zLevel]) zLevels[zLevel] = [];
            zLevels[zLevel].push(tri);
        });

        // Создаём зоны
        Object.entries(zLevels).forEach(([zHeight, triangles]) => {
            // Находим центр зоны
            const avgX = triangles.reduce((sum, t) => sum + t.position.x, 0) / triangles.length;
            const avgY = triangles.reduce((sum, t) => sum + t.position.y, 0) / triangles.length;
            const avgZ = parseFloat(zHeight) + layerThickness / 2;

            // Определяем размер зоны
            const xs = triangles.map(t => t.position.x);
            const ys = triangles.map(t => t.position.y);
            const sizeX = Math.max(...xs) - Math.min(...xs);
            const sizeY = Math.max(...ys) - Math.min(...ys);

            // Средняя серьёзность
            const criticalCount = triangles.filter(t => t.severity === 'critical').length;
            const severity = criticalCount > triangles.length * 0.5 ? 'critical' : 'warning';

            zones.push({
                center: { x: avgX, y: avgY, z: avgZ },
                size: { x: sizeX, y: sizeY, z: layerThickness },
                triangleCount: triangles.length,
                severity: severity,
                description: this.getZoneDescription(severity, triangles.length, avgZ)
            });
        });

        return zones;
    },

    // Описание зоны
    getZoneDescription: function(severity, count, height) {
        const severityText = severity === 'critical' ? '🔴 Критичная' : '🟡 Проблемная';
        return `${severityText} зона на высоте ~${height.toFixed(1)}мм (${count} треугольников)`;
    },

    // Генерация рекомендаций
    generateSupportRecommendations: function(overhangs, zones, layerHeight) {
        const recommendations = [];

        if (overhangs.length === 0) {
            recommendations.push({
                type: 'info',
                icon: '✅',
                title: 'Поддержки не требуются',
                text: 'Модель не имеет свесов >45°. Можно печатать без поддержек.'
            });
            return recommendations;
        }

        // 1. Тип поддержек
        const criticalCount = overhangs.filter(t => t.severity === 'critical').length;
        if (criticalCount > overhangs.length * 0.3) {
            recommendations.push({
                type: 'support_type',
                icon: '🌳',
                title: 'Тип поддержек: Tree (Древовидные)',
                text: 'Много критических свесов. Tree supports сэкономят материал и легче удаляются.'
            });
        } else {
            recommendations.push({
                type: 'support_type',
                icon: '📐',
                title: 'Тип поддержек: Normal (Обычные)',
                text: 'Небольшое количество свесов. Обычные поддержки обеспечат лучшую стабильность.'
            });
        }

        // 2. Плотность поддержек
        if (criticalCount > 100) {
            recommendations.push({
                type: 'density',
                icon: '🔲',
                title: 'Плотность поддержек: 15-20%',
                text: 'Много свесов. Увеличьте плотность поддержек для надёжности.'
            });
        } else {
            recommendations.push({
                type: 'density',
                icon: '🔲',
                title: 'Плотность поддержек: 10-12%',
                text: 'Стандартная плотность для большинства моделей.'
            });
        }

        // 3. Z-расстояние
        recommendations.push({
            type: 'z_distance',
            icon: '📏',
            title: `Z-расстояние: ${(layerHeight * 0.8).toFixed(2)}мм`,
            text: 'Верхний слой поддержек должен быть на 0.8 высоты слоя ниже модели.'
        });

        // 4. Interface layers
        recommendations.push({
            type: 'interface',
            icon: '📄',
            title: 'Interface Layers: 3-4 слоя',
            text: 'Добавьте горизонтальные слои на вершине поддержек для лучшей поверхности.'
        });

        // 5. Зоны внимания
        if (zones.length > 0) {
            const criticalZones = zones.filter(z => z.severity === 'critical');
            if (criticalZones.length > 0) {
                recommendations.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: 'Критические зоны',
                    text: `Обратите внимание на ${criticalZones.length} критических зон(ы). Проверьте адгезию поддержек.`
                });
            }
        }

        // 6. Ориентация модели
        recommendations.push({
            type: 'orientation',
            icon: '🔄',
            title: 'Ориентация модели',
            text: 'Рассмотрите поворот модели на 45° для уменьшения площади свесов.'
        });

        return recommendations;
    },

    // Визуализация свесов (красным цветом)
    visualizeOverhangs: function(model, scene) {
        if (!model || !this.supportAnalysis) {
            console.warn('⚠️ Нет модели или анализа для визуализации');
            return false;
        }

        // Удаляем старую визуализацию
        if (this.supportVisualizerMesh) {
            scene.remove(this.supportVisualizerMesh);
            this.supportVisualizerMesh.geometry.dispose();
            this.supportVisualizerMesh.material.dispose();
            this.supportVisualizerMesh = null;
        }

        const geometry = model.geometry;
        const overhangTriangles = this.supportAnalysis.overhangTriangles;

        if (overhangTriangles.length === 0) {
            console.log('✅ Свесов нет - визуализация не требуется');
            
            // Показываем кнопку что поддержек нет
            const btn = document.querySelector('#supports-controls button');
            if (btn) {
                btn.innerHTML = '✅ Поддержки не нужны';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            }
            return false;
        }

        // Создаём геометрию для визуализации
        const positions = [];
        const colors = [];

        const originalPositions = geometry.attributes.position.array;

        overhangTriangles.forEach(tri => {
            const i = tri.index * 9;

            // Добавляем 3 вершины треугольника
            for (let j = 0; j < 3; j++) {
                positions.push(
                    originalPositions[i + j * 3],
                    originalPositions[i + j * 3 + 1],
                    originalPositions[i + j * 3 + 2]
                );

                // Цвет по серьёзности
                if (tri.severity === 'critical') {
                    colors.push(1, 0, 0); // Красный
                } else if (tri.severity === 'warning') {
                    colors.push(1, 0.65, 0); // Оранжевый
                } else {
                    colors.push(1, 1, 0); // Жёлтый
                }
            }
        });

        const visualGeometry = new THREE.BufferGeometry();
        visualGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        visualGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1 // Рисуем поверх основной модели
        });

        this.supportVisualizerMesh = new THREE.Mesh(visualGeometry, material);
        
        // 🔥 КЛЮЧЕВОЙ МОМЕНТ: Копируем масштаб и позицию у модели
        this.supportVisualizerMesh.scale.copy(model.scale);
        this.supportVisualizerMesh.position.copy(model.position);
        this.supportVisualizerMesh.rotation.copy(model.rotation);
        this.supportVisualizerMesh.renderOrder = 999; // Рисуем поверх всего

        scene.add(this.supportVisualizerMesh);

        // Обновляем кнопку
        const btn = document.querySelector('#supports-controls button');
        if (btn) {
            btn.innerHTML = `🔒 Скрыть поддержки (${overhangTriangles.length} тр.)`;
            btn.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
        }

        console.log(`🏗️ Визуализация: ${overhangTriangles.length} треугольников свесов`);
        console.log(`   🔴 Критические: ${this.supportAnalysis.criticalZones}`);
        console.log(`   🟠 Проблемные: ${this.supportAnalysis.warningZones}`);
        console.log(`   🟡 Незначительные: ${this.supportAnalysis.minorZones}`);

        return true;
    },

    // Скрыть визуализацию
    hideVisualization: function(scene) {
        if (this.supportVisualizerMesh) {
            scene.remove(this.supportVisualizerMesh);
            this.supportVisualizerMesh.geometry.dispose();
            this.supportVisualizerMesh.material.dispose();
            this.supportVisualizerMesh = null;
            console.log('🔒 Визуализация поддержек скрыта');
        }
        
        // Обновляем кнопку
        const btn = document.querySelector('#supports-controls button');
        if (btn) {
            btn.innerHTML = '🏗️ Показать поддержки';
            btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
    },

    // Получить отчёт для ИИ
    getReport: function() {
        if (!this.supportAnalysis) {
            return {
                available: false,
                message: '🔍 Анализ поддержек ещё не выполнен. Загрузите STL файл.'
            };
        }

        const a = this.supportAnalysis;

        let report = '🏗️ **АНАЛИЗ ПОДДЕРЖЕК**\n\n';

        if (!a.needsSupports) {
            report += '✅ **Поддержки не требуются**\n\n';
            report += 'Модель не имеет свесов >45°. Можно печатать без поддержек.\n';
        } else {
            report += `📊 **Статистика свесов:**\n`;
            report += `• Всего свесов: ${a.overhangCount} треугольников\n`;
            report += `• Процент свесов: ${a.overhangPercentage}\n`;
            report += `• Критические зоны: ${a.criticalZones}\n`;
            report += `• Проблемные зоны: ${a.warningZones}\n`;
            report += `• Незначительные: ${a.minorZones}\n\n`;

            report += `🎯 **Зоны поддержек:** ${a.supportZones.length}\n`;
            a.supportZones.slice(0, 5).forEach((zone, i) => {
                report += `${i + 1}. ${zone.description}\n`;
            });
            if (a.supportZones.length > 5) {
                report += `... и ещё ${a.supportZones.length - 5} зон\n`;
            }
            report += '\n';
        }

        report += `💡 **Рекомендации:**\n`;
        a.recommendations.forEach(rec => {
            report += `${rec.icon} **${rec.title}**\n`;
            report += `   ${rec.text}\n\n`;
        });

        return {
            available: true,
            report: report,
            analysis: a
        };
    },

    // Быстрые ответы
    quickAnswers: {
        'поддержк': '🏗️ **Поддержки (Supports)**\n\nЗагрузите модель для анализа необходимости поддержек.\n\nЯ определю:\n• 📍 Зоны свесов >45°\n• 🎯 Критические области\n• 💡 Рекомендации по настройкам',

        'свес': '🏗️ **Свесы (Overhangs)**\n\nЗагрузите STL файл для анализа свесов.\n\nУгол >45° от вертикали требует поддержек.',

        'tree support': '🌳 **Tree Supports (Древовидные)**\n\nПреимущества:\n• Экономия материала (до 30%)\n• Легче удаляются\n• Меньше следов на модели\n\nНедостатки:\n• Дольше генерируются\n• Менее стабильны для больших свесов',

        'normal support': '📐 **Normal Supports (Обычные)**\n\nПреимущества:\n• Быстрая генерация\n• Стабильные\n• Предсказуемые\n\nНедостатки:\n• Больше материала\n• Сложнее удалять\n• Больше следов'
    },

    // Поиск ответов
    search: function(query) {
        const lower = query.toLowerCase();

        // Если анализ выполнен
        if (this.supportAnalysis) {
            if (lower.includes('поддержк') || lower.includes('свес') || lower.includes('overhang')) {
                return this.getReport().report;
            }

            if (lower.includes('зона') || lower.includes('где') || lower.includes('куда')) {
                const zones = this.supportAnalysis.supportZones;
                if (zones.length === 0) {
                    return '✅ Свесов не обнаружено - поддержки не требуются!';
                }

                let response = '🎯 **Зоны для поддержек:**\n\n';
                zones.forEach((zone, i) => {
                    response += `${i + 1}. ${zone.description}\n`;
                    response += `   Центр: X=${zone.center.x.toFixed(1)}, Y=${zone.center.y.toFixed(1)}, Z=${zone.center.z.toFixed(1)}мм\n\n`;
                });
                return response;
            }

            if (lower.includes('тип') || lower.includes('какой') || lower.includes('выбери')) {
                const rec = this.supportAnalysis.recommendations.find(r => r.type === 'support_type');
                if (rec) {
                    return `${rec.icon} **${rec.title}**\n\n${rec.text}`;
                }
            }

            if (lower.includes('плотн') || lower.includes('density')) {
                const rec = this.supportAnalysis.recommendations.find(r => r.type === 'density');
                if (rec) {
                    return `${rec.icon} **${rec.title}**\n\n${rec.text}`;
                }
            }

            if (lower.includes('расстоян') || lower.includes('distance') || lower.includes('z-')) {
                const rec = this.supportAnalysis.recommendations.find(r => r.type === 'z_distance');
                if (rec) {
                    return `${rec.icon} **${rec.title}**\n\n${rec.text}`;
                }
            }
        }

        // Если анализ не выполнен - показываем заглушки
        for (const [key, answer] of Object.entries(this.quickAnswers)) {
            if (lower.includes(key)) {
                return answer;
            }
        }

        return null;
    }
};

// Авто-инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AI_SUPPORTS.init();
    });
} else {
    window.AI_SUPPORTS.init();
}

console.log('✅ AI Supports модуль загружен');
console.log('🏗️ Функции:');
console.log('   - Анализ свесов (overhangs)');
console.log('   - Визуализация проблемных зон');
console.log('   - Рекомендации по типам поддержек');
console.log('   - Расчёт оптимальных настроек');
