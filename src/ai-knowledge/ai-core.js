/**
 * 3D MONOLITH AI - ЯДРО ИИ
 * Файл: ai-core.js
 * Описание: Центральное ядро ИИ с базой знаний, памятью и обучением
 */

// === ЯДРО ИИ-АССИСТЕНТА ===
window.AI_CORE = {
    version: '2.0',
    initialized: false,

    // Загрузка из localStorage
    load: function() {
        const saved = localStorage.getItem('monolith_ai_core');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.knowledgeBase = { ...this.knowledgeBase, ...data.knowledgeBase };
                this.conversationMemory = { ...this.conversationMemory, ...data.conversationMemory };
                this.learningConfig = { ...this.learningConfig, ...data.learningConfig };
                this.safetyRules = data.safetyRules || this.safetyRules;
                console.log('✅ AI Core загружен из памяти');
            } catch (e) {
                console.error('❌ Ошибка загрузки AI Core:', e);
            }
        }
        this.initialized = true;
        this.lastUpdated = new Date().toISOString();
    },

    // Сохранение в localStorage
    save: function() {
        if (!this.initialized) return;
        localStorage.setItem('monolith_ai_core', JSON.stringify({
            knowledgeBase: this.knowledgeBase,
            conversationMemory: this.conversationMemory,
            learningConfig: this.learningConfig,
            safetyRules: this.safetyRules,
            lastUpdated: new Date().toISOString()
        }));
        console.log('💾 AI Core сохранён');
    },

    // Базовая структура
    knowledgeBase: {
        materials: {
            "PLA": { temp: "190-220°C", bed: "50-60°C", issues: ["Хрупкость"] },
            "ABS": { temp: "230-250°C", bed: "90-110°C", issues: ["Отслоение"] },
            "PETG": { temp: "220-245°C", bed: "70-80°C", issues: ["Сахарная вата"] },
            "TPU": { temp: "210-230°C", bed: "50-60°C", issues: ["Гибкость"] },
            "Nylon": { temp: "240-260°C", bed: "70-90°C", issues: ["Влагопоглощение"] }
        },
        troubleshooting: [
            { problem: "Отслоение", solutions: ["Поднять температуру стола", "Использовать клей"], source: 'base' },
            { problem: "Сахарная вата", solutions: ["Настроить ретракт", "Снизить температуру"], source: 'base' },
            { problem: "Засор сопла", solutions: ["Прочистить иглой", "Холодная протяжка"], source: 'base' }
        ],
        userSolutions: [] // Сюда падают успешные решения от пользователей
    },

    conversationMemory: {
        sessions: [],      // История всех диалогов
        patterns: [],      // Выученные паттерны вопросов
        successfulAnswers: [] // Ответы с высоким рейтингом
    },

    learningConfig: {
        autoLearn: true,       // Авто-обучение включено
        minConfidence: 0.8,    // Мин. уверенность для запоминания
        feedbackThreshold: 4,  // Мин. рейтинг для сохранения
        maxSessions: 100       // Максимум сессий в памяти
    },

    safetyRules: [
        { trigger: ["выключить", "розетка", "питани"], context: ["горяч", "температур"], block: true },
        { trigger: ["открутить", "снять", "разобрать"], context: ["горяч", "сопло", "хотэнд"], block: true },
        { trigger: ["трогать", "касаться"], context: ["горяч", "сопло", "стол"], block: true }
    ],

    blockedTopics: ["политика", "еда", "рецепты", "медицина", "религия"]
};

// RAG Движок (Поиск в Базе Знаний)
window.AI_RAG = {
    search: function(query) {
        const lower = query.toLowerCase();
        let context = '';

        // 1. Поиск в материалах
        for (const [mat, data] of Object.entries(window.AI_CORE.knowledgeBase.materials)) {
            if (lower.includes(mat.toLowerCase())) {
                context += `📌 МАТЕРИАЛ ${mat}:\n`;
                context += `Температура: ${data.temp}, Стол: ${data.bed}\n`;
                context += `Проблемы: ${data.issues.join(', ')}\n\n`;
            }
        }

        // 2. Поиск в troubleshooting
        const problems = window.AI_CORE.knowledgeBase.troubleshooting.filter(p =>
            p.problem.toLowerCase().includes(lower) ||
            p.solutions.some(s => s.toLowerCase().includes(lower))
        );

        if (problems.length > 0) {
            context += '🔧 НАЙДЕННЫЕ РЕШЕНИЯ:\n';
            problems.forEach(p => {
                context += `- ${p.problem}: ${p.solutions.join('; ')}\n`;
            });
            context += '\n';
        }

        // 3. Поиск в выученных паттернах
        const patterns = window.AI_CORE.conversationMemory.patterns.filter(p =>
            this.similarity(p.question, query) > 0.6
        ).slice(0, 3);

        if (patterns.length > 0) {
            context += '💡 ИЗ ОПЫТА ПОЛЬЗОВАТЕЛЕЙ:\n';
            patterns.forEach(p => {
                context += `- Вопрос: ${p.question.substring(0, 50)}...\n`;
                context += `  Решение: ${p.answer.substring(0, 100)}...\n`;
            });
            context += '\n';
        }

        // 4. Поиск в пользовательских решениях
        const userSolutions = window.AI_CORE.knowledgeBase.userSolutions.filter(s =>
            s.problem.toLowerCase().includes(lower)
        ).slice(0, 2);

        if (userSolutions.length > 0) {
            context += '⭐ РЕШЕНИЯ ОТ ПОЛЬЗОВАТЕЛЕЙ:\n';
            userSolutions.forEach(s => {
                context += `- ${s.problem}: ${s.solution}\n`;
                context += `  Рейтинг: ${'⭐'.repeat(s.rating)} (${s.count} раз)\n`;
            });
            context += '\n';
        }

        return context || 'Нет точных данных в базе. Отвечай как инженер.';
    },

    // Оценка схожести текстов (косинусное сходство)
    similarity: function(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size || 0;
    }
};

// Проверка безопасности с учётом обучения
window.validateSafetyResponse = function(userQuery, aiResponse) {
    const query = userQuery.toLowerCase();
    const response = aiResponse.toLowerCase();

    for (const rule of window.AI_CORE.safetyRules) {
        const queryMatch = rule.trigger.some(t => query.includes(t));
        const contextMatch = rule.context.some(c => query.includes(c) || response.includes(c));

        if (queryMatch && contextMatch && rule.block) {
            return {
                safe: false,
                message: '⚠️ ОПАСНО: Это действие может повредить оборудование или привести к травме.',
                blocked: true
            };
        }
    }

    // Проверка на запрещённые темы
    for (const topic of window.AI_CORE.blockedTopics) {
        if (query.includes(topic)) {
            return {
                safe: false,
                message: '❌ Я не обсуждаю эту тему. Я специализируюсь только на 3D-печати.',
                blocked: true
            };
        }
    }

    return { safe: true, message: aiResponse };
};

// Экспорт базы знаний
window.exportAIKnowledge = function() {
    const blob = new Blob([JSON.stringify(window.AI_CORE.knowledgeBase, null, 2)], 
                          { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_knowledge_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    console.log('📤 База знаний экспортирована');
};

// Импорт базы знаний
window.importAIKnowledge = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                window.AI_CORE.knowledgeBase = { 
                    ...window.AI_CORE.knowledgeBase, 
                    ...data 
                };
                window.AI_CORE.save();
                alert('✅ База знаний импортирована!');
            } catch (err) {
                alert('❌ Ошибка импорта: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Статистика ИИ
window.showAILearningStats = function() {
    if (!window.AI_CORE || !window.AI_CORE.initialized) {
        alert('ℹ️ AI Core ещё не инициализирован');
        return;
    }

    const core = window.AI_CORE;
    const memory = core.conversationMemory;

    const stats = `
🤖 СТАТИСТИКА ИИ-АССИСТЕНТА
━━━━━━━━━━━━━━━━━━━━━━━
📚 База знаний:
   • Материалы: ${Object.keys(core.knowledgeBase.materials).length}
   • Проблемы: ${core.knowledgeBase.troubleshooting.length}
   • Решения от пользователей: ${core.knowledgeBase.userSolutions.length}

💾 Память:
   • Всего диалогов: ${memory.sessions.length}
   • Выученных паттернов: ${memory.patterns.length}
   • Успешных ответов: ${memory.successfulAnswers.length}

⚙️ Настройки:
   • Авто-обучение: ${core.learningConfig.autoLearn ? '✅ ВКЛ' : '❌ ВЫКЛ'}
   • Мин. уверенность: ${core.learningConfig.minConfidence}
   • Последнее обновление: ${core.lastUpdated ? new Date(core.lastUpdated).toLocaleString('ru-RU') : 'Никогда'}
    `;

    alert(stats);
};

// Автозагрузка при старте
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AI_CORE.load();
        console.log('🤖 AI Core инициализирован');
    });
} else {
    window.AI_CORE.load();
    console.log('🤖 AI Core инициализирован');
}

console.log('✅ AI Core модуль загружен');
