/**
 * 3D MONOLITH AI - БАЗА ЗНАНИЙ
 * Файл: index.js
 * Описание: Главный файл подключения всех модулей
 */

console.log('🤖 AI Knowledge Base загружается...');

// Функция для получения всех знаний
window.AI_KNOWLEDGE = window.AI_KNOWLEDGE || {};
window.AI_KNOWLEDGE.search = function(query) {
    const lowerQuery = query.toLowerCase();

    // ============================================
    // ПРОВЕРЯЕМ НОВЫЕ МОДУЛИ (в первую очередь!)
    // ============================================
    
    // 0. AI VISION - вопросы о модели (ПРИОРИТЕТ!)
    if (window.AI_VISION) {
        const visionResult = window.AI_VISION.search(query);
        if (visionResult) {
            return {
                type: 'vision',
                response: visionResult,
                category: 'Анализ 3D-модели'
            };
        }
    }
    
    // 1. SLA знания
    if (window.AI_SLA_KNOWLEDGE) {
        const slaResult = window.AI_SLA_KNOWLEDGE.search(query);
        if (slaResult) {
            return {
                type: 'sla',
                response: slaResult,
                category: 'SLA/DLP 3D-печать'
            };
        }
    }
    
    // 2. FDM проблемы и решения
    if (window.AI_FDM_TROUBLESHOOTING) {
        const troubleResult = window.AI_FDM_TROUBLESHOOTING.search(query);
        if (troubleResult) {
            return {
                type: 'fdm-troubleshooting',
                response: troubleResult,
                category: 'Проблемы FDM'
            };
        }
    }
    
    // 3. Плотности и расчёты
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
    
    // 4. FDM материалы (полная база)
    if (window.AI_FDM_MATERIALS) {
        const materialsResult = window.AI_FDM_MATERIALS.search(query);
        if (materialsResult) {
            return {
                type: 'fdm-materials',
                response: materialsResult,
                category: 'Материалы FDM'
            };
        }
    }
    
    // 5. Температуры
    if (window.AI_TEMPERATURES) {
        const tempResult = window.AI_TEMPERATURES.search(query);
        if (tempResult) {
            return {
                type: 'temperatures',
                response: tempResult,
                category: 'Температуры печати'
            };
        }
    }
    
    // 6. Высота слоя
    if (window.AI_LAYER_HEIGHT) {
        const layerResult = window.AI_LAYER_HEIGHT.search(query);
        if (layerResult) {
            return {
                type: 'layer-height',
                response: layerResult,
                category: 'Высота слоя'
            };
        }
    }

    // ============================================
    // СТАРЫЕ МОДУЛИ (резервные)
    // ============================================

    // 7. Проверяем общие ответы (greetings, aboutAI, etc.)
    if (this.generalResponses) {
        const general = this.findResponse(query);
        if (general.found) {
            return {
                type: 'general',
                response: general.response,
                category: general.category
            };
        }
    }

    // 8. Проверяем неисправности
    if (this.troubleshooting && this.findTroubleshooting) {
        const trouble = this.findTroubleshooting(query);
        if (trouble) {
            let response = `🔧 ПРОБЛЕМА: ${trouble.problem}\n\n`;

            if (trouble.causes && trouble.causes.length > 0) {
                response += '🔍 Возможные причины:\n';
                trouble.causes.forEach((cause, i) => {
                    response += `  ${i + 1}. ${cause}\n`;
                });
            }

            if (trouble.solutions && trouble.solutions.length > 0) {
                response += '\n✅ Решения:\n';
                trouble.solutions.forEach((sol, i) => {
                    response += `  ${i + 1}. ${sol}\n`;
                });
            }

            if (trouble.safetyWarning) {
                response += `\n⚠️ ${trouble.safetyWarning}`;
            }

            return {
                type: 'troubleshooting',
                response: response,
                data: trouble
            };
        }
    }

    // 9. Проверяем FAQ
    if (this.faq && this.findFAQ) {
        const faq = this.findFAQ(query);
        if (faq) {
            return {
                type: 'faq',
                response: faq.answer,
                data: faq
            };
        }
    }

    // 10. Проверяем команды управления калькулятором
    if (window.AI_CALC_CONTROL) {
        const controlResponse = this.checkControlCommand(query);
        if (controlResponse) {
            return controlResponse;
        }
    }

    // 11. Проверяем обученные данные
    if (window.AI_LEARNING && window.AI_LEARNING.learnedActions.length > 0) {
        const learnedResponse = this.checkLearnedData(query);
        if (learnedResponse) {
            return learnedResponse;
        }
    }

    // 12. Ничего не найдено
    return {
        type: 'unknown',
        response: `Я не совсем понял ваш вопрос: "${query}"\n\nЯ могу помочь с:\n• Настройкой принтеров 🖨️\n• Выбором материалов 📦\n• Решением проблем 🔧\n• Параметрами печати ⚙️\n• Безопасностью 🛡️\n• Управлением калькулятором 🎛️\n\nПопробуйте перефразировать вопрос!`
    };
};

// Проверка команд управления калькулятором
window.AI_KNOWLEDGE.checkControlCommand = function(query) {
    const lowerQuery = query.toLowerCase();

    // Проверяем что модуль управления загружен
    if (!window.AI_CALC_CONTROL) {
        return null;
    }

    // Команды управления
    const commands = {
        'сбрось настройки': () => {
            window.AI_CALC_CONTROL.resetToDefaults();
            return {
                type: 'control',
                response: '✅ Настройки сброшены к значениям по умолчанию:\n• Слой: 0.2 мм\n• Заполнение: 20%\n• Отходы: 5%\n• Срочность: обычная'
            };
        },
        'быстрая печать': () => {
            window.AI_CALC_CONTROL.applyPreset('fast');
            return {
                type: 'control',
                response: '⚡ Применён пресет "Быстрая печать":\n• Слой: 0.3 мм\n• Заполнение: 15%\n\nВремя печати уменьшится, но качество снизится.'
            };
        },
        'высокое качество': () => {
            window.AI_CALC_CONTROL.applyPreset('quality');
            return {
                type: 'control',
                response: '🎯 Применён пресет "Высокое качество":\n• Слой: 0.1 мм\n• Заполнение: 40%\n\nВремя печати увеличится, но качество будет лучше.'
            };
        },
        'экономия материала': () => {
            window.AI_CALC_CONTROL.applyPreset('economy');
            return {
                type: 'control',
                response: '💰 Применён пресет "Экономия материала":\n• Слой: 0.3 мм\n• Заполнение: 10%\n\nРасход пластика минимальный.'
            };
        },
        'прочная деталь': () => {
            window.AI_CALC_CONTROL.applyPreset('strong');
            return {
                type: 'control',
                response: '💪 Применён пресет "Прочная деталь":\n• Слой: 0.15 мм\n• Заполнение: 60%\n\nДеталь будет очень прочной.'
            };
        }
    };

    for (const [cmd, handler] of Object.entries(commands)) {
        if (lowerQuery.includes(cmd)) {
            try {
                return handler();
            } catch (error) {
                console.error('Ошибка выполнения команды:', cmd, error);
                return {
                    type: 'error',
                    response: `⚠️ Ошибка при выполнении команды "${cmd}": ${error.message}`
                };
            }
        }
    }

    return null;
};

// Проверка обученных данных
window.AI_KNOWLEDGE.checkLearnedData = function(query) {
    const lowerQuery = query.toLowerCase();
    
    // Вопросы об обученных данных
    if (lowerQuery.includes('чаще всего') || lowerQuery.includes('популярн') || lowerQuery.includes('статистик')) {
        if (window.AI_LEARNING) {
            const patterns = window.AI_LEARNING.analyzePatterns();
            const topPrinter = Object.entries(patterns.popularPrinters).sort((a, b) => b[1] - a[1])[0];
            const topMaterial = Object.entries(patterns.popularMaterials).sort((a, b) => b[1] - a[1])[0];
            
            let response = '📊 Статистика использования:\n\n';
            
            if (topPrinter) {
                response += `🖨️ Чаще всего: ${topPrinter[0]} (${topPrinter[1]} раз)\n`;
            }
            if (topMaterial) {
                response += `📦 Популярный материал: ${topMaterial[0]} (${topMaterial[1]} раз)\n`;
            }
            
            response += `\n💡 Хотите использовать популярные настройки?`;
            
            return {
                type: 'learned',
                response: response
            };
        }
    }
    
    return null;
};

console.log('✅ AI Knowledge Base готова к работе!');
console.log('📚 Доступные модули:');
console.log('   - SLA Knowledge (SLA/DLP печать, смолы)');
console.log('   - FDM Troubleshooting (8 проблем с решениями)');
console.log('   - Material Density (плотности, расчёты)');
console.log('   - FDM Materials Complete (25+ материалов)');
console.log('   - Temperatures (температуры печати)');
console.log('   - Layer Height (высота слоя)');
console.log('   - General Responses (приветствия, о себе)');
console.log('   - Troubleshooting (неисправности)');
console.log('   - FAQ (популярные вопросы)');
console.log('   - Calculator Control (управление калькулятором)');
console.log('   - Self Learning (самообучение)');
