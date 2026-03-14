/**
 * 3D MONOLITH AI - МОДУЛЬ САМООБУЧЕНИЯ v2
 * Файл: self-learning.js
 * Описание: Обучение через диалоги с обратной связью (👍/👎)
 */

window.AI_LEARNING = window.AI_LEARNING || {
    // Текущая сессия
    currentSession: null,

    // База обученных действий
    learnedActions: [],

    // Статистика
    stats: {
        totalLearned: 0,
        todayLearned: 0,
        lastLearned: null,
        totalSessions: 0,
        successfulSessions: 0
    },

    // Настройки
    config: {
        enabled: true,
        autoSave: true,
        minConfidence: 0.7,
        maxHistory: 1000
    }
};

// Инициализация
window.AI_LEARNING.init = function() {
    console.log('🧠 AI Self-Learning v2 модуль инициализирован');

    // Загружаем сохраненные данные
    this.loadLearnedData();

    // Отслеживаем действия пользователя
    this.trackUserActions();

    // Показываем статистику
    console.log('📊 Статистика обучения:', this.stats);
};

// Начало новой сессии диалога
window.AI_LEARNING.startSession = function() {
    this.currentSession = {
        id: 'session_' + Date.now(),
        startTime: new Date().toISOString(),
        messages: [],
        topic: null,
        resolved: false,
        rating: null
    };
    console.log('🆕 Новая сессия:', this.currentSession.id);
};

// Запись сообщения в сессию
window.AI_LEARNING.logMessage = function(role, content, metadata = {}) {
    if (!this.currentSession) this.startSession();

    this.currentSession.messages.push({
        role: role, // 'user' или 'assistant'
        content: content,
        timestamp: new Date().toISOString(),
        metadata: metadata // { material: 'PLA', printer: 'Bambu' }
    });

    // Авто-анализ темы
    if (role === 'user' && !this.currentSession.topic) {
        this.currentSession.topic = this.detectTopic(content);
    }
};

// Определение темы вопроса
window.AI_LEARNING.detectTopic = function(text) {
    const lower = text.toLowerCase();
    if (lower.includes('температур')) return 'temperature';
    if (lower.includes('отслоен') || lower.includes('адгез')) return 'adhesion';
    if (lower.includes('материал')) return 'material';
    if (lower.includes('скорост')) return 'speed';
    if (lower.includes('слой') || lower.includes('толщин')) return 'layer';
    if (lower.includes('заполнен') || lower.includes('инфилл')) return 'infill';
    if (lower.includes('принтер')) return 'printer';
    return 'general';
};

// Завершение сессии с оценкой
window.AI_LEARNING.endSession = function(rating = 5) {
    if (!this.currentSession) {
        console.warn('⚠️ Нет активной сессии');
        return;
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.rating = rating;
    this.currentSession.resolved = rating >= 4;

    this.stats.totalSessions++;
    if (this.currentSession.resolved) {
        this.stats.successfulSessions++;
    }

    // Сохранение в память AI_CORE
    if (window.AI_CORE && window.AI_CORE.initialized) {
        window.AI_CORE.conversationMemory.sessions.push(this.currentSession);

        // Если решение успешное — учимся
        if (this.currentSession.resolved && window.AI_CORE.learningConfig.autoLearn) {
            this.extractKnowledge(this.currentSession);
        }

        // Ограничиваем историю
        if (window.AI_CORE.conversationMemory.sessions.length > window.AI_CORE.learningConfig.maxSessions) {
            window.AI_CORE.conversationMemory.sessions.shift();
        }

        window.AI_CORE.save();
    }

    console.log(`✅ Сессия завершена с рейтингом: ${rating}/5`);
    this.currentSession = null;
};

// Извлечение знаний из успешной сессии
window.AI_LEARNING.extractKnowledge = function(session) {
    const lastUserMsg = session.messages.filter(function(m) { return m.role === 'user'; }).pop();
    const lastAiMsg = session.messages.filter(function(m) { return m.role === 'assistant'; }).pop();

    if (!lastUserMsg || !lastAiMsg) {
        console.warn('⚠️ Нет сообщений для извлечения знаний');
        return;
    }

    // Создаём паттерн "Вопрос → Решение"
    const pattern = {
        id: 'pattern_' + Date.now(),
        question: lastUserMsg.content,
        answer: lastAiMsg.content,
        topic: session.topic,
        confidence: session.rating / 5,
        createdAt: new Date().toISOString(),
        usageCount: 0
    };

    if (window.AI_CORE) {
        window.AI_CORE.conversationMemory.patterns.push(pattern);

        // Если паттерн повторяется 3+ раза — добавляем в базу знаний
        var self = this;
        var similarPatterns = window.AI_CORE.conversationMemory.patterns.filter(
            function(p) { return p.topic === pattern.topic && self.similarity(p.question, pattern.question) > 0.7; }
        );

        if (similarPatterns.length >= 3) {
            this.addToKnowledgeBase(pattern);
        }
    }

    console.log('📚 Извлечено новое знание:', pattern.topic);
};

// Добавление в базу знаний
window.AI_LEARNING.addToKnowledgeBase = function(pattern) {
    if (!window.AI_CORE) return;

    // Проверяем, нет ли уже такого решения
    var self = this;
    var exists = window.AI_CORE.knowledgeBase.troubleshooting.some(
        function(t) { return self.similarity(t.problem, pattern.question) > 0.8; }
    );

    if (!exists) {
        window.AI_CORE.knowledgeBase.troubleshooting.push({
            problem: pattern.question,
            solutions: [pattern.answer],
            source: 'user_learning',
            confidence: pattern.confidence,
            createdAt: pattern.createdAt
        });
        console.log('✅ Добавлено в базу знаний!');
    }
};

// Простая оценка схожести текстов
window.AI_LEARNING.similarity = function(text1, text2) {
    var words1 = new Set(text1.toLowerCase().split(/\s+/));
    var words2 = new Set(text2.toLowerCase().split(/\s+/));
    var intersection = new Set([...words1].filter(function(x) { return words2.has(x); }));
    var union = new Set([...words1, ...words2]);
    return intersection.size / union.size || 0;
};

// Загрузка обученных данных
window.AI_LEARNING.loadLearnedData = function() {
    try {
        const saved = localStorage.getItem('mon_ai_learned');
        if (saved) {
            const data = JSON.parse(saved);
            this.learnedActions = data.actions || [];
            this.stats = data.stats || this.stats;
            console.log('✅ Загружено ' + this.learnedActions.length + ' обученных действий');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки обученных данных:', error);
    }
};

// Сохранение обученных данных
window.AI_LEARNING.saveLearnedData = function() {
    try {
        const data = {
            actions: this.learnedActions,
            stats: this.stats,
            updated: new Date().toISOString()
        };
        localStorage.setItem('mon_ai_learned', JSON.stringify(data));
        console.log('💾 Сохранено обученных данных:', this.learnedActions.length);
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
    }
};

// Обучение на основе действия
window.AI_LEARNING.learnAction = function(actionType, data) {
    if (!this.config.enabled) return;

    const action = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: actionType,
        data: data,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('ru-RU')
    };

    // Добавляем в базу
    this.learnedActions.push(action);
    this.stats.totalLearned++;
    this.stats.todayLearned++;
    this.stats.lastLearned = new Date().toISOString();

    // Очищаем старые записи
    if (this.learnedActions.length > this.config.maxHistory) {
        this.learnedActions = this.learnedActions.slice(-this.config.maxHistory);
    }

    // Автоматически сохраняем
    if (this.config.autoSave) {
        this.saveLearnedData();
    }

    console.log('🧠 ИИ научился: ' + actionType, data);
};

// Отслеживание действий пользователя
window.AI_LEARNING.trackUserActions = function() {
    var self = this;

    // Отслеживаем изменения в калькуляторе
    var trackedElements = [
        'printer-select',
        'tech',
        'mat',
        'layer',
        'infill',
        'waste',
        'urgent',
        'modelling',
        'electricity-rate'
    ];

    trackedElements.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                // ❌ НЕ отслеживаем если загружен G-код
                if (window.isGCodeMode) {
                    console.log('ℹ️ G-код режим — изменение', id, 'пропущено');
                    return;
                }
                self.learnAction('calculator_change', {
                    element: id,
                    value: this.value,
                    timestamp: Date.now()
                });
            });
        }
    });

    // Отслеживаем загрузку моделей
    var fileInput = document.getElementById('f-inp');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                self.learnAction('model_loaded', {
                    fileName: this.files[0].name,
                    fileSize: this.files[0].size,
                    timestamp: Date.now()
                });
            }
        });
    }

    // Отслеживаем добавление в коробку
    var addToBoxBtn = document.querySelector('button[onclick="addToBox()"]');
    if (addToBoxBtn) {
        addToBoxBtn.addEventListener('click', function() {
            self.learnAction('add_to_box', {
                timestamp: Date.now()
            });
        });
    }
    
    console.log('👁️ AI отслеживает действия пользователя');
};

// Обучение на основе действия
window.AI_LEARNING.learnAction = function(actionType, data) {
    if (!this.config.enabled) return;
    
    const action = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: actionType,
        data: data,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString('ru-RU')
    };
    
    // Добавляем в базу
    this.learnedActions.push(action);
    this.stats.totalLearned++;
    this.stats.todayLearned++;
    this.stats.lastLearned = new Date().toISOString();
    
    // Очищаем старые записи
    if (this.learnedActions.length > this.config.maxHistory) {
        this.learnedActions = this.learnedActions.slice(-this.config.maxHistory);
    }
    
    // Автоматически сохраняем
    if (this.config.autoSave) {
        this.saveLearnedData();
    }
    
    console.log(`🧠 ИИ научился: ${actionType}`, data);
};

// Анализ паттернов поведения
window.AI_LEARNING.analyzePatterns = function() {
    const patterns = {
        popularPrinters: {},
        popularMaterials: {},
        popularLayers: {},
        popularInfill: {},
        averagePrintTime: 0,
        peakHours: {}
    };

    // Анализируем действия
    this.learnedActions.forEach(function(action) {
        if (action.type === 'calculator_change') {
            var el = action.data.element;
            var val = action.data.value;

            if (el === 'printer-select') {
                patterns.popularPrinters[val] = (patterns.popularPrinters[val] || 0) + 1;
            }
            if (el === 'mat') {
                patterns.popularMaterials[val] = (patterns.popularMaterials[val] || 0) + 1;
            }
            if (el === 'layer') {
                patterns.popularLayers[val] = (patterns.popularLayers[val] || 0) + 1;
            }
            if (el === 'infill') {
                patterns.popularInfill[val] = (patterns.popularInfill[val] || 0) + 1;
            }
        }
    });

    return patterns;
};

// Получение рекомендаций на основе обучения
window.AI_LEARNING.getRecommendations = function() {
    var patterns = this.analyzePatterns();
    var recommendations = [];

    // Находим самый популярный принтер
    var topPrinter = Object.entries(patterns.popularPrinters)
        .sort(function(a, b) { return b[1] - a[1]; })[0];

    if (topPrinter && topPrinter[1] > 5) {
        recommendations.push({
            type: 'printer',
            text: 'Чаще всего вы используете принтер ' + topPrinter[0] + '. Выбрать его?',
            action: function() {
                var select = document.getElementById('printer-select');
                if (select) select.value = topPrinter[0];
            }
        });
    }

    // Находим самый популярный материал
    var topMaterial = Object.entries(patterns.popularMaterials)
        .sort(function(a, b) { return b[1] - a[1]; })[0];

    if (topMaterial && topMaterial[1] > 5) {
        recommendations.push({
            type: 'material',
            text: 'Популярный материал: ' + topMaterial[0] + '. Использовать его?',
            action: function() {
                var select = document.getElementById('mat');
                if (select) select.value = topMaterial[0];
            }
        });
    }
    
    return recommendations;
};

// Очистка обученных данных
window.AI_LEARNING.clearLearnedData = function() {
    if (confirm('Очистить все обученные данные ИИ?')) {
        this.learnedActions = [];
        this.stats = {
            totalLearned: 0,
            todayLearned: 0,
            lastLearned: null
        };
        localStorage.removeItem('mon_ai_learned');
        console.log('🗑️ Обученные данные очищены');
        return true;
    }
    return false;
};

// Экспорт обученных данных
window.AI_LEARNING.exportLearnedData = function() {
    const data = {
        version: '1.0',
        exported: new Date().toISOString(),
        stats: this.stats,
        actions: this.learnedActions,
        patterns: this.analyzePatterns()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_learned_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Импорт обученных данных
window.AI_LEARNING.importLearnedData = function(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        this.learnedActions = data.actions || [];
        this.stats = data.stats || this.stats;
        this.saveLearnedData();
        console.log('✅ Импортировано обученных данных:', this.learnedActions.length);
        return true;
    } catch (error) {
        console.error('❌ Ошибка импорта:', error);
        return false;
    }
};

// === ГЕНЕРАЦИЯ ОТВЕТА ДЛЯ ДОМОВИКА ===
window.AI_LEARNING.generateResponse = function(userText) {
    const lower = userText.toLowerCase();
    const recommendations = this.analyzePatterns();

    // 0. Приветствие и общие вопросы
    if (lower.includes('привет') || lower.includes('здравствуй')) {
        return {
            type: 'info',
            text: 'Привет! Я Домовик-Артист. Умею считать стоимость печати, подбирать материалы и настройки. Спрашивай!'
        };
    }

    if (lower.includes('что умеешь') || lower.includes('что ты умеешь') || lower.includes('что можешь') || lower.includes('твои функции')) {
        return {
            type: 'info',
            text: 'Я умею:\n• Считать стоимость 3D печати\n• Подбирать материалы и настройки\n• Рекомендовать температуру и скорость\n• Отвечать на вопросы о 3D печати\n\nСпроси: "какая температура для PLA?" или "подбери материал"'
        };
    }

    if (lower.includes('кто ты') || lower.includes('как тебя зовут')) {
        return {
            type: 'info',
            text: 'Я Домовик-Артист — автономный интеллект студии 3D печати. Помогаю с расчётами и настройками!'
        };
    }

    // 1. Проверка на команды действий
    if (lower.includes('печать') || lower.includes('начать') || lower.includes('запустить') || lower.includes('посчитать')) {
        return {
            type: 'action',
            text: 'Запускаю подготовку к печати...',
            action: function() {
                const btn = document.querySelector('#startPrint, .start-print, button[data-action="print"]');
                if (btn) btn.click();
            }
        };
    }

    if (lower.includes('материал') || lower.includes('пластик') || lower.includes('выбери материал')) {
        return {
            type: 'action',
            text: 'Подбираю оптимальный материал...',
            action: function() {
                const matSelect = document.getElementById('mat');
                if (matSelect && recommendations[0]) {
                    matSelect.value = recommendations[0].text.includes('Популярный')
                        ? recommendations[0].text.match(/: (.+)\./)[1]
                        : 'PLA';
                }
            }
        };
    }

    if (lower.includes('температур') || lower.includes('градус') || lower.includes('нагрев')) {
        return {
            type: 'action',
            text: 'Настраиваю температуру...',
            action: function() {
                const tempInput = document.getElementById('nozzle_temp, .temp-input');
                if (tempInput) tempInput.value = 210;
            }
        };
    }

    if (lower.includes('очист') || lower.includes('сброс') || lower.includes('очистить')) {
        return {
            type: 'action',
            text: 'Очищаю форму...',
            action: function() {
                const clearBtn = document.querySelector('#clearForm, .clear-form, button[type="reset"]');
                if (clearBtn) clearBtn.click();
            }
        };
    }

    if (lower.includes('настройк') || lower.includes('параметр') || lower.includes('открой настройк')) {
        return {
            type: 'action',
            text: 'Открываю настройки...',
            action: function() {
                const settingsBtn = document.querySelector('#settingsBtn, .settings-btn, [data-tab="settings"]');
                if (settingsBtn) settingsBtn.click();
            }
        };
    }

    // 2. Проверка на вопросы
    if (lower.includes('как') || lower.includes('что') || lower.includes('?') || lower.includes('сколько') || lower.includes('какой') || lower.includes('какая')) {
        return {
            type: 'info',
            text: this.getAnswerForQuestion(lower)
        };
    }

    // 3. Рекомендации
    if (recommendations.length > 0) {
        return {
            type: 'recommendation',
            text: recommendations[0].text
        };
    }

    // 4. Ответ по умолчанию
    return {
        type: 'info',
        text: 'Я пока учусь. Попробуйте спросить: "что ты умеешь?", "какая температура для PLA?" или "подбери материал".'
    };
};

// Помощник для ответов на вопросы
window.AI_LEARNING.getAnswerForQuestion = function(question) {
    if (question.includes('температур') || question.includes('градус') || question.includes('нагрев')) {
        return 'Для PLA: 200-220°C, для PETG: 230-250°C, для ABS: 240-260°C. Стол: 50-60°C для PLA, 70-80°C для PETG/ABS';
    }
    if (question.includes('материал') || question.includes('выбр') || question.includes('пластик')) {
        return 'PLA — для декора (легко печатать), PETG — для прочности (уличные детали), ABS — для термостойкости (требует подогрева)';
    }
    if (question.includes('скорост')) {
        return 'Оптимально: 40-60 мм/с для качества, 80-100 мм/с для скорости. Первый слой: 20-30 мм/с';
    }
    if (question.includes('слой') || question.includes('толщин')) {
        return 'Стандарт: 0.2мм, качество: 0.1мм, черновик: 0.3мм. Высота первого слоя: 0.2-0.3мм';
    }
    if (question.includes('заполнен') || question.includes('инфилл')) {
        return '20% — стандарт, 40% — прочность, 10% — экономия. Паттерн: grid или gyroid';
    }
    if (question.includes('цена') || question.includes('стоимость') || question.includes('сколько стоит')) {
        return 'Цена зависит от материала, времени печати и амортизации. Используйте калькулятор для точного расчёта!';
    }
    if (question.includes('время') || question.includes('долго')) {
        return 'Время печати зависит от размера, заполнения и высоты слоя. Используйте слайсер для оценки';
    }
    if (question.includes('отслоен') || question.includes('отходит') || question.includes('адгез')) {
        return 'Причины: грязный стол, неправильная температура, сквозняк. Решение: спирт для стола, клей, подогрев';
    }
    if (question.includes('поддержк') || question.includes('поддержка')) {
        return 'Поддержки нужны для свесов >45°. Тип: tree (экономит материал) или normal (универсальный)';
    }
    return 'Хороший вопрос! Я рекомендую: спросите о температуре, материале, скорости или используйте калькулятор для расчёта стоимости';
};

// Автозапуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AI_LEARNING.init());
} else {
    window.AI_LEARNING.init();
}

console.log('✅ AI Self-Learning модуль загружен');
