/**
 * 3D MONOLITH AI ENGINEER
 * Локальный ИИ-ассистент для системы 3D-печати
 * Версия: 1.0.0
 * 
 * Архитектура: Гибридная система «Малая модель + Жесткая база знаний» (RAG)
 * Принцип: «Безопасность и точность важнее креативности»
 */

class AIEngineer {
    constructor() {
        // Состояние системы
        this.isLoaded = false;
        this.isLoading = false;
        this.modelPath = null;
        this.model = null;
        this.tokenizer = null;
        
        // Контекст приложения
        this.appContext = {
            currentTab: 'calculator',
            selectedPrinter: null,
            selectedMaterial: null,
            currentOrder: null,
            printers: [],
            materials: [],
            troubleshootingDB: []
        };
        
        // История чата
        this.chatHistory = [];
        this.maxHistoryLength = 20;
        
        // Система безопасности
        this.safetyLayer = new SafetyLayer();
        
        // База знаний
        this.knowledgeBase = new KnowledgeBase();
        
        // Системная инструкция (System Prompt)
        this.systemPrompt = this.buildSystemPrompt();
        
        // Callback для обновления UI
        this.onStatusChange = null;
        this.onMessageReceived = null;
    }

    /**
     * Построение системной инструкции (System Prompt)
     * Уровень 1 системы безопасности
     */
    buildSystemPrompt() {
        return `ТЫ — 3D MONOLITH AI ENGINEER, локальный ИИ-помощник оператора 3D-печати.

=== МИССИЯ ===
Твоя роль: узкопрофильный инженер-технолог и помощник оператора 3D-печати (FDM/SLA).
Твоя функция: инструментальная поддержка производства, помощь в настройке оборудования, расчете параметров и устранении неисправностей.

=== КРИТИЧЕСКИЕ ПРАВИЛА БЕЗОПАСНОСТИ (УРОВЕНЬ 1) ===
1. НИКОГДА не советуй отключать питание принтера при нагретых компонентах (сопло, стол).
2. НИКОГДА не рекомендуй разборку хотэнда без указания на необходимость полного остывания (<30°C).
3. ВСЕГДА предупреждай о токсичности материалов при работе с фотополимерами (SLA).
4. ВСЕГДА упоминай необходимые СИЗ (перчатки, очки, вентиляция) при работе с химикатами.
5. ЗАПРЕЩЕНО советовать работу с оборудованием без изучения инструкции производителя.

=== ТЕХНИЧЕСКИЕ ОГРАНИЧЕНИЯ ===
- Ты НЕ являешься разговорным собеседником на общие темы.
- Ты НЕ даешь советов вне сферы аддитивных технологий.
- Если данных недостаточно — Сообщи об этом и рекоменуй обратиться к официальной документации принтера.
- НЕ выдумывай параметры (не галлюцинируй).

=== СТИЛЬ ОТВЕТА ===
- Профессиональный, лаконичный, технически грамотный тон.
- Без излишней эмоциональности.
- Язык: русский (технический).
- Структура: кратко → детали → рекомендация.

=== ПРИОРИТЕТЫ ===
1. Безопасность оператора и оборудования
2. Точность технических данных
3. Скорость ответа
4. Полезность рекомендации

=== КОНТЕКСТ ПРИЛОЖЕНИЯ ===
Ты имеешь доступ к:
- Парку принтеров (характеристики, состояние)
- Складу материалов (остатки, свойства, цены)
- Текущему заказу (параметры расчета)
- Базе неисправностей (Проблема → Причина → Решение)

Используй эти данные для формирования релевантных ответов.`;
    }

    /**
     * Инициализация системы
     */
    async initialize() {
        if (this.isLoading) return { success: false, error: 'Уже загружается...' };
        if (this.isLoaded) return { success: true, message: 'Уже загружен' };

        this.isLoading = true;
        this.notifyStatus('loading', 'Инициализация ИИ...');

        try {
            // ПРИНУДИТЕЛЬНАЯ ЗАГРУЗКА ВСЕХ МОДУЛЕЙ БАЗЫ ЗНАНИЙ
            this.notifyStatus('loading', 'Загрузка модулей базы знаний...');
            await this.loadAllKnowledgeModules();
            
            // Загрузка базы знаний (всегда)
            this.notifyStatus('loading', 'Загрузка базы знаний...');
            await this.knowledgeBase.initialize();

            // Попытка загрузки локальной модели (автоматически)
            this.notifyStatus('loading', 'Проверка ИИ-модели...');
            const modelLoaded = await this.loadLocalModel();

            this.isLoaded = true;
            this.isLoading = false;

            const status = modelLoaded ? '🤖 Модель готова' : '📚 База знаний готова';
            this.notifyStatus('ready', status);

            return {
                success: true,
                modelLoaded: modelLoaded,
                message: modelLoaded ? 'Локальная модель TinyLlama-1.1B загружена' : 'Работа в режиме базы знаний (RAG)'
            };
        } catch (error) {
            this.isLoading = false;
            this.notifyStatus('error', `Ошибка: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Принудительная загрузка всех модулей базы знаний
     */
    async loadAllKnowledgeModules() {
        return new Promise((resolve) => {
            // Даём время на загрузку всех скриптов
            setTimeout(() => {
                console.log('📚 Проверка модулей базы знаний...');
                
                const modules = {
                    'SLA Knowledge': window.AI_SLA_KNOWLEDGE,
                    'FDM Troubleshooting': window.AI_FDM_TROUBLESHOOTING,
                    'Material Density': window.AI_MATERIAL_DENSITY,
                    'FDM Materials': window.AI_FDM_MATERIALS,
                    'Temperatures': window.AI_TEMPERATURES,
                    'Layer Height': window.AI_LAYER_HEIGHT,
                    'AI Knowledge': window.AI_KNOWLEDGE
                };
                
                let loadedCount = 0;
                for (const [name, module] of Object.entries(modules)) {
                    if (module) {
                        console.log(`✅ ${name} загружен`);
                        loadedCount++;
                    } else {
                        console.log(`⚠️ ${name} НЕ загружен`);
                    }
                }
                
                console.log(`📊 Загружено модулей: ${loadedCount}/${Object.keys(modules).length}`);
                resolve();
            }, 100);
        });
    }

    /**
     * Загрузка локальной LLM-модели
     * В данной версии ИИ работает ТОЛЬКО через базу знаний (RAG)
     * Это обеспечивает мгновенную загрузку и надёжность
     */
    async loadLocalModel() {
        // Эта версия работает без LLM - только база знаний
        // Для LLM требуется установка Electron + llama.cpp
        console.log('ℹ️ ИИ работает в режиме базы знаний (RAG)');
        console.log('📚 База знаний включает:');
        console.log('   - FDM: 25+ материалов (свойства, температуры, применение)');
        console.log('   - SLA: 7+ типов смол, настройки, пост-обработка');
        console.log('   - 8 типичных проблем FDM с решениями');
        console.log('   - Плотности и расчёты (вес, длина, стоимость)');
        console.log('   - Температуры для всех материалов');
        console.log('   - Высота слоя (влияние, правила, рекомендации)');
        console.log('   - Управление калькулятором по запросу');
        console.log('   - История расчётов');
        return false;
    }

    /**
     * Обработка сообщения от пользователя
     */
    async sendMessage(message) {
        if (!this.isLoaded && !this.knowledgeBase.isReady) {
            return {
                success: false,
                response: 'ИИ-инженер еще не готов. Пожалуйста, дождитесь загрузки.',
                type: 'error'
            };
        }

        // Проверяем быстрые команды
        const commandResponse = this.handleCommand(message);
        if (commandResponse) {
            this.addToHistory({ role: 'user', content: message, timestamp: Date.now() });
            this.addToHistory({ role: 'assistant', content: commandResponse.response, timestamp: Date.now() });
            this.notifyMessage(commandResponse);
            return commandResponse;
        }

        // ПРОВЕРЯЕМ AI VISION - вопросы о модели
        if (window.AI_VISION) {
            const visionResponse = window.AI_VISION.search(message);
            if (visionResponse) {
                this.addToHistory({ role: 'user', content: message, timestamp: Date.now() });
                const response = {
                    success: true,
                    response: visionResponse,
                    type: 'vision',
                    source: 'ai_vision'
                };
                this.addToHistory({ role: 'assistant', content: response.response, timestamp: Date.now() });
                this.notifyMessage(response);
                return response;
            }
        }

        // Проверяем режим обучения
        if (this.currentTraining) {
            const trainingResponse = this.checkTrainingAnswer(message);
            if (trainingResponse) {
                this.addToHistory({ role: 'user', content: message, timestamp: Date.now() });
                this.addToHistory({ role: 'assistant', content: trainingResponse.response, timestamp: Date.now() });

                if (trainingResponse.nextStep) {
                    this.addToHistory({ role: 'assistant', content: trainingResponse.nextStep.response, timestamp: Date.now() });
                    this.notifyMessage(trainingResponse.nextStep);
                    return trainingResponse.nextStep;
                }

                this.notifyMessage(trainingResponse);
                return trainingResponse;
            }
        }

        // Добавляем в историю
        this.addToHistory({ role: 'user', content: message, timestamp: Date.now() });

        // Уровень безопасности 4: Проверка запроса пользователя
        const safetyCheck = this.safetyLayer.validateUserInput(message);
        if (!safetyCheck.safe) {
            const warningResponse = {
                success: true,
                response: `⚠️ ПРЕДУПРЕЖДЕНИЕ БЕЗОПАСНОСТИ\n\n${safetyCheck.warning}\n\nЯ не могу выполнить этот запрос, так как он может быть опасен для вас или оборудования.`,
                type: 'safety_warning',
                blocked: true
            };
            this.addToHistory({ role: 'assistant', content: warningResponse.response, timestamp: Date.now() });
            this.notifyMessage(warningResponse);
            return warningResponse;
        }

        // Проверяем есть ли диалоговый сценарий
        const scenario = this.getDialogScenario(message);
        if (scenario) {
            // Начинаем диалоговый сценарий
            return this.startDialogScenario(scenario, message);
        }

        let aiResponse;

        // Режим с локальной моделью
        if (this.model && typeof this.model.generate === 'function') {
            aiResponse = await this.generateWithModel(message);
        } else {
            // Режим только базы знаний (RAG без LLM)
            aiResponse = await this.generateWithKnowledgeBase(message);
        }

        // Уровень безопасности 3: Валидация ответа
        const validatedResponse = this.safetyLayer.validateResponse(aiResponse.response);
        if (!validatedResponse.safe) {
            aiResponse.response = `⚠️ ОТВЕТ ЗАБЛОКИРОВАН СИСТЕМОЙ БЕЗОПАСНОСТИ\n\n${validatedResponse.warning}\n\nПожалуйста, обратитесь к официальной документации принтера или специалисту.`;
            aiResponse.type = 'safety_blocked';
        }

        // Добавляем ответ в историю
        this.addToHistory({ role: 'assistant', content: aiResponse.response, timestamp: Date.now() });

        // Уведомляем UI
        this.notifyMessage(aiResponse);

        return aiResponse;
    }

    /**
     * Вызывается когда AI Vision проанализировал модель
     */
    onModelAnalyzed(analysis) {
        console.log('🤖 ИИ получил анализ модели:', analysis);

        // Сохраняем анализ в контексте
        this.appContext.currentModel = analysis;

        // Автоматически генерируем подсказку пользователю
        const tips = this.generateModelTips(analysis);

        if (tips) {
            this.notifyMessage({
                success: true,
                response: tips,
                type: 'model_analysis',
                source: 'ai_engineer'
            });
        }
    }

    /**
     * Генерация подсказок по модели
     */
    generateModelTips(analysis) {
        if (!analysis || !analysis.recommendations) return null;

        // Генерируем только если есть важные рекомендации
        const importantTips = analysis.recommendations.filter(r =>
            r.type === 'supports' || r.type === 'orientation'
        );

        if (importantTips.length === 0) return null;

        let response = '👁️ **ИИ проанализировал вашу модель**\n\n';

        importantTips.forEach(tip => {
            response += `${tip.icon} ${tip.text}\n`;
        });

        response += '\n💡 Спросите меня: "анализ модели" для подробностей';

        return response;
    }

    /**
     * Обработка быстрых команд
     */
    handleCommand(message) {
        const trimmed = message.trim();
        
        // Команда должна начинаться с /
        if (!trimmed.startsWith('/')) {
            return null;
        }

        const parts = trimmed.slice(1).split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        const commands = {
            'help': () => this.getHelpCommand(),
            'h': () => this.getHelpCommand(),
            'temp': () => this.getTempCommand(args),
            't': () => this.getTempCommand(args),
            'material': () => this.getMaterialCommand(args),
            'mat': () => this.getMaterialCommand(args),
            'problem': () => this.getProblemCommand(args),
            'prob': () => this.getProblemCommand(args),
            'stock': () => this.getStockCommand(),
            's': () => this.getStockCommand(),
            'calc': () => this.getCalcCommand(),
            'c': () => this.getCalcCommand(),
            'history': () => this.getHistoryCommand(),
            'hist': () => this.getHistoryCommand(),
            'clear': () => this.getClearCommand(),
            'reset': () => this.getClearCommand(),
            'training': () => this.getTrainingCommand(args),
            'train': () => this.getTrainingCommand(args),
            'learn': () => this.getTrainingCommand(args)
        };

        const handler = commands[command];
        if (handler) {
            return {
                success: true,
                response: handler(),
                type: 'command',
                source: 'quick_command'
            };
        }

        return {
            success: true,
            response: `❌ Команда не найдена: /${command}\n\nВведите /help для списка команд.`,
            type: 'command_error',
            source: 'quick_command'
        };
    }

    /**
     * Команда /help
     */
    getHelpCommand() {
        return `📋 **Быстрые команды 3D MONOLITH**\n\n` +
            `**Материалы:**\n` +
            `• /temp [материал] - температура (например: /temp PLA)\n` +
            `• /mat [материал] - информация о материале\n\n` +
            `**Проблемы:**\n` +
            `• /problem [симптом] - диагностика проблемы\n\n` +
            `**Склад:**\n` +
            `• /stock - остатки материалов\n\n` +
            `**Калькулятор:**\n` +
            `• /calc - открыть калькулятор\n\n` +
            `**История:**\n` +
            `• /history - последние вопросы\n` +
            `• /clear - очистить историю\n\n` +
            `**Обучение:**\n` +
            `• /training - информация об обучении\n` +
            `• /training beginner - уровень новичка\n` +
            `• /training operator - уровень оператора\n` +
            `• /training expert - уровень эксперта\n\n` +
            `**Примеры:**\n` +
            `• /temp PLA\n` +
            `• /mat ABS\n` +
            `• /problem отслоение\n` +
            `• /training beginner`;
    }

    /**
     * Команда /temp
     */
    getTempCommand(args) {
        const materials = {
            'pla': '🌡️ **PLA (Полилактид)**\n\n• Сопло: 190-220°C\n• Стол: 50-60°C\n• Обдув: 100%\n\n💡 Начинайте с 200°C',
            'abs': '🌡️ **ABS (Акрилонитрилбутадиенстирол)**\n\n• Сопло: 230-260°C\n• Стол: 90-110°C\n• Обдув: 0%\n\n⚠️ Требуется закрытая камера!',
            'petg': '🌡️ **PETG (Полиэтилентерефталат)**\n\n• Сопло: 220-250°C\n• Стол: 70-80°C\n• Обдув: 30-50%\n\n💡 Баланс прочности и простоты',
            'tpu': '🌡️ **TPU (Термопластичный полиуретан)**\n\n• Сопло: 210-230°C\n• Стол: 40-60°C\n• Обдув: 30-50%\n\n⚠️ Печатайте медленно (20-30 мм/с)',
            'nylon': '🌡️ **Nylon (Полиамид)**\n\n• Сопло: 240-270°C\n• Стол: 70-90°C\n• Обдув: 0%\n\n⚠️ Обязательно сушите перед печатью!',
            'pc': '🌡️ **PC (Поликарбонат)**\n\n• Сопло: 260-310°C\n• Стол: 90-120°C\n• Обдув: 0%\n\n⚠️ Требуется закрытая камера!'
        };

        if (!args) {
            return `🌡️ **Температуры материалов**\n\n` +
                `Введите: /temp [материал]\n\n` +
                `Доступные:\n` +
                `• PLA - для начинающих\n` +
                `• ABS - прочный\n` +
                `• PETG - баланс\n` +
                `• TPU - гибкий\n` +
                `• Nylon - износостойкий\n` +
                `• PC - термостойкий\n\n` +
                `Пример: /temp PLA`;
        }

        const material = materials[args.toLowerCase()];
        if (material) {
            return material;
        }

        return `❌ Материал не найден: ${args}\n\nДоступные: PLA, ABS, PETG, TPU, Nylon, PC`;
    }

    /**
     * Команда /material
     */
    getMaterialCommand(args) {
        if (!args) {
            return `📦 **Материалы для 3D печати**\n\n` +
                `Введите: /mat [материал]\n\n` +
                `**FDM материалы:**\n` +
                `• PLA — для начинающих, без запаха\n` +
                `• ABS — прочный, термостойкий\n` +
                `• PETG — баланс свойств\n` +
                `• TPU — гибкий, эластичный\n` +
                `• Nylon — износостойкий\n` +
                `• PC — высокотемпературный\n\n` +
                `**SLA материалы:**\n` +
                `• Стандартная смола\n` +
                `• Прочная смола\n` +
                `• Гибкая смола\n` +
                `• Литьевая смола\n\n` +
                `Пример: /mat PLA`;
        }

        return `ℹ️ Подробная информация: /temp ${args}`;
    }

    /**
     * Команда /problem
     */
    getProblemCommand(args) {
        if (!args) {
            return `🔧 **Диагностика проблем**\n\n` +
                `Введите: /problem [симптом]\n\n` +
                `**Частые проблемы:**\n` +
                `• отслоение - углы загибаются\n` +
                `• нити - паутина на печати\n` +
                `• засор - не экструдится\n` +
                `• сдвиг - слои смещены\n` +
                `• не липнет - первый слой\n\n` +
                `Пример: /problem отслоение`;
        }

        return `🔧 Для диагностики опишите проблему подробнее или спросите:\n\n"отслоение углов PLA"\n"нити при печати PETG"\n"не липнет первый слой"`;
    }

    /**
     * Команда /stock
     */
    getStockCommand() {
        return `📦 **Склад материалов**\n\n` +
            `Для просмотра остатков откройте вкладку "Материалы"\n\n` +
            `💡 **Совет:** Добавьте материалы с ценами для расчёта стоимости печати`;
    }

    /**
     * Команда /calc
     */
    getCalcCommand() {
        return `🎛️ **Калькулятор печати**\n\n` +
            `Откройте вкладку "Калькулятор" для:\n` +
            `• Расчёта стоимости\n` +
            `• Выбора материала\n` +
            `• Настройки параметров\n\n` +
            `💡 Загрузите STL модель для расчёта`;
    }

    /**
     * Команда /history
     */
    getHistoryCommand() {
        const history = this.chatHistory.slice(-10);
        
        if (history.length === 0) {
            return `📋 **История пуста**\n\nЗадайте вопрос чтобы начать диалог.`;
        }

        let response = `📋 **Последние вопросы:**\n\n`;
        
        history.forEach((msg, index) => {
            if (msg.role === 'user') {
                const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
                response += `• [${time}] ${msg.content}\n`;
            }
        });
        
        return response || `📋 **История пуста**`;
    }

    /**
     * Команда /clear
     */
    getClearCommand() {
        this.chatHistory = [];
        return `✅ **История очищена**\n\nНачните новый диалог.`;
    }

    /**
     * Команда /training
     */
    getTrainingCommand(args) {
        if (!args) {
            return `🎓 **Режим обучения 3D MONOLITH**\n\n` +
                `**Доступные уровни**:\n` +
                `• /training beginner — новичок (5 шагов)\n` +
                `• /training operator — оператор (5 шагов)\n` +
                `• /training expert — эксперт (5 шагов)\n\n` +
                `**Формат обучения**:\n` +
                `📖 Теория → 🎯 Практика → 🧠 Тест\n\n` +
                `**Награды**:\n` +
                `🥉 Сертификат новичка\n` +
                `🥈 Сертификат оператора\n` +
                `🥇 Сертификат инженера\n\n` +
                `Введите /training beginner для начала!`;
        }

        const level = args.toLowerCase();
        if (['beginner', 'operator', 'expert'].includes(level)) {
            return this.startTrainingMode(level);
        }

        return `❌ Неверный уровень: ${args}\n\nДоступные: beginner, operator, expert`;
    }

    /**
     * СИСТЕМА ОБУЧЕНИЯ - Логические цепочки
     */

    /**
     * Запуск режима обучения
     */
    startTrainingMode(level) {
        const trainingPrograms = {
            'beginner': this.getBeginnerProgram(),
            'operator': this.getOperatorProgram(),
            'expert': this.getExpertProgram()
        };

        const program = trainingPrograms[level] || trainingPrograms['beginner'];
        
        this.currentTraining = {
            level: level,
            program: program,
            currentStep: 0,
            completed: [],
            score: 0
        };

        return this.showTrainingStep(0);
    }

    /**
     * Программа для новичков
     */
    getBeginnerProgram() {
        return [
            {
                id: '1.1',
                title: '🎓 Что такое 3D печать?',
                theory: `**3D печать** — это процесс создания объёмных объектов путём послойного нанесения материала.\n\n**Основные технологии**:\n• **FDM** — наплавление пластика (дешёво, просто)\n• **SLA** — отверждение смолы (точно, дорого)`,
                practice: null,
                quiz: {
                    question: 'Какая технология дешевле для начала?',
                    options: ['FDM', 'SLA', 'Одинаково'],
                    correct: 0,
                    explanation: '✅ Верно! FDM принтеры дешевле и проще в эксплуатации'
                },
                next: '1.2'
            },
            {
                id: '1.2',
                title: '🖨️ Типы принтеров: FDM vs SLA',
                theory: `**FDM принтеры**:\n• Печатают пластиком (филамент)\n• Температура: 190-300°C\n• Точность: 0.1-0.3 мм\n• Цена: 15-100 тыс.₽\n\n**SLA принтеры**:\n• Печатают смолой (фотополимер)\n• UV-отверждение\n• Точность: 0.01-0.05 мм\n• Цена: 30-200 тыс.₽`,
                practice: null,
                quiz: {
                    question: 'Какая технология точнее?',
                    options: ['FDM', 'SLA', 'Одинаково'],
                    correct: 1,
                    explanation: '✅ Верно! SLA обеспечивает точность до 0.01 мм'
                },
                next: '1.3'
            },
            {
                id: '1.3',
                title: '📦 Основные материалы',
                theory: `**Популярные материалы FDM**:\n\n• **PLA** — для начинающих (190-220°C)\n• **ABS** — прочный (230-260°C)\n• **PETG** — баланс (220-250°C)\n• **TPU** — гибкий (210-230°C)\n\n**SLA материалы**:\n• Стандартная смола\n• Прочная смола\n• Гибкая смола`,
                practice: {
                    type: 'material_select',
                    task: 'Выберите материал для детали на улицу',
                    options: ['PLA', 'ABS', 'PETG', 'TPU'],
                    correct: 'PETG',
                    explanation: '✅ PETG не боится UV и влаги!'
                },
                quiz: null,
                next: '1.4'
            },
            {
                id: '1.4',
                title: '⚙️ Базовые настройки',
                theory: `**Ключевые параметры**:\n\n• **Температура сопла** — плавление пластика\n• **Температура стола** — адгезия\n• **Скорость** — качество vs время\n• **Заполнение** — прочность (20-80%)`,
                practice: {
                    type: 'temp_calc',
                    task: 'Рассчитайте температуру для PLA',
                    min: 190,
                    max: 220,
                    correct: 200,
                    explanation: '✅ 200°C — оптимально для PLA!'
                },
                quiz: null,
                next: '1.5'
            },
            {
                id: '1.5',
                title: '✅ Итоговый тест',
                theory: null,
                practice: null,
                quiz: {
                    question: 'Какой материал выбрать для уличной детали?',
                    options: ['PLA', 'PETG', 'TPU'],
                    correct: 1,
                    explanation: '✅ PETG устойчив к UV и влаге!'
                },
                next: 'level_complete',
                isFinal: true
            }
        ];
    }

    /**
     * Программа для операторов
     */
    getOperatorProgram() {
        return [
            {
                id: '2.1',
                title: '🌡️ Температурные режимы',
                theory: `**Точная настройка температур**:\n\n• **Первый слой**: +5-10°C (адгезия)\n• **Обычная печать**: базовая температура\n• **Детали**: -5-10°C (качество)\n\n**Проблемы**:\n• Слишком горячо: нити, подтёки\n• Слишком холодно: недоэкструзия`,
                practice: {
                    type: 'temp_diagnosis',
                    task: 'Нити при печати PLA. Что делать?',
                    options: ['Поднять температуру', 'Снизить температуру', 'Увеличить скорость'],
                    correct: 1,
                    explanation: '✅ Снижение температуры уменьшит нити!'
                },
                quiz: null,
                next: '2.2'
            },
            {
                id: '2.2',
                title: '📐 Калибровка стола',
                theory: `**Правильная калибровка**:\n\n1. Нагрейте стол до рабочей температуры\n2. Используйте лист бумаги (0.1 мм)\n3. Регулируйте винты по углам\n4. Проверьте центр\n\n**Признаки**:\n• ✅ Бумага движется с лёгким сопротивлением\n• ❌ Бумага не движется — слишком низко\n• ❌ Бумага падает — слишком высоко`,
                practice: {
                    type: 'leveling_sim',
                    task: 'Определите проблему: бумага падает',
                    options: ['Слишком высоко', 'Слишком низко', 'Нормально'],
                    correct: 0,
                    explanation: '✅ Нужно опустить стол!'
                },
                quiz: null,
                next: '2.3'
            },
            {
                id: '2.3',
                title: '⚡ Настройка скоростей',
                theory: `**Рекомендуемые скорости**:\n\n• **Первый слой**: 20-30 мм/с\n• **Стенки**: 40-50 мм/с\n• **Заполнение**: 50-60 мм/с\n• **Перемещения**: 100-150 мм/с\n\n**Зависимость от материала**:\n• PLA: 50-60 мм/с\n• ABS: 30-50 мм/с\n• PETG: 30-40 мм/с\n• TPU: 15-25 мм/с`,
                practice: {
                    type: 'speed_calc',
                    task: 'Выберите скорость для первого слоя TPU',
                    options: ['50 мм/с', '30 мм/с', '20 мм/с'],
                    correct: 2,
                    explanation: '✅ 20 мм/с — оптимально для гибкого материала!'
                },
                quiz: null,
                next: '2.4'
            },
            {
                id: '2.4',
                title: '🔧 Решение проблем',
                theory: `**Диагностика проблем**:\n\n**Отслоение**:\n• Проверьте температуру стола\n• Используйте адгезив\n• Добавьте юбку\n\n**Нити**:\n• Настройте ретракт\n• Снизьте температуру\n• Увеличьте обдув\n\n**Сдвиг слоёв**:\n• Проверьте ремни\n• Снизьте ускорения`,
                practice: {
                    type: 'problem_diagnosis',
                    task: 'Углы детали загибаются вверх. Что это?',
                    options: ['Отслоение', 'Нити', 'Засор'],
                    correct: 0,
                    explanation: '✅ Это отслоение (warping)!'
                },
                quiz: null,
                next: '2.5'
            },
            {
                id: '2.5',
                title: '✅ Практический экзамен',
                theory: null,
                practice: {
                    type: 'full_diagnosis',
                    task: 'Клиент жалуется: "Деталь отслоилась, печатал ABS без камеры"',
                    answer: 'ABS требует закрытую камеру и температуру стола 90-110°C',
                    keywords: ['камер', 'температур', 'стол', '90', '100', '110'],
                    explanation: '✅ Правильно! ABS требует закрытую камеру!'
                },
                quiz: null,
                next: 'level_complete',
                isFinal: true
            }
        ];
    }

    /**
     * Программа для экспертов
     */
    getExpertProgram() {
        return [
            {
                id: '3.1',
                title: '📊 Оптимизация печати',
                theory: `**Методы оптимизации**:\n\n• **Адаптивные слои** — меньше слоёв где не нужно\n• **Переменная скорость** — быстрее на прямых\n• **Оптимизация путей** — меньше перемещений\n• **Правильное ориентирование** — прочность vs качество`,
                practice: {
                    type: 'optimize_case',
                    task: 'Деталь печатается 10 часов. Как ускорить?',
                    options: [
                        'Увеличить слой с 0.2 до 0.3 мм',
                        'Увеличить скорость на 50%',
                        'Оба варианта'
                    ],
                    correct: 2,
                    explanation: '✅ Оба метода дадут ускорение!'
                },
                quiz: null,
                next: '3.2'
            },
            {
                id: '3.2',
                title: '💰 Расчёт стоимости',
                theory: `**Формула расчёта**:\n\n**Стоимость** = Материал + Электричество + Работа + Амортизация\n\n**Пример**:\n• Материал: 50г × 2₽/г = 100₽\n• Электричество: 0.3кВт × 5ч × 5₽ = 7.5₽\n• Работа: 30 мин × 500₽/ч = 250₽\n• Амортизация: 10% = 35₽\n**Итого**: 392.5₽`,
                practice: {
                    type: 'cost_calc',
                    task: 'Рассчитайте стоимость: 100г PLA, 10 часов, работа 1 час',
                    formula: 'material_cost + electricity + labor',
                    correct: 750,
                    tolerance: 50,
                    explanation: '✅ Правильный расчёт!'
                },
                quiz: null,
                next: '3.3'
            },
            {
                id: '3.3',
                title: '👥 Работа с клиентами',
                theory: `**Этапы работы**:\n\n1. **ТЗ от клиента** — что нужно?\n2. **Оценка** — стоимость и сроки\n3. **Согласование** — утверждение\n4. **Печать** — контроль качества\n5. **Постобработка** — поддержка, шлифовка\n6. **Выдача** — проверка клиентом`,
                practice: {
                    type: 'client_case',
                    task: 'Клиент хочет деталь "как можно дешевле". Что предложите?',
                    answer: 'PLA с заполнением 15-20%, слой 0.3мм, без постобработки',
                    keywords: ['pla', 'заполнен', 'слой', '0.3', 'дешев'],
                    explanation: '✅ Оптимально для бюджетной печати!'
                },
                quiz: null,
                next: '3.4'
            },
            {
                id: '3.4',
                title: '📈 Бизнес-процессы',
                theory: `**Ключевые метрики**:\n\n• **Загрузка принтеров** — % времени печати\n• **ROI** — окупаемость (6-12 мес)\n• **Средний чек** — доход с заказа\n• **Повторные клиенты** — % возвратов\n\n**Цели**:\n• Загрузка: >60%\n• ROI: <12 мес\n• Повторы: >40%`,
                practice: {
                    type: 'business_calc',
                    task: 'Принтер стоит 100к, приносит 15к/мес. ROI?',
                    formula: 'cost / monthly_income',
                    correct: 6.67,
                    tolerance: 1,
                    explanation: '✅ 6.7 месяцев — отличный ROI!'
                },
                quiz: null,
                next: '3.5'
            },
            {
                id: '3.5',
                title: '✅ Финальный проект',
                theory: null,
                practice: {
                    type: 'full_project',
                    task: 'Рассчитайте полный заказ: деталь 200г PETG, 15 часов, клиент хочет быстро и качественно',
                    answer: 'PETG, слой 0.2мм, заполнение 40%, скорость 40мм/с, стоимость ~1500₽, срок 2 дня',
                    keywords: ['petg', '0.2', '40', '1500', '2'],
                    explanation: '✅ Отличный расчёт для качественного заказа!'
                },
                quiz: null,
                next: 'level_complete',
                isFinal: true
            }
        ];
    }

    /**
     * Показ шага обучения
     */
    showTrainingStep(stepIndex) {
        const training = this.currentTraining;
        if (!training || stepIndex >= training.program.length) {
            return this.completeTrainingLevel();
        }

        const step = training.program[stepIndex];
        training.currentStep = stepIndex;

        let response = `**${step.title}**\n\n`;

        if (step.theory) {
            response += `📖 **Теория**:\n${step.theory}\n\n`;
        }

        if (step.practice) {
            response += `🎯 **Практика**:\n${step.practice.task}\n\n`;
            
            if (step.practice.options) {
                step.practice.options.forEach((opt, i) => {
                    response += `${i + 1}. ${opt}\n`;
                });
                response += `\nВведите номер ответа:`;
            } else if (step.practice.type.includes('calc')) {
                response += `Введите ваш расчёт:`;
            } else {
                response += `Ваш ответ:`;
            }
        }

        if (step.quiz) {
            response += `\n🧠 **Вопрос**:\n${step.quiz.question}\n\n`;
            step.quiz.options.forEach((opt, i) => {
                response += `${i + 1}. ${opt}\n`;
            });
            response += `\nВведите номер ответа:`;
        }

        return {
            success: true,
            response: response,
            type: 'training_step',
            source: 'training_mode',
            trainingStep: stepIndex,
            totalSteps: training.program.length
        };
    }

    /**
     * Проверка ответа в обучении
     */
    checkTrainingAnswer(answer) {
        const training = this.currentTraining;
        if (!training) return null;

        const step = training.program[training.currentStep];
        if (!step) return null;

        let isCorrect = false;
        let explanation = '';

        // Проверка quiz
        if (step.quiz) {
            const answerNum = parseInt(answer) - 1;
            isCorrect = answerNum === step.quiz.correct;
            explanation = step.quiz.explanation;
        }

        // Проверка practice
        if (step.practice) {
            if (step.practice.options) {
                const answerNum = parseInt(answer) - 1;
                isCorrect = step.practice.options[answerNum] === step.practice.correct;
                explanation = step.practice.explanation;
            } else if (step.practice.keywords) {
                isCorrect = step.practice.keywords.some(k => answer.toLowerCase().includes(k));
                explanation = step.practice.explanation;
            } else if (step.practice.correct !== undefined) {
                const userAnswer = parseFloat(answer);
                const tolerance = step.practice.tolerance || 0;
                isCorrect = Math.abs(userAnswer - step.practice.correct) <= tolerance;
                explanation = step.practice.explanation;
            }
        }

        if (isCorrect) {
            training.completed.push(step.id);
            training.score += 10;
            
            return {
                success: true,
                response: `${explanation}\n\n✅ **Правильно!** (+10 баллов)\n\nПереходим к следующему шагу...`,
                type: 'training_correct',
                nextStep: this.showTrainingStep(training.currentStep + 1)
            };
        } else {
            return {
                success: true,
                response: `❌ **Неправильно**\n\n${explanation}\n\nПопробуйте ещё раз или введите "подсказка"`,
                type: 'training_incorrect'
            };
        }
    }

    /**
     * Завершение уровня обучения
     */
    completeTrainingLevel() {
        const training = this.currentTraining;
        if (!training) return null;

        const certificates = {
            'beginner': '🥉 Сертификат: Новичок 3D печати',
            'operator': '🥈 Сертификат: Оператор 3D принтера',
            'expert': '🥇 Сертификат: Инженер 3D печати'
        };

        return {
            success: true,
            response: `🎉 **Уровень завершён!**\n\n` +
                `**Ваши результаты**:\n` +
                `• Пройдено шагов: ${training.completed.length}\n` +
                `• Набрано баллов: ${training.score}\n\n` +
                `${certificates[training.level] || 'Сертификат'}\n\n` +
                `Введите /training [level] для следующего уровня!\n\n` +
                `Доступные уровни:\n` +
                `• /training beginner — новичок\n` +
                `• /training operator — оператор\n` +
                `• /training expert — эксперт`,
            type: 'training_complete',
            source: 'training_mode'
        };
    }

    /**
     * Запуск диалогового сценария
     */
    startDialogScenario(scenario, initialMessage) {
        // Сохраняем текущий сценарий
        this.currentScenario = {
            ...scenario,
            currentStep: 0,
            answers: {}
        };

        // Показываем первый шаг
        const step = scenario.steps[0];
        
        return {
            success: true,
            response: `${scenario.title}\n\n${step.question}`,
            type: 'scenario_start',
            source: 'dialog_scenario',
            scenario: scenario
        };
    }

    /**
     * Генерация ответа с помощью локальной LLM-модели
     */
    async generateWithModel(userMessage) {
        try {
            // Формирование промпта с контекстом
            const context = this.buildContextPrompt();
            const fullPrompt = `${this.systemPrompt}\n\n${context}\n\nПользователь: ${userMessage}\n\nИИ-Инженер:`;

            // Генерация ответа
            const reply = await this.model.generate(fullPrompt, {
                max_tokens: 500,
                temperature: 0.3, // Низкая температура для точности
                top_p: 0.9
            });

            // Извлечение только нового ответа (без повторения промпта)
            const generatedText = reply.replace(fullPrompt, '').trim();

            return {
                success: true,
                response: generatedText || this.generateFallbackResponse(userMessage),
                type: 'ai_generated',
                source: 'local_model'
            };
        } catch (error) {
            console.error('Ошибка генерации через модель:', error);
            return this.generateFallbackResponse(userMessage);
        }
    }

    /**
     * Генерация ответа через базу знаний (RAG режим без LLM)
     * УЛУЧШЕНО: Контекст диалога + гибкий поиск + уточняющие вопросы + подсказки
     */
    async generateWithKnowledgeBase(userMessage) {
        // Улучшаем запрос с учётом контекста
        const enhancedQuery = this.enhanceQueryWithContext(userMessage);
        
        // Проверяем нужны ли уточняющие вопросы
        const clarifyingQuestion = this.getClarifyingQuestion(enhancedQuery);
        if (clarifyingQuestion) {
            return clarifyingQuestion;
        }
        
        // Быстрая проверка - если база знаний загружена, используем её
        if (window.AI_KNOWLEDGE && typeof window.AI_KNOWLEDGE.search === 'function') {
            try {
                const searchResult = window.AI_KNOWLEDGE.search(enhancedQuery);
                
                // Если нашли ответ - возвращаем
                if (searchResult && searchResult.response) {
                    return {
                        success: true,
                        response: this.makeResponseMoreHuman(searchResult.response, userMessage),
                        type: searchResult.type,
                        source: 'knowledge_base_v2'
                    };
                }
                
                // Если не нашли - предлагаем подсказки
                const suggestions = this.getSimilarQuestions(enhancedQuery);
                if (suggestions.length > 0) {
                    return {
                        success: true,
                        response: this.getFuzzyMatchResponse(userMessage, suggestions),
                        type: 'suggestion',
                        source: 'fuzzy_match'
                    };
                }
            } catch (error) {
                console.error('Ошибка поиска в базе знаний:', error);
            }
        }

        // Если база знаний не вернула ответ - используем умную заглушку
        return this.generateSmartFallbackResponse(userMessage);
    }

    /**
     * Поиск похожих вопросов для подсказок
     */
    getSimilarQuestions(query) {
        const keywords = this.extractKeywords(query);
        
        // База известных вопросов
        const knownQuestions = [
            { q: 'температура PLA', k: ['температур', 'pla', 'пла'] },
            { q: 'температура ABS', k: ['температур', 'abs', 'абс'] },
            { q: 'температура PETG', k: ['температур', 'petg', 'пэтг'] },
            { q: 'температура стола', k: ['температур', 'стол', 'стола'] },
            { q: 'скорость печати', k: ['скорост', 'печата', 'мм'] },
            { q: 'отслоение углов', k: ['отслоени', 'угл', 'загиб'] },
            { q: 'нити при печати', k: ['нит', 'паутин', 'string'] },
            { q: 'засор сопла', k: ['засор', 'сопл', 'экструд'] },
            { q: 'не липнет первый слой', k: ['липнет', 'перв', 'слой', 'адгез'] },
            { q: 'сдвиг слоёв', k: ['сдвиг', 'сло', 'смещ'] },
            { q: 'выбор материала', k: ['материал', 'выбор', 'пластик', 'какой'] },
            { q: 'настройка принтера', k: ['настрой', 'принтер', 'калибр'] },
            { q: 'параметры печати', k: ['параметр', 'печата', 'настройк'] },
            { q: 'сушка филамента', k: ['сушк', 'филамент', 'влажн'] },
            { q: 'калибровка стола', k: ['калибр', 'стол', 'уровн'] }
        ];
        
        // Считаем совпадения для каждого вопроса
        const matches = knownQuestions
            .map(item => {
                const score = keywords.reduce((acc, word) => {
                    const keywordMatch = item.k.some(k => k.includes(word) || word.includes(k));
                    return acc + (keywordMatch ? 1 : 0);
                }, 0);
                return { question: item.q, score };
            })
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        
        return matches;
    }

    /**
     * Ответ с подсказками "Возможно вы имели в виду"
     */
    getFuzzyMatchResponse(query, suggestions) {
        let response = `🤔 **Возможно, вы имели в виду:**\n\n`;
        
        suggestions.forEach((s, index) => {
            const percent = Math.round((s.score / this.extractKeywords(query).length) * 100);
            response += `${index + 1}. "${s.question}" ${percent >= 70 ? '✅' : '💡'}\n`;
        });
        
        response += `\n💡 **Или попробуйте:**\n`;
        response += `• /help - список команд\n`;
        response += `• /temp [материал] - температура\n`;
        response += `• /problem [симптом] - диагностика\n`;
        
        return response;
    }

    /**
     * Проверка нужны ли уточняющие вопросы
     */
    getClarifyingQuestion(message) {
        const lower = message.toLowerCase();
        
        // Вопросы про температуры без указания материала
        if (lower.includes('температур') && !this.hasMaterialMention(lower)) {
            return {
                success: true,
                response: `🌡️ Для какой температуры уточните?\n\n• Для какого материала? (PLA/ABS/PETG)\n• Для сопла или стола?\n\nНапример: "температура PLA" или "температура стола для ABS"`,
                type: 'clarification',
                source: 'clarifying_question'
            };
        }
        
        // Вопросы про материалы без конкретики
        if ((lower.includes('материал') || lower.includes('пластик') || lower.includes('филамент')) && 
            !this.hasSpecificMaterial(lower)) {
            return {
                success: true,
                response: `📦 Уточните материал!\n\nПопулярные:\n• PLA — для начинающих\n• ABS — прочный\n• PETG — баланс\n• TPU — гибкий\n\nДля какой задачи выбираете?`,
                type: 'clarification',
                source: 'clarifying_question'
            };
        }
        
        // Вопросы про проблемы без симптомов
        if ((lower.includes('проблем') || lower.includes('не работ') || lower.includes('ошибк')) && 
            lower.length < 30) {
            return {
                success: true,
                response: `🔧 Опишите проблему подробнее!\n\nЧто наблюдаете?\n• Отслоение углов?\n• Нити (stringing)?\n• Засор сопла?\n• Сдвиг слоёв?\n• Не экструдится?\n\nИли: "проблемы с PLA" / "не липнет первый слой"`,
                type: 'clarification',
                source: 'clarifying_question'
            };
        }
        
        // Вопросы про скорость без материала
        if ((lower.includes('скорост') || lower.includes('мм/с')) && !this.hasMaterialMention(lower)) {
            return {
                success: true,
                response: `⚡ Скорость зависит от материала!\n\nДля какого материала?\n• PLA: 40-60 мм/с\n• ABS: 30-50 мм/с\n• PETG: 30-40 мм/с\n• TPU: 15-25 мм/с\n\nУточните материал?`,
                type: 'clarification',
                source: 'clarifying_question'
            };
        }
        
        // Вопросы про печать без типа
        if ((lower.includes('печата') || lower.includes('настрой')) && lower.length < 20) {
            return {
                success: true,
                response: `🖨️ Уточните что интересует!\n\n• Настройка принтера?\n• Настройка печати?\n• Настройка слайсера?\n• Параметры материала?\n\nЧто именно нужно?`,
                type: 'clarification',
                source: 'clarifying_question'
            };
        }
        
        return null;
    }

    /**
     * Проверка есть ли упоминание материала
     */
    hasMaterialMention(message) {
        const materials = ['pla', 'abs', 'petg', 'tpu', 'nylon', 'pc', 'peek', 'пластик', 'филамент', 'смола'];
        return materials.some(m => message.includes(m));
    }

    /**
     * Проверка есть ли конкретный материал
     */
    hasSpecificMaterial(message) {
        const specific = ['pla', 'abs', 'petg', 'tpu', 'nylon', 'pc', 'peek', 'flex', 'гибк', 'прочн'];
        return specific.some(m => message.includes(m));
    }

    /**
     * Fuzzy Matching - поиск по ключевым словам с игнорированием стоп-слов
     */
    fuzzyMatch(query, keywords) {
        // Стоп-слова которые игнорируем
        const stopWords = [
            'как', 'что', 'почему', 'зачем', 'когда', 'где', 'куда', 'откуда',
            'можно', 'нужно', 'надо', 'хочу', 'будет', 'было', 'быть',
            'для', 'без', 'при', 'под', 'над', 'перед', 'после',
            'и', 'или', 'но', 'а', 'же', 'ли', 'бы',
            'в', 'на', 'с', 'со', 'за', 'по', 'о', 'об', 'от', 'до',
            'этот', 'тот', 'такой', 'какой', 'который',
            'мой', 'твой', 'наш', 'ваш', 'свой',
            'весь', 'вся', 'всё', 'все', 'сам', 'сама', 'само', 'сами'
        ];
        
        // Разбиваем на слова
        const queryWords = query.toLowerCase()
            .replace(/[.,!?;:()"]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.includes(w));
        
        // Считаем совпадения
        let matches = 0;
        let totalRelevant = 0;
        
        for (const keyword of keywords) {
            totalRelevant++;
            if (queryWords.some(w => w.includes(keyword) || keyword.includes(w))) {
                matches++;
            }
        }
        
        // Возвращаем процент совпадения (0-1)
        return totalRelevant > 0 ? matches / totalRelevant : 0;
    }

    /**
     * Извлечение ключевых слов из вопроса
     */
    extractKeywords(question) {
        const stopWords = [
            'как', 'что', 'почему', 'зачем', 'когда', 'где', 'куда',
            'можно', 'нужно', 'надо', 'хочу', 'будет', 'было',
            'для', 'без', 'при', 'под', 'над', 'перед', 'после',
            'и', 'или', 'но', 'а', 'же', 'ли', 'бы',
            'в', 'на', 'с', 'со', 'за', 'по', 'о', 'об', 'от', 'до'
        ];
        
        return question.toLowerCase()
            .replace(/[.,!?;:()"]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.includes(w));
    }

    /**
     * Диалоговые сценарии - пошаговая диагностика
     */
    getDialogScenario(message) {
        const lower = message.toLowerCase();
        
        // Сценарий: Отслоение (warping)
        if (lower.includes('отслоени') || lower.includes('отходит') || lower.includes('загиб')) {
            return {
                id: 'warping',
                title: 'Диагностика отслоения',
                steps: [
                    {
                        question: 'Какой материал используете? (PLA/ABS/PETG)',
                        key: 'material',
                        options: ['pla', 'abs', 'petg', 'tpu', 'nylon']
                    },
                    {
                        question: 'Какая температура стола установлена?',
                        key: 'bedTemp',
                        validate: (val) => /^\d+$/.test(val)
                    },
                    {
                        question: 'Используете ли закрытую камеру?',
                        key: 'chamber',
                        options: ['да', 'нет']
                    },
                    {
                        question: 'Используете ли адгезив (клей/лак)?',
                        key: 'adhesion',
                        options: ['да', 'нет']
                    }
                ],
                onComplete: (answers) => this.generateWarpingDiagnosis(answers)
            };
        }
        
        // Сценарий: Нити (stringing)
        if (lower.includes('нити') || lower.includes('stringing') || lower.includes('паутина')) {
            return {
                id: 'stringing',
                title: 'Диагностика нитей',
                steps: [
                    {
                        question: 'Какой материал используете?',
                        key: 'material',
                        options: ['pla', 'abs', 'petg', 'tpu']
                    },
                    {
                        question: 'Какая температура сопла?',
                        key: 'nozzleTemp',
                        validate: (val) => /^\d+$/.test(val)
                    },
                    {
                        question: 'Настроен ли ретракт?',
                        key: 'retract',
                        options: ['да', 'нет', 'не знаю']
                    }
                ],
                onComplete: (answers) => this.generateStringingDiagnosis(answers)
            };
        }
        
        // Сценарий: Не липнет первый слой
        if (lower.includes('не липнет') || lower.includes('отходит первый') || lower.includes('первый слой')) {
            return {
                id: 'adhesion',
                title: 'Диагностика адгезии',
                steps: [
                    {
                        question: 'Какой материал?',
                        key: 'material',
                        options: ['pla', 'abs', 'petg', 'tpu']
                    },
                    {
                        question: 'Выровнен ли стол?',
                        key: 'leveling',
                        options: ['да', 'нет', 'не уверен']
                    },
                    {
                        question: 'Какая высота сопла над столом?',
                        key: 'zOffset',
                        options: ['нормально', 'высоко', 'низко', 'не знаю']
                    }
                ],
                onComplete: (answers) => this.generateAdhesionDiagnosis(answers)
            };
        }
        
        return null;
    }

    /**
     * Генерация диагноза для отслоения
     */
    generateWarpingDiagnosis(answers) {
        let diagnosis = '🔧 **Диагноз: Отслоение (warping)**\n\n';
        
        // Рекомендации по материалу
        const materialAdvice = {
            'pla': 'PLA требует стол 50-60°C',
            'abs': 'ABS требует стол 90-110°C и закрытую камеру!',
            'petg': 'PETG требует стол 70-80°C',
            'tpu': 'TPU требует стол 40-60°C'
        };
        
        diagnosis += `📋 **Анализ**:\n\n`;
        
        if (answers.material && materialAdvice[answers.material]) {
            diagnosis += `• ${materialAdvice[answers.material]}\n`;
        }
        
        if (answers.bedTemp) {
            const temp = parseInt(answers.bedTemp);
            if (answers.material === 'pla' && temp < 50) {
                diagnosis += `• ❌ Температура стола слишком низкая (${temp}°C). Нужно 50-60°C\n`;
            } else if (answers.material === 'abs' && temp < 90) {
                diagnosis += `• ❌ Температура стола слишком низкая (${temp}°C). Нужно 90-110°C\n`;
            } else if (answers.material === 'petg' && temp < 70) {
                diagnosis += `• ❌ Температура стола слишком низкая (${temp}°C). Нужно 70-80°C\n`;
            } else {
                diagnosis += `• ✅ Температура стола в норме\n`;
            }
        }
        
        if (answers.chamber === 'нет' && answers.material === 'abs') {
            diagnosis += `• ❌ ABS требует закрытую камеру!\n`;
        }
        
        if (answers.adhesion === 'нет') {
            diagnosis += `• ⚠️ Рекомендуется использовать адгезив (клей/лак)\n`;
        }
        
        diagnosis += `\n💡 **Рекомендации**:\n`;
        diagnosis += `1. Проверьте температуру стола\n`;
        diagnosis += `2. Используйте адгезив (клей-карандаш, лак)\n`;
        diagnosis += `3. Добавьте юбку (brim) или плот (raft)\n`;
        diagnosis += `4. Проверьте выравнивание стола\n`;
        
        if (answers.material === 'abs') {
            diagnosis += `5. **Обязательно** используйте закрытую камеру!\n`;
        }
        
        return diagnosis;
    }

    /**
     * Генерация диагноза для нитей
     */
    generateStringingDiagnosis(answers) {
        let diagnosis = '🔧 **Диагноз: Нити (stringing)**\n\n';
        
        diagnosis += `📋 **Анализ**:\n\n`;
        
        if (answers.material === 'petg') {
            diagnosis += `• PETG склонен к нитям — это нормально\n`;
        }
        
        if (answers.nozzleTemp) {
            const temp = parseInt(answers.nozzleTemp);
            if (temp > 240) {
                diagnosis += `• ⚠️ Температура слишком высокая (${temp}°C). ��опробуйте снизить на 5-10°C\n`;
            } else {
                diagnosis += `• ✅ Температура в норме\n`;
            }
        }
        
        if (answers.retract === 'нет') {
            diagnosis += `• ❌ Ретракт не настроен! Это основная причина нитей\n`;
        } else if (answers.retract === 'не знаю') {
            diagnosis += `• ⚠️ Проверьте настройки ретракта в слайсере\n`;
        }
        
        diagnosis += `\n💡 **Рекомендации**:\n`;
        diagnosis += `1. Настройте ретракт (длина: 4-6мм для Bowden, 0.5-2мм для Direct)\n`;
        diagnosis += `2. Снизьте температуру на 5-10°C\n`;
        diagnosis += `3. Увеличьте скорость ретракта\n`;
        diagnosis += `4. Включите комбинг (combing)\n`;
        diagnosis += `5. Высушите филамент (особенно PETG/Nylon)\n`;
        
        return diagnosis;
    }

    /**
     * Генерация диагноза для адгезии
     */
    generateAdhesionDiagnosis(answers) {
        let diagnosis = '🔧 **Диагноз: Плохая адгезия первого слоя**\n\n';
        
        diagnosis += `📋 **Анализ**:\n\n`;
        
        if (answers.leveling === 'нет') {
            diagnosis += `• ❌ Стол не выровнен! Это основная проблема\n`;
        }
        
        if (answers.zOffset === 'высоко') {
            diagnosis += `• ❌ Сопло слишком высоко над столом\n`;
        } else if (answers.zOffset === 'низко') {
            diagnosis += `• ❌ Сопло слишком близко к столу\n`;
        }
        
        diagnosis += `\n💡 **Рекомендации**:\n`;
        diagnosis += `1. Выровняйте стол по инструкции\n`;
        diagnosis += `2. Настройте Z-offset (лист бумаги между соплом и столом)\n`;
        diagnosis += `3. Очистите стол (спирт/ацетон)\n`;
        diagnosis += `4. Используйте адгезив (клей/лак)\n`;
        diagnosis += `5. Снизьте скорость первого слоя до 20-30 мм/с\n`;
        
        return diagnosis;
    }

    /**
     * Улучшение запроса с учётом контекста диалога
     */
    enhanceQueryWithContext(userMessage) {
        const lastMessages = this.chatHistory.slice(-4); // Последние 4 сообщения
        
        // Если сообщение короткое и содержит местоимения - добавляем контекст
        const shortQueries = ['а для него?', 'а для неё?', 'а этот?', 'а эта?', 'а если?', 'а с ним?', 'а с ней?'];
        const hasShortQuery = shortQueries.some(q => userMessage.toLowerCase().includes(q));
        
        if (hasShortQuery && lastMessages.length > 0) {
            // Ищем последний упомянутый материал/принтер
            const lastUserMessage = lastMessages.reverse().find(m => m.role === 'user');
            if (lastUserMessage) {
                const context = this.extractContextFromMessage(lastUserMessage.content);
                if (context) {
                    return `${context} ${userMessage}`;
                }
            }
        }
        
        // Если вопрос о температуре/настройках для другого материала
        const materialSwitch = ['а для petg?', 'а для pla?', 'а для abs?', 'а для tpu?', 'а для nylon?'];
        const foundSwitch = materialSwitch.find(q => userMessage.toLowerCase().includes(q));
        
        if (foundSwitch) {
            // Ищем последний контекст (температура, скорость и т.д.)
            const lastAssistantMessage = lastMessages.reverse().find(m => m.role === 'assistant');
            if (lastAssistantMessage) {
                const topic = this.extractTopicFromResponse(lastAssistantMessage.content);
                if (topic) {
                    return `${topic} ${userMessage}`;
                }
            }
        }
        
        return userMessage;
    }

    /**
     * Извлечение контекста из сообщения пользователя
     */
    extractContextFromMessage(message) {
        const lower = message.toLowerCase();
        
        // Материалы
        const materials = ['pla', 'abs', 'petg', 'tpu', 'nylon', 'pc', 'peek', 'пластик', 'филамент'];
        for (const mat of materials) {
            if (lower.includes(mat)) {
                return mat.toUpperCase();
            }
        }
        
        // Принтеры
        const printers = ['ender', 'prusa', 'bambu', 'creality', 'принтер'];
        for (const printer of printers) {
            if (lower.includes(printer)) {
                return printer;
            }
        }
        
        // Параметры
        const params = ['температур', 'скорост', 'слой', 'заполнен', 'параметр'];
        for (const param of params) {
            if (lower.includes(param)) {
                return param;
            }
        }
        
        return null;
    }

    /**
     * Извлечение темы из ответа ИИ
     */
    extractTopicFromResponse(response) {
        const lower = response.toLowerCase();
        
        if (lower.includes('температур')) return 'Температура:';
        if (lower.includes('скорост')) return 'Скорость:';
        if (lower.includes('слой')) return 'Толщина слоя:';
        if (lower.includes('заполнен')) return 'Заполнение:';
        if (lower.includes('давлен')) return 'Давление:';
        
        return null;
    }

    /**
     * Делает ответ более человечным
     */
    makeResponseMoreHuman(response, userMessage) {
        // Добавляем приветственные фразы
        const greetings = ['привет', 'здравствуй', 'hello', 'hi'];
        if (greetings.some(g => userMessage.toLowerCase().includes(g))) {
            const hour = new Date().getHours();
            let greeting = 'Доброе утро';
            if (hour >= 12) greeting = 'Добрый день';
            if (hour >= 17) greeting = 'Добрый вечер';
            if (hour >= 23 || hour < 6) greeting = 'Доброй ночи';
            
            return `${greeting}! ${response}`;
        }
        
        // Добавляем уточнения если вопрос короткий
        if (userMessage.length < 20) {
            response += '\n\n💡 Нужны подробности? Спросите подробнее!';
        }
        
        return response;
    }

    /**
     * Умный ответ при отсутствии данных в базе
     */
    generateSmartFallbackResponse(message) {
        const lower = message.toLowerCase();
        
        // Вопросы "почему"
        if (lower.includes('почему') || lower.includes('зачем') || lower.includes('как так')) {
            return this.generateWhyResponse(message);
        }
        
        // Вопросы про склад
        if (lower.includes('склад') || lower.includes('остатк') || lower.includes('цен') || lower.includes('рубл') || lower.includes('₽')) {
            return this.generateWarehouseResponse(message);
        }
        
        // Определяем намерение
        const intents = {
            greeting: ['привет', 'здравствуй', 'hello', 'hi', 'добрый'],
            thanks: ['спасиб', 'благодар', 'thank'],
            printer: ['принтер', 'печатник', 'устройство'],
            material: ['материал', 'пластик', 'смола', 'филамент'],
            problem: ['проблем', 'не печат', 'отслой', 'засор', 'ошибк'],
            temperature: ['температур', 'градус', 'нагрев'],
            speed: ['скорост', 'мм/с'],
            layer: ['слой', 'толщин'],
            help: ['помощ', 'помоги', 'help']
        };
        
        // Находим наиболее вероятное намерение
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(k => lower.includes(k))) {
                return this.getIntentResponse(intent, message);
            }
        }
        
        // Стандартный ответ
        return {
            success: true,
            response: `Я не совсем понял ваш вопрос: "${message}"\n\nЯ могу помочь с:\n• Настройкой принтеров 🖨️\n• Выбором материалов 📦\n• Решением проблем 🔧\n• Параметрами печати ⚙️\n• Безопасностью 🛡️\n• Управлением калькулятором 🎛️\n\nПопробуйте перефразировать вопрос!`,
            type: 'unknown',
            source: 'fallback'
        };
    }

    /**
     * Ответ на вопросы "почему"
     */
    generateWhyResponse(message) {
        const lower = message.toLowerCase();
        
        // Почему 0 рублей / нет цены
        if (lower.includes('0') || lower.includes('ноль') || lower.includes('нет цен') || lower.includes('бесплатн')) {
            return {
                success: true,
                response: `💰 Цены на материалы не указаны, потому что:\n\n1️⃣ **Материалы ещё не добавлены**\n   • Откройте "Материалы"\n   • Добавьте материалы с ценами\n\n2️⃣ **Цены не заполнены**\n   • Редактируйте материал\n   • Укажите цену за кг/грамм\n\n3️⃣ **Склад пуст**\n   • Остаток: 0 г\n   • Стоимость: 0 ₽\n\n📝 **Как исправить**:\n1. Откройте вкладку "Материалы"\n2. Нажмите "Добавить материал"\n3. Заполните:\n   • Название (PLA, ABS)\n   • Тип (FDM/SLA)\n   • Цену (₽/кг)\n   • Остаток (г)\n\nПосле этого я смогу показывать актуальные цены! 🎯`,
                type: 'warehouse_info',
                source: 'why_response'
            };
        }
        
        // Почему не работает / ошибка
        if (lower.includes('не работ') || lower.includes('ошибк') || lower.includes('проблем')) {
            return {
                success: true,
                response: `🔧 Возможные причины:\n\n1️⃣ **Проверьте подключение**\n   • Принтер включён?\n   • Кабели подключены?\n\n2️⃣ **Проверьте настройки**\n   • Выбран правильный принтер?\n   • Материал загружен?\n\n3️⃣ **Перезапустите**\n   • Обновите страницу (F5)\n   • Перезапустите приложение\n\nЕсли проблема не решена — опишите подробнее!\n\n💡 **Что именно не работает**?\n• Принтер не печатает?\n• Калькулятор не считает?\n• Материалы не отображаются?`,
                type: 'troubleshooting',
                source: 'why_response'
            };
        }
        
        // Общий ответ на "почему"
        return {
            success: true,
            response: `❓ Хороший вопрос!\n\nВ 3D печати есть много нюансов. Давайте разберёмся:\n\n**Что именно вас интересует**?\n• Почему материал ведёт себя так?\n• Почему принтер работает иначе?\n• Почему расчёт отличается?\n\nОпишите подробнее ситуацию — я помогу разобраться! 🎯`,
            type: 'why_general',
            source: 'why_response'
        };
    }

    /**
     * Ответ про склад
     */
    generateWarehouseResponse(message) {
        const lower = message.toLowerCase();
        
        // Почему 0 рублей
        if (lower.includes('0') || lower.includes('ноль') || lower.includes('бесплатн')) {
            return {
                success: true,
                response: `💰 **Почему 0 рублей**?\n\nЭто значит что:\n\n1️⃣ **Материалы не добавлены**\n   • Откройте "Материалы" → "Добавить"\n   • Заполните данные\n\n2️⃣ **Цены не указаны**\n   • Редактируйте материал\n   • Введите цену за кг/грамм\n\n3️⃣ **Остаток = 0**\n   • Материал закончился\n   • Нужно пополнить\n\n📝 **Что делать**:\n1. Вкладка "Материалы"\n2. Кнопка "Добавить"\n3. Заполните:\n   • Название\n   • Тип (PLA/ABS/PETG)\n   • Цена (₽/кг)\n   • Остаток (г)\n\nПосле этого склад будет работать корректно! ✅`,
                type: 'warehouse_pricing',
                source: 'warehouse_response'
            };
        }
        
        // Сколько материалов / остатки
        if (lower.includes('сколько') || lower.includes('остаток') || lower.includes('остал')) {
            return {
                success: true,
                response: `📦 **Остатки материалов**\n\nПроверить остатки можно:\n\n1️⃣ **Вкладка "Материалы"**\n   • Все материалы с остатками\n   • Актуальные данные\n\n2️⃣ **Предупреждения**\n   • ⚠️ Заканчиваются (<100г)\n   • 🔴 Критически мало (<50г)\n\n3️⃣ **Общая стоимость**\n   • Сумма всех материалов\n   • В рублях\n\n💡 **Совет**: Настройте уведомления\n当 остаток < 100г`,
                type: 'warehouse_stock',
                source: 'warehouse_response'
            };
        }
        
        // Общий ответ про склад
        return {
            success: true,
            response: `📦 **Склад материалов**\n\n**Что можно сделать**:\n\n✅ **Добавить материал**\n   • Название (PLA, ABS)\n   • Тип (FDM/SLA)\n   • Цена (₽/кг)\n   • Остаток (г)\n\n✅ **Редактировать**\n   • Обновить цены\n   • Изменить остатки\n\n✅ **Контролировать**\n   • Отслеживать расход\n   • Получать уведомления\n\n💡 **Откройте вкладку "Материалы"** для управления складом!`,
            type: 'warehouse_general',
            source: 'warehouse_response'
        };
    }

    /**
     * Ответ по намерению
     */
    getIntentResponse(intent, message) {
        // Варианты ответов для каждого намерения
        const responses = {
            greeting: [
                `👋 Привет! Я AI Engineer 3D MONOLITH.\n\nГотов помочь с:\n• Настройкой принтеров\n• Выбором материалов\n• Решением проблем\n• Параметрами печати\n\nЧто вас интересует?`,
                `👋 Здравствуйте! Рад видеть вас в 3D MONOLITH!\n\nЧем могу помочь сегодня?\n• Принтеры 🖨️\n• Материалы 📦\n• Проблемы 🔧\n• Настройки ⚙️`,
                `👋 Добрый день! Я ваш помощник по 3D-печати.\n\nЗадавайте вопросы про:\n• Настройку оборудования\n• Выбор материалов\n• Решение проблем\n• Расчёт параметров`,
                `👋 Приветствую! Я AI Engineer системы 3D MONOLITH.\n\nМогу помочь с:\n• Парком принтеров\n• Складом материалов\n• Диагностика проблем\n• Калькулятором печати\n\nСлушаю внимательно!`,
                `👋 Рад встрече! Я помогу вам с 3D-печатью.\n\nСпрашивайте про:\n• Температуры и скорости\n• Материалы и их свойства\n• Проблемы и решения\n• Настройки принтеров`
            ],
            thanks: [
                `😊 Всегда рад помочь!\n\nЕсли есть ещё вопросы — спрашивайте!`,
                `😊 Пожалуйста! Обращайтесь в любое время.\n\nЯ здесь чтобы помочь с 3D-печатью!`,
                `😊 Не за что! Рад что смог помочь.\n\nЕсть ещё вопросы по печати?`,
                `😊 Это моя работа! 😊\n\nЕсли что-то ещё понадобится — я рядом.`,
                `😊 На здоровье! Удачной печати!\n\nЗаходите ещё если будут вопросы.`
            ],
            printer: [
                `🖨️ Информация о принтерах\n\nУ нас в базе более 1000 моделей принтеров!\n\nСпросите:\n• "Какие есть принтеры?"\n• "Характеристики [название]"\n• "Настройка [название]"`,
                `🖨️ Парк принтеров 3D MONOLITH\n\nДоступны:\n• FDM принтеры (FDM/FFF)\n• SLA принтеры (фотополимер)\n\nСпросите про:\n• Характеристики\n• Настройки\n• Совместимость`,
                `🖨️ Принтеры в системе\n\nБаза включает:\n• Ender, Prusa, Bambu Lab\n• Creality, Anycubic, Elegoo\n• И многие другие\n\nЧто вас интересует?`,
                `🖨️ Информация о принтерах\n\nЯ знаю:\n• Характеристики каждой модели\n• Рекомендуемые настройки\n• Совместимые материалы\n• Типичные проблемы\n\nСпрашивайте!`
            ],
            material: [
                `📦 Информация о материалах\n\nВ базе есть:\n• PLA, ABS, PETG, TPU\n• Nylon, PC, PEEK\n• Фотополимеры\n\nСпросите:\n• "Температура для PLA"\n• "Сравнить ABS и PETG"\n• "Какой материал для..."`,
                `📦 Материалы для 3D печати\n\nПопулярные:\n• PLA — для начинающих\n• ABS — прочный, термостойкий\n• PETG — баланс свойств\n• TPU — гибкий\n\nЧто хотите узнать?`,
                `📦 База материалов\n\nFDM материалы:\n• PLA, ABS, PETG, TPU\n• Nylon, PC, PEEK\n\nSLA материалы:\n• Стандартные смолы\n• Прочные смолы\n• Гибкие смолы\n\nИнтересует что-то конкретное?`,
                `📦 Выбор материала\n\nПомогу подобрать:\n• По назначению детали\n• По условиям эксплуатации\n• По бюджету\n• По доступности\n\nСпросите "какой материал для..."`
            ],
            problem: [
                `🔧 Решение проблем\n\nОпишите проблему подробнее:\n• "Отслоение углов"\n• "Засор сопла"\n• "Сдвиг слоёв"\n• "Нити (stringing)"\n\nИли спросите "проблемы с [симптом]"`,
                `🔧 Диагностика проблем\n\nТипичные проблемы:\n• Отслоение (warping)\n• Нити (stringing)\n• Засор сопла\n• Сдвиг слоёв\n• Недоэкструзия\n\nОпишите что случилось?`,
                `🔧 Помощь с проблемами печати\n\nЯ могу помочь с:\n• Диагностикой причины\n• Поиском решения\n• Профилактикой проблем\n\nСимптомы какие наблюдаете?`,
                `🔧 Решение проблем печати\n\nБаза знаний включает:\n• 10+ проблем FDM\n• 5+ проблем SLA\n• Причины и решения\n• Меры профилактики\n\nЧто беспокоит?`
            ],
            temperature: [
                `🌡️ Температуры печати\n\nСпросите конкретно:\n• "Температура для PLA"\n• "Температура для ABS"\n• "Температура стола PETG"\n\nИли выберите материал в калькуляторе!`,
                `🌡️ Температурные режимы\n\nВажно знать:\n• Температуру сопла\n• Температуру стола\n• Скорость обдува\n\nДля какого материала интересует?`,
                `🌡️ Настройки температур\n\nЗависят от:\n• Типа материала\n• Диаметра сопла\n• Скорости печати\n• Производителя филамента\n\nУточните материал?`,
                `🌡️ Температуры для материалов\n\nПомогу подобрать:\n• Оптимальную температуру\n• Температуру стола\n• Настройки обдува\n\nКакой материал используете?`
            ],
            speed: [
                `⚡ Скорость печати\n\nРекомендации:\n• Первый слой: 20-30 мм/с\n• Обычная печать: 40-60 мм/с\n• Быстрая печать: 60-100 мм/с\n\nЗависит от материала и принтера!`,
                `⚡ Настройка скорости\n\nФакторы:\n• Тип материала\n• Качество печати\n• Надёжность принтера\n• Геометрия модели\n\nДля какой печати интересует?`,
                `⚡ Скорости для разных задач\n\nКачество: 30-40 мм/с\nСтандарт: 50-60 мм/с\nБыстро: 70-90 мм/с\n\nЧто печатаете?`,
                `⚡ Оптимизация скорости\n\nБалансируйте:\n• Скорость vs Качество\n• Скорость vs Надёжность\n• Скорость vs Детализация\n\nКакая цель?`
            ],
            layer: [
                `📏 Толщина слоя\n\nСтандартные значения:\n• 0.1 мм - высокое качество\n• 0.2 мм - обычное качество\n• 0.3 мм - быстрая печать\n\nЗависит от диаметра сопла!`,
                `📏 Настройка слоя\n\nРекомендации:\n• 0.1-0.15 мм - миниатюры\n• 0.2 мм - стандарт\n• 0.3+ мм - крупные детали\n\nЧто печатаете?`,
                `📏 Выбор толщины слоя\n\nВлияет на:\n• Качество поверхности\n• Время печати\n• Прочность детали\n\nКакая задача стоит?`,
                `📏 Параметры слоя\n\nПравило:\n• Слой ≤ 75% диаметра сопла\n• Стандарт: 0.2 мм (сопло 0.4)\n• Минимум: 0.08 мм\n• Максимум: 0.35 мм`
            ],
            help: [
                `🆘 Помощь\n\nЯ могу:\n• Рассчитать стоимость печати\n• Подобрать материал\n• Решить проблему\n• Дать параметры\n\nПросто спросите!`,
                `🆘 Чем помочь?\n\nМои возможности:\n• Информация о принтерах\n• Параметры материалов\n• Диагностика проблем\n• Расчё�� в калькуляторе\n\nЧто нужно?`,
                `🆘 Служба поддержки 3D MONOLITH\n\nДоступно:\n• База знаний\n• Диагностика\n• Калькулятор\n• Справочник\n\nСпрашивайте!`,
                `🆘 Я здесь чтобы помочь!\n\nЗадавайте вопросы про:\n• Настройку печати\n• Выбор материалов\n• Решение проблем\n• Расчёт стоимости\n\nЧто интересует?`
            ]
        };
        
        // Выбираем случайный вариант ответа
        const intentResponses = responses[intent] || responses.help;
        const randomIndex = Math.floor(Math.random() * intentResponses.length);
        
        return {
            success: true,
            response: intentResponses[randomIndex],
            type: intent,
            source: 'intent_recognition'
        };
    }

    /**
     * Классификация намерения пользователя
     */
    classifyIntent(message) {
        // Приветствия
        const greetings = ['привет', 'здравствуй', 'hello', 'hi', 'добрый', 'здравствуйте'];
        if (greetings.some(g => message.includes(g))) {
            return { category: 'greeting' };
        }

        // Запросы о принтерах
        const printerKeywords = ['принтер', 'печатник', 'устройство', 'park', 'printer'];
        const printerNames = this.appContext.printers.map(p => p.name?.toLowerCase() || '');
        const printerName = printerNames.find(name => message.includes(name));
        if (printerKeywords.some(k => message.includes(k)) || printerName) {
            return { category: 'printer_info', printerName };
        }

        // Запросы о материалах
        const materialKeywords = ['материал', 'пластик', 'смола', 'филамент', 'photopolymer'];
        const materialTypes = ['pla', 'abs', 'petg', 'tpu', 'nylon', 'pc', 'peek', 'фотополимер', 'смола'];
        const materialName = materialTypes.find(m => message.includes(m.toLowerCase()));
        if (materialKeywords.some(k => message.includes(k)) || materialName) {
            return { category: 'material_info', materialName };
        }

        // Неисправности
        const problemKeywords = [
            'проблем', 'не печат', 'отслой', 'сдвиг', 'застрев', 'засор',
            'bubble', 'layer shift', 'warping', 'clog', 'issue', 'error'
        ];
        if (problemKeywords.some(k => message.includes(k))) {
            const problem = this.extractProblem(message);
            return { category: 'troubleshooting', problem };
        }

        // Безопасность
        const safetyKeywords = ['безопасн', 'опасн', 'токсичн', 'вредн', 'защит', 'siз', 'перчатк', 'маск'];
        if (safetyKeywords.some(k => message.includes(k))) {
            return { category: 'safety', topic: this.extractSafetyTopic(message) };
        }

        // Расчеты и параметры
        const calcKeywords = ['температур', 'скорост', 'слой', 'заполнен', 'расчет', 'параметр', 'настройк'];
        if (calcKeywords.some(k => message.includes(k))) {
            return { category: 'calculation', parameter: this.extractParameter(message) };
        }

        return { category: 'unknown', originalMessage: message };
    }

    /**
     * Построение контекстного промпта с данными приложения
     */
    buildContextPrompt() {
        const context = [];

        // Текущая вкладка
        context.push(`Текущий режим: ${this.appContext.currentTab}`);

        // Выбранный принтер
        if (this.appContext.selectedPrinter) {
            const p = this.appContext.selectedPrinter;
            context.push(`Выбранный принтер: ${p.name}, кинематика: ${p.kinematics || 'N/A'}, область печати: ${p.buildVolume || 'N/A'}`);
        }

        // Выбранный материал
        if (this.appContext.selectedMaterial) {
            const m = this.appContext.selectedMaterial;
            context.push(`Материал: ${m.name}, тип: ${m.type}, температура печати: ${m.printTemp || 'N/A'}°C`);
        }

        // Текущий заказ
        if (this.appContext.currentOrder) {
            const o = this.appContext.currentOrder;
            context.push(`Параметры заказа: слой=${o.layerHeight || 'N/A'}, заполнение=${o.infill || 'N/A'}%`);
        }

        // Статистика парка
        if (this.appContext.printers.length > 0) {
            const active = this.appContext.printers.filter(p => p.state === 'active').length;
            const printing = this.appContext.printers.filter(p => p.state === 'printing').length;
            context.push(`Парк принтеров: всего=${this.appContext.printers.length}, активно=${active}, в печати=${printing}`);
        }

        return context.join('\n');
    }

    /**
     * Форматирование ответа о принтере
     */
    formatPrinterInfo(printers, printerName) {
        if (printers && printers.length > 0) {
            const printer = printers.find(p => p.name === printerName) || printers[0];
            return `📋 ИНФОРМАЦИЯ О ПРИНТЕРЕ: ${printer.name}

🔧 Характеристики:
• Кинематика: ${printer.kinematics || 'N/A'}
• Область печати: ${printer.buildVolume || 'N/A'}
• Тип экструдера: ${printer.extruderType || 'N/A'}
• Макс. температура сопла: ${printer.maxNozzleTemp || 'N/A'}°C
• Подогреваемая камера: ${printer.heatedChamber ? 'Да' : 'Нет'}

📊 Статус: ${this.translatePrinterState(printer.state)}
${printer.state === 'printing' ? `• Текущая задача: ${printer.currentJob || 'N/A'}` : ''}
${printer.state === 'maintenance' ? `• След. обслуживание: ${this.formatDate(printer.nextMaintenance)}` : ''}

💡 Рекомендация: ${this.getPrinterAdvice(printer)}`;
        }

        return 'Информация о принтерах не найдена. Проверьте настройки парка оборудования.';
    }

    /**
     * Форматирование ответа о материале
     */
    formatMaterialInfo(materials, materialName) {
        if (materials && materials.length > 0) {
            const material = materials.find(m => m.name === materialName) || materials[0];
            const isSLA = material.type === 'sla' || material.type === 'photopolymer';

            let response = `📦 МАТЕРИАЛ: ${material.name}

🔬 Тип: ${this.translateMaterialType(material.type)}
🌡️ Температура печати: ${material.printTemp || 'N/A'}°C
🛏️ Температура стола: ${material.bedTemp || 'N/A'}°C
💰 Цена: ${material.price || 'N/A'} ₽/кг
📦 Остаток: ${material.stock || '0'} г`;

            if (isSLA) {
                response += `

⚠️ БЕЗОПАСНОСТЬ (SLA):
• Обязательно используйте нитриловые перчатки
• Работайте в проветриваемом помещении
• Используйте защитные очки
• Избегайте контакта с кожей`;
            }

            response += `

💡 Советы по печати:
• ${this.getMaterialAdvice(material)}`;

            return response;
        }

        return 'Информация о материалах не найдена. Проверьте склад материалов.';
    }

    /**
     * Форматирование ответа по неисправностям
     */
    formatTroubleshooting(troubleshooting, problem) {
        if (troubleshooting && troubleshooting.length > 0) {
            const issue = troubleshooting[0]; // Лучшее совпадение
            
            let response = `🔧 ПРОБЛЕМА: ${issue.problem}\n\n`;
            
            if (issue.causes && issue.causes.length > 0) {
                response += '🔍 Возможные причины:\n';
                issue.causes.forEach((cause, i) => {
                    response += `  ${i + 1}. ${cause}\n`;
                });
            }
            
            if (issue.solutions && issue.solutions.length > 0) {
                response += '\n✅ Решения:\n';
                issue.solutions.forEach((solution, i) => {
                    response += `  ${i + 1}. ${solution}\n`;
                });
            }

            // Добавляем предупреждения безопасности если нужно
            if (issue.safetyWarning) {
                response += `\n⚠️ ${issue.safetyWarning}`;
            }

            return response;
        }

        return `Не найдено точного решения для проблемы "${problem}".\n\nРекомендую:\n1. Проверить официальную документацию принтера\n2. Обратиться к специалисту\n3. Описать проблему более детально`;
    }

    /**
     * Форматирование ответа по безопасности
     */
    formatSafetyInfo(safetyData, topic) {
        let response = `🛡️ БЕЗОПАСНОСТЬ: ${topic || 'Общие правила'}\n\n`;
        
        response += `❗ Критические правила:\n`;
        response += `• Никогда не отключайте питание при нагретых компонентах\n`;
        response += `• Дайте оборудованию остыть перед обслуживанием (<30°C)\n`;
        response += `• Используйте СИЗ при работе с материалами\n`;
        response += `• Работайте в проветриваемом помещении\n\n`;

        if (topic && topic.includes('фотополимер') || topic && topic.includes('смола')) {
            response += `🧪 Для фотополимеров:\n`;
            response += `• Нитриловые перчатки (обязательно)\n`;
            response += `• Защитные очки\n`;
            response += `• Принудительная вентиляция\n`;
            response += `• Утилизация отходов по инструкции\n`;
        }

        return response;
    }

    /**
     * Форматирование совета по расчетам
     */
    formatCalculationAdvice(order, parameter) {
        if (!order) {
            return 'Для получения рекомендаций по параметрам печати, пожалуйста, загрузите модель в калькулятор.';
        }

        let advice = '📊 РЕКОМЕНДАЦИИ ПО ПАРАМЕТРАМ\n\n';
        
        if (parameter === 'temperature' || !parameter) {
            advice += `🌡️ Температура: Используйте рекомендованную для выбранного материала\n`;
        }
        if (parameter === 'speed' || !parameter) {
            advice += `⚡ Скорость: Начните с 50-60 мм/с для первого слоя\n`;
        }
        if (parameter === 'layer' || !parameter) {
            advice += `📏 Слой: ${order.layerHeight || '0.2'} мм — хороший баланс качества и скорости\n`;
        }
        if (parameter === 'infill' || !parameter) {
            advice += `🔲 Заполнение: ${order.infill || '20'}% подходит для большинства деталей\n`;
        }

        advice += '\n💡 Для точного расчета используйте данные слайсера.';
        
        return advice;
    }

    /**
     * Ответ на приветствие
     */
    getGreetingResponse() {
        const hour = new Date().getHours();
        let greeting = 'Доброе утро';
        if (hour >= 12) greeting = 'Добрый день';
        if (hour >= 17) greeting = 'Добрый вечер';
        if (hour >= 23 || hour < 6) greeting = 'Доброй ночи';

        return `${greeting}! Я — 3D MONOLITH AI Engineer.\n\nГотов помочь с:\n• Настройкой принтеров\n• Выбором материалов\n• Решением проблем печати\n• Расчетом параметров\n\nЧто вас интересует?`;
    }

    /**
     * Ответ на неизвестный запрос
     */
    getUnknownResponse(message) {
        return `Я не совсем понял ваш вопрос: "${message}"\n\nЯ специализируюсь на:\n• Парк принтеров — информация об оборудовании\n• Материалы — свойства и параметры\n• Неисправности — диагностика и решения\n• Безопасность — правила и рекомендации\n• Расчеты — параметры печати\n\nПопробуйте перефразировать вопрос или выберите тему из списка выше.`;
    }

    /**
     * Резервный ответ при ошибке модели
     */
    generateFallbackResponse(message) {
        return this.generateWithKnowledgeBase(message);
    }

    // ============================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================

    addToHistory(entry) {
        this.chatHistory.push(entry);
        if (this.chatHistory.length > this.maxHistoryLength) {
            this.chatHistory.shift();
        }
    }

    notifyStatus(status, message) {
        if (this.onStatusChange) {
            this.onStatusChange({ status, message });
        }
    }

    notifyMessage(messageData) {
        if (this.onMessageReceived) {
            this.onMessageReceived(messageData);
        }
    }

    // Обновление контекста
    updateContext(context) {
        this.appContext = { ...this.appContext, ...context };
    }

    setPrinters(printers) {
        this.appContext.printers = printers;
    }

    setMaterials(materials) {
        this.appContext.materials = materials;
    }

    setCurrentOrder(order) {
        this.appContext.currentOrder = order;
    }

    setSelectedPrinter(printer) {
        this.appContext.selectedPrinter = printer;
    }

    setSelectedMaterial(material) {
        this.appContext.selectedMaterial = material;
    }

    // Утилиты
    translatePrinterState(state) {
        const states = {
            'active': '🟢 Активен',
            'printing': '🔵 В печати',
            'maintenance': '🟡 Обслуживание',
            'broken': '🔴 Неисправен',
            'offline': '⚪ Офлайн'
        };
        return states[state] || state;
    }

    translateMaterialType(type) {
        const types = {
            'pla': 'PLA (Полилактид)',
            'abs': 'ABS (Акрилонитрилбутадиенстирол)',
            'petg': 'PETG (Полиэтилентерефталат)',
            'tpu': 'TPU (Термопластичный полиуретан)',
            'nylon': 'Nylon (Полиамид)',
            'pc': 'PC (Поликарбонат)',
            'peek': 'PEEK (Полиэфирэфиркетон)',
            'sla': 'SLA (Фотополимер)',
            'photopolymer': 'Фотополимерная смола'
        };
        return types[type?.toLowerCase()] || type;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('ru-RU');
    }

    extractProblem(message) {
        const problems = ['отслоение', 'сдвиг слоев', 'засор', 'не экструдит', 'пузыри', 'коробление'];
        return problems.find(p => message.includes(p)) || 'неизвестная проблема';
    }

    extractSafetyTopic(message) {
        if (message.includes('фотополимер') || message.includes('смола')) return 'фотополимеры';
        if (message.includes('пластик')) return 'термопласты';
        if (message.includes('сопло')) return 'работа с хотэндом';
        return 'общие правила';
    }

    extractParameter(message) {
        if (message.includes('температур')) return 'temperature';
        if (message.includes('скорост')) return 'speed';
        if (message.includes('слой')) return 'layer';
        if (message.includes('заполнен')) return 'infill';
        return null;
    }

    getPrinterAdvice(printer) {
        if (printer.state === 'active') return 'Готов к работе. Рекомендуется калибровка стола перед печатью.';
        if (printer.state === 'printing') return 'Занят печатью. Не прерывайте процесс без необходимости.';
        if (printer.state === 'maintenance') return 'На обслуживании. Завершите ТО перед использованием.';
        if (printer.state === 'broken') return 'Требуется ремонт. Обратитесь к специалисту.';
        return 'Проверьте подключение и настройки.';
    }

    getMaterialAdvice(material) {
        if (material.type === 'abs') return 'Используйте закрытую камеру. Риск коробления высокий.';
        if (material.type === 'pla') return 'Оптимален для начинающих. Печатайте при 190-220°C.';
        if (material.type === 'petg') return 'Хорошая адгезия. Избегайте перегрева (>250°C).';
        if (material.type === 'tpu') return 'Печатайте медленно. Используйте прямой экструдер.';
        if (material.type === 'sla' || material.type === 'photopolymer') return 'Работайте в СИЗ. Обеспечьте вентиляцию.';
        return 'Следуйте рекомендациям производителя.';
    }
}

/**
 * СЛОЙ БЕЗОПАСНОСТИ (Safety Layer)
 * Многоуровневая система защиты от вредных советов
 */
class SafetyLayer {
    constructor() {
        // Уровень 2: Красные линии (Hard Rules)
        this.redLines = [
            {
                pattern: /отключ[ия]и?т?[ью]?\s+(питани[ея]|принтер|включ)/i,
                warning: 'Отключение питания при работе принтера может привести к:\n• Повреждению электроники\n• Потере данных печати\n• Поломке экструдера\n\nНикогда не отключайте питание во время печати!'
            },
            {
                pattern: /разбира[йт]?[ия]и?т?[ью]?\s+(хотэнд|сопло|экструдер)/i,
                warning: 'Разборка хотэнда возможна ТОЛЬКО после полного остывания (<30°C)!\n\nГорячие компоненты могут вызвать:\n• Серьезные ожоги\n• Повреждение резьбы\n• Деформацию деталей'
            },
            {
                pattern: /фотополимер|смола|sla/i,
                requires: ['перчатк', 'защит', 'вентиляц', 'маск', 'сиз'],
                warning: 'Работа с фотополимерами требует обязательного использования СИЗ:\n• Нитриловые перчатки\n• Защитные очки\n• Принудительная вентиляция\n\nБез защиты возможно:\n• Химические ожоги\n• Аллергические реакции\n• Отравление парами'
            },
            {
                pattern: /каслива?н?и?е?\s+(смол|отверд)/i,
                warning: 'Утилизация фотополимеров:\n• Не сливайте в канализацию!\n• Полностью отвердите УФ-лампой\n• Утилизируйте как химические отходы'
            },
            {
                pattern: /чист[ия]и?т?[ью]?\s+(сопло|дюзу).*(горяч|нагрет)/i,
                warning: 'Чистка сопла возможна только при температуре выше 200°C для PLA или после остывания для механической чистки.\n\nУточните метод чистки:\n• Холодная чистка (иглой после нагрева)\n• Горячая продувка'
            }
        ];

        // Паттерны опасных ответов (Уровень 3)
        this.dangerousResponsePatterns = [
            /отключ[ия]и?т?[ью]?\s+питани/i,
            /разбира[йт]?[ия]и?т?[ью].*горяч/i,
            /не\s+нужн[оы].*защит/i,
            /можно\s+без\s+перчаток/i,
            /игнориру[йт]?[ия]и?т?[ью]?/i
        ];
    }

    /**
     * Проверка запроса пользователя
     */
    validateUserInput(input) {
        for (const rule of this.redLines) {
            if (rule.pattern.test(input)) {
                // Если правило требует определенных слов
                if (rule.requires) {
                    const hasRequirement = rule.requires.some(req => input.toLowerCase().includes(req));
                    if (!hasRequirement) {
                        return {
                            safe: false,
                            warning: rule.warning
                        };
                    }
                } else {
                    // Прямое нарушение
                    return {
                        safe: false,
                        warning: rule.warning
                    };
                }
            }
        }

        return { safe: true };
    }

    /**
     * Валидация сгенерированного ответа
     */
    validateResponse(response) {
        const lowerResponse = response.toLowerCase();

        for (const pattern of this.dangerousResponsePatterns) {
            if (pattern.test(lowerResponse)) {
                return {
                    safe: false,
                    warning: 'Ответ содержит потенциально опасные рекомендации. Требуется проверка специалистом.'
                };
            }
        }

        return { safe: true };
    }
}

/**
 * БАЗА ЗНАНИЙ (Knowledge Base)
 * Структурированное хранилище данных для RAG
 */
class KnowledgeBase {
    constructor() {
        this.isReady = false;
        this.printers = [];
        this.materials = [];
        this.troubleshooting = [];
        this.safetyGuides = [];
    }

    async initialize() {
        // Загрузка данных из приложения
        await this.loadFromApp();
        
        // Заполнение базы неисправностей
        this.loadTroubleshootingDB();
        
        // Заполнение руководств по безопасности
        this.loadSafetyGuides();
        
        this.isReady = true;
    }

    async loadFromApp() {
        // Попытка получить данные из глобального состояния приложения
        if (typeof window !== 'undefined') {
            if (window.printerSystem) {
                this.printers = window.printerSystem.getAllPrinters?.() || [];
            }
            if (window.materialsModule) {
                this.materials = window.materialsModule.getAllMaterials?.() || [];
            }
        }
    }

    loadTroubleshootingDB() {
        this.troubleshooting = [
            {
                problem: 'Отслоение (warpping)',
                causes: [
                    'Недостаточная адгезия первого слоя',
                    'Слишком высокая скорость охлаждения',
                    'Неправильная температура стола',
                    'Сквозняк в помещении',
                    'Загрязненная поверхность стола'
                ],
                solutions: [
                    'Откалибруйте стол (особенно первый слой)',
                    'Используйте клей/лак для адгезии',
                    'Увеличьте температуру стола на 5-10°C',
                    'Отключите обдув для первых слоев',
                    'Используйте enclosure для ABS',
                    'Очистите поверхность стола изопропиловым спиртом'
                ],
                safetyWarning: 'При очистке стола используйте перчатки и работайте в проветриваемом помещении.'
            },
            {
                problem: 'Сдвиг слоев (layer shift)',
                causes: [
                    'Слишком высокая скорость печати',
                    'Ослабленные ремни',
                    'Препятствие движения оси',
                    'Неправильное ускорение',
                    'Загрязнение направляющих'
                ],
                solutions: [
                    'Снизьте скорость печати на 20-30%',
                    'Проверьте натяжение ремней (должны звенеть как басовая струна)',
                    'Проверьте свободное движение осей от руки',
                    'Настройте ускорения в прошивке',
                    'Очистите и смажьте направляющие'
                ]
            },
            {
                problem: 'Засор сопла (clog)',
                causes: [
                    'Печать при слишком низкой температуре',
                    'Попадание мусора в филамент',
                    'Длительный простой с материалом',
                    'Некачественный филамент',
                    'Повреждение тефлоновой трубки'
                ],
                solutions: [
                    'Выполните холодную протяжку (atomic pull)',
                    'Прочистите сопло иглой 0.3-0.4 мм при нагреве',
                    'Замените тефлоновую трубку при износе',
                    'Используйте фильтр филамента',
                    'При серьезном засоре — разберите хотэнд'
                ],
                safetyWarning: '⚠️ Чистка при нагреве: используйте термоперчатки! Не касайтесь горячих частей!'
            },
            {
                problem: 'Не экструдит (no extrusion)',
                causes: [
                    'Засор сопла',
                    'Сработал механизм защиты от проскальзывания',
                    'Филамент запутался на катушке',
                    'Неправильная высота первого слоя',
                    'Износ шестерни экструдера'
                ],
                solutions: [
                    'Проверьте свободную подачу филамента',
                    'Очистите сопло (см. "Засор сопла")',
                    'Отрегулируйте прижим филамента',
                    'Перекалибруйте первый слой',
                    'Замените шестерню экструдера при износе'
                ]
            },
            {
                problem: 'Пузыри и поры (bubble)',
                causes: [
                    'Влага в филаменте',
                    'Слишком высокая температура',
                    'Быстрое охлаждение',
                    'Некачественный материал'
                ],
                solutions: [
                    'Просушите филамент (PLA: 45°C 4-6ч, ABS: 80°C 6-8ч)',
                    'Снизьте температуру на 5-10°C',
                    'Храните филамент в сухом месте с силикагелем',
                    'Используйте сушилку для филамента во время печати'
                ]
            },
            {
                problem: 'Сахарная вата (stringing)',
                causes: [
                    'Недостаточный retractions',
                    'Слишком высокая температура',
                    'Длинное перемещение без retractions',
                    'Износ сопла'
                ],
                solutions: [
                    'Увеличьте retractions (1-6 мм для direct, 4-8 мм для bowden)',
                    'Снизьте температуру на 5°C',
                    'Включите комбинированный retractions',
                    'Увеличьте скорость перемещения',
                    'Замените сопло при износе (после 500+ часов)'
                ]
            }
        ];
    }

    loadSafetyGuides() {
        this.safetyGuides = [
            {
                topic: 'Работа с ABS',
                rules: [
                    'Печатайте только в закрытой камере',
                    'Обеспечьте вентиляцию помещения',
                    'Избегайте вдыхания паров стирола',
                    'Используйте маску при длительной печати'
                ]
            },
            {
                topic: 'Работа с фотополимерами (SLA)',
                rules: [
                    'Обязательно используйте нитриловые перчатки',
                    'Защитные очки о��язательны',
                    'Работ��йте только при включенной вентиляции',
                    'Не допускайте попадания на кожу',
                    'Утилизируйте отходы правильно'
                ]
            },
            {
                topic: 'Обслуживание хотэнда',
                rules: [
                    'Полностью остудите перед разборкой (<30°C)',
                    'Используйте термоперчатки при работе с нагретым',
                    'Отключите питание перед обслуживанием',
                    'Проверьте изоляцию проводов'
                ]
            },
            {
                topic: 'Электробезопасность',
                rules: [
                    'Не работайте с подключенным питанием',
                    'Проверяйте заземление',
                    'Используйте УЗО',
                    'Регулярно проверяйте соединения'
                ]
            }
        ];
    }

    /**
     * Поиск релевантных данных
     */
    search(query, intent) {
        const result = {
            printers: this.searchPrinters(intent.printerName),
            materials: this.searchMaterials(intent.materialName),
            troubleshooting: this.searchTroubleshooting(intent.problem),
            safety: this.searchSafety(intent.topic)
        };

        return result;
    }

    searchPrinters(printerName) {
        if (!printerName) return this.printers;
        return this.printers.filter(p => p.name?.toLowerCase().includes(printerName.toLowerCase()));
    }

    searchMaterials(materialName) {
        if (!materialName) return this.materials;
        return this.materials.filter(m => 
            m.name?.toLowerCase().includes(materialName.toLowerCase()) ||
            m.type?.toLowerCase().includes(materialName.toLowerCase())
        );
    }

    searchTroubleshooting(problem) {
        if (!problem) return [];
        const lowerProblem = problem.toLowerCase();
        return this.troubleshooting.filter(t => 
            t.problem.toLowerCase().includes(lowerProblem) ||
            t.causes.some(c => c.toLowerCase().includes(lowerProblem)) ||
            t.solutions.some(s => s.toLowerCase().includes(lowerProblem))
        );
    }

    searchSafety(topic) {
        if (!topic) return this.safetyGuides;
        return this.safetyGuides.filter(s => s.topic.toLowerCase().includes(topic.toLowerCase()));
    }
}

// Экспорт для использования в приложении
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIEngineer, SafetyLayer, KnowledgeBase };
}

if (typeof window !== 'undefined') {
    window.AIEngineer = AIEngineer;
    window.SafetyLayer = SafetyLayer;
    window.KnowledgeBase = KnowledgeBase;
}
