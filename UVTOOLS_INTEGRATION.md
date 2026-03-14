# 🚀 Интеграция UVTools для 3D MONOLITH SUPREME

## 📦 Что такое UVTools?

**UVTools** — это профессиональный инструмент с открытым исходным кодом для работы с файлами SLA/DLP 3D печати.

**Сайт**: https://github.com/sn4k3/UVtools

---

## ✅ Преимущества для 3D MONOLITH

| Проблема | Решение UVTools |
|----------|----------------|
| ❌ Неверное разрешение (176 x 75468) | ✅ Точные данные из файла |
| ❌ Миниатюра не найдена | ✅ Извлечение превью |
| ❌ Время 0.6 ч (непонятно) | ✅ Точное время печати |
| ❌ Самописный парсер | ✅ Профессиональный инструмент |

---

## 🔧 Установка

### Шаг 1: Установка .NET 8 (если не установлен)

```bash
# Проверка
dotnet --version

# Установка: https://dotnet.microsoft.com/download
```

### Шаг 2: Установка UVTools CLI

```bash
dotnet tool install -g uvtools
```

### Шаг 3: Проверка

```bash
uvtools --version
```

---

## 💻 Использование в Electron

### 1. Подключение в main.js

```javascript
const { ipcMain } = require('electron');
const { parseSLAFile } = require('./src/electron/uvtools-bridge');

ipcMain.handle('parse-sla-file', async (event, filePath) => {
    try {
        const result = await parseSLAFile(filePath);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
```

### 2. Вызов из renderer (index.html)

```javascript
// Вместо window.SLACostCalculator.parseFile
const result = await window.electronAPI.parseSLAFile(filePath);

if (result.success) {
    // result.data содержит:
    // - volume: 3.1 (см³)
    // - weight: 3.4 (г)
    // - printTime: 2205 (сек)
    // - layers: 96
    // - thumbnailUrl: "data:image/jpeg..."
}
```

---

## 📊 Пример вывода UVTools

```json
{
  "format": "Anycubic Photon Mono (.pwmo)",
  "printer": {
    "name": "Anycubic Photon Mono",
    "resolution": { "x": 1620, "y": 2560 }
  },
  "layers": 96,
  "layerHeight": 0.05,
  "printTime": 2205,
  "volume": 3.106,
  "weight": 3.417,
  "thumbnail": "base64..."
}
```

---

## 🎯 Что это даёт проекту?

### 1. **Точные данные**
- Разрешение: 1620 x 2560 (вместо 176 x 75468)
- Объём: 3.1 см³ (точно)
- Время: 36 мин 45 сек (вместо 0.6 ч)

### 2. **Миниатюра**
- Извлечение превью из файла
- Отображение в интерфейсе

### 3. **Поддержка всех форматов**
- `.pwmo` (Anycubic)
- `.ctb` / `.ctb2` (Chitubox)
- `.photon` (Anycubic старый)
- `.sl1` / `.sl1s` (Prusa)
- `.lyt` (Lychee)
- `.goo` (Elegoo)

---

## 📁 Структура проекта

```
3D MONOLITH/
├── src/
│   ├── electron/
│   │   ├── main.js              # Electron main process
│   │   ├── uvtools-bridge.js    # Мост к UVTools
│   │   └── preload.js           # Preload script
│   ├── modules/
│   │   └── sla-cost-calculator.js  # Встроенный парсер (fallback)
│   └── index.html               # UI
├── package.json
└── README.md
```

---

## 🔄 Fallback режим

Если UVTools не установлен, система автоматически использует встроенный парсер:

```javascript
// uvtools-bridge.js
if (!uvtoolsInstalled) {
    return fallbackParse(filePath); // sla-cost-calculator.js
}
```

---

## 🎨 Визуализация срезов

UVTools также позволяет извлекать отдельные слои:

```javascript
// Извлечение слоя №10
const command = `uvtools extract "file.pwmo" --layer 10 --output "layer10.png"`;
```

Это позволит создать **послойный просмотрщик** как в настоящих слайсерах!

---

## 📝 Следующие шаги

1. ✅ Установить UVTools CLI
2. ✅ Настроить Electron main.js
3. ✅ Добавить IPC обработчики
4. ✅ Обновить интерфейс для отображения миниатюры
5. ✅ Добавить послойный просмотр (опционально)

---

## ❓ Вопросы?

- **UVTools GitHub**: https://github.com/sn4k3/UVtools
- **Документация**: https://github.com/sn4k3/UVtools/wiki

---

**3D MONOLITH SUPREME 2026** — Профессиональный калькулятор для SLA/FDM печати
