# 🔄 ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ AI

## ✅ Исправление от 8 марта 2026

**Проблема:** Ошибка "Неверный режим" при переключении

**Решение:** Исправлена проверка в методе `switchMode()` (файл `src/modules/hybrid-ai.js`)

**Строка:** 198-203

---

## 🎯 Как переключать режимы

### Способ 1: Через UI (рекомендуется)

1. **Откройте AI чат:**
   - Нажмите 🔧 в правом нижнем углу экрана

2. **Найдите переключатель внизу:**
   ```
   ┌─────────────────────────────┐
   │  📚    🤖    🌐            │
   │  База  LLM   Web           │
   └─────────────────────────────┘
   ```

3. **Нажмите на нужный режим:**
   - 📚 **База** — база знаний (быстро)
   - 🤖 **LLM** — локальная модель (умно)
   - 🌐 **Web** — WebLLM (современно)

---

### Способ 2: Через консоль

Откройте DevTools (F12) → Console → Введите:

```javascript
// Переключение на базу знаний
await window.hybridAI.switchMode('knowledge-base');

// Переключение на локальную LLM
await window.hybridAI.switchMode('local-llm');

// Переключение на WebLLM
await window.hybridAI.switchMode('webllm');

// Проверка текущего режима
console.log(window.hybridAI.currentMode);

// Проверка доступных режимов
window.hybridAI.getAvailableModes();
```

---

## 📊 Статусы режимов

### 📚 База знаний (Knowledge Base)

**Статус:** ✅ Всегда доступен

**Индикатор:**
- ✅ Зелёная галочка "✓ Режим готов"
- ✅ Кнопка активна (синяя)

**Что делать если не работает:**
- Перезагрузите страницу (F5)
- Проверьте консоль на ошибки

---

### 🤖 Локальная LLM

**Статус:** ⚠️ Требуется загрузка модели

**Индикаторы:**
- ✅ Кнопка активна — модель загружена
- ⚪ Кнопка серая — модель не загружена

**Как загрузить модель:**

1. Нажмите на кнопку 🤖 LLM
2. Появится диалог: "Переключиться на..."
3. Нажмите "OK"
4. Откроется окно выбора файла
5. Выберите `.gguf` файл
6. Дождитесь загрузки

**Где взять модель:**
- [TinyLlama-1.1B-Chat-v1.0-GGUF](https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF)
- [Mistral-7B-Instruct-v0.2-GGUF](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF)
- [Llama-2-7B-Chat-GGUF](https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF)

---

### 🌐 WebLLM

**Статус:** ⚠️ Требуется WebGPU

**Индикаторы:**
- ✅ Кнопка активна — WebGPU доступен
- ⚪ Кнопка серая — WebGPU недоступен

**Проверка WebGPU:**

```javascript
// В консоли
if (navigator.gpu) {
    console.log('✅ WebGPU доступен');
} else {
    console.log('❌ WebGPU недоступен');
}
```

**Если WebGPU недоступен:**
- Обновите драйверы видеокарты
- Используйте режим базы знаний или локальную LLM

---

## 🐛 Диагностика

### Кнопка не переключается

**Проблема:** Кнопка остаётся серой

**Решение:**
1. Проверьте доступность режима:
   ```javascript
   window.hybridAI.getAvailableModes()
   ```
2. Для LLM: загрузите модель
3. Для Web: проверьте WebGPU

### Ошибка "Неверный режим"

**Проблема:** Ошибка в консоли при переключении

**Решение:**
1. Убедитесь что используете правильные названия:
   - `'knowledge-base'` (не `'База'`)
   - `'local-llm'` (не `'LLM'`)
   - `'webllm'` (не `'Web'`)

2. Обновите файл `src/modules/hybrid-ai.js` (исправление от 8 марта 2026)

### Переключатель не виден

**Проблема:** Нет кнопок внизу чата

**Решение:**
1. Проверьте что гибридная AI система загрузилась:
   ```javascript
   window.hybridAI.getStats()
   ```
2. Должно быть: `isInitialized: true`
3. Если `false` — перезагрузите страницу

---

## 📊 Тестирование

### Быстрый тест:

```javascript
// 1. Проверка системы
const stats = window.hybridAI.getStats();
console.log('Статус:', stats);

// 2. Проверка доступных режимов
const modes = window.hybridAI.getAvailableModes();
console.log('Режимы:', modes);

// 3. Переключение на базу знаний
await window.hybridAI.switchMode('knowledge-base');
console.log('✅ Переключено на базу знаний');

// 4. Тестовый запрос
await window.hybridAI.sendMessage('Какая температура для PLA?');
```

### Ожидаемый результат:

```
✅ Статус: {
  mode: 'knowledge-base',
  isInitialized: true,
  knowledgeBaseLoaded: true
}

✅ Режимы: [
  {id: 'knowledge-base', available: true},
  {id: 'local-llm', available: false},
  {id: 'webllm', available: false}
]

✅ Переключено на базу знаний

✅ Ответ в чате: 📦 PLA...
```

---

## 📚 Дополнительная информация

- [Полная документация](docs/HYBRID_AI_SYSTEM.md)
- [Руководство пользователя](AI_GUIDE.md)
- [Настройка и установка](SETUP.md)

---

**3D MONOLITH AI System v2.0** © 2026

*Дата исправления: 8 марта 2026 г.*
