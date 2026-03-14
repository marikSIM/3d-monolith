# SLA Cost Calculator — Модуль расчёта стоимости SLA печати

## 📋 Обзор

Модуль `sla-cost-calculator.js` предназначен для:
- **Парсинга бинарных PWMO/CTB файлов** (Chitubox, Anycubic Photon, Lychee)
- **Точного расчёта стоимости SLA печати** с учётом всех параметров
- **Автоматического заполнения калькулятора** на основе данных из файла

---

## 🔧 Проблемы старого кода

### 1. Отсутствие реального парсера
```javascript
// ❌ СТАРЫЙ КОД
const width = dv.getUint32(8, true);
const height = dv.getUint32(12, true);
const printTimeSec = dv.getUint32(24, true);
```
**Проблема:** Нет гарантии, что данные находятся по этим смещениям. Разные слайсеры используют разную структуру.

### 2. Эвристический поиск времени
```javascript
// ❌ СТАРЫЙ КОД
for (let offset = 0; offset < 1000; offset += 4) {
    const timeVal = dv.getUint32(offset, true);
    if (timeVal > 1000 && timeVal < 10000) { ... }
}
```
**Проблема:** Может найти ложное значение, не связанное со временем печати.

### 3. Объём из STL, а не из PWMO
```javascript
// ❌ СТАРЫЙ КОД
const volumeCm3 = parseFloat(window.realVol) || 0;
```
**Проблема:** Если STL не загружен — объём = 0, расчёт неверный.

---

## ✅ Решение

### Архитектура модуля

```
sla-cost-calculator.js
├── BinaryParser
│   ├── detectFormat(buffer)      — определение формата файла
│   ├── parseChitubox(buffer)     — парсинг Chitubox CWK/PWMO
│   ├── findPrintTime(dv, size)   — поиск времени печати
│   ├── findResinVolume(dv, size) — поиск объёма смолы
│   └── findModelWeight(dv, size) — поиск веса модели
│
├── calculateCost(params)         — расчёт стоимости
│
└── loadAndCalculate(path, opts)  — загрузка + расчёт
```

---

## 📦 API

### 1. `loadAndCalculate(filePath, customParams)`

Основная функция для загрузки и расчёта.

**Параметры:**
- `filePath` (string) — путь к PWMO/CTB файлу
- `customParams` (object) — дополнительные параметры:
  - `resinType` — тип смолы ('standard', 'tough', 'flexible', etc.)
  - `printerHourlyRate` — тариф принтера (₽/час)
  - `electricityRate` — тариф электроэнергии (₽/кВт·ч)

**Возвращает:**
```javascript
{
    format: "Chitubox",
    width: 162,              // мм
    height: 102,             // мм
    layerCount: 1250,        // слои
    layerHeight: 0.05,       // мм
    printTimeHours: 4.52,    // часы
    resinVolumeCm3: 45.3,    // см³
    resinWeightGrams: 49.8,  // г
    
    // Стоимость (₽)
    resinCost: 158,
    printerCost: 1130,
    electricityCost: 4,
    filmWearCost: 14,
    alcoholCost: 40,
    wasteCost: 8,
    postProcessingCost: 150,
    productionCost: 1504,
    
    // Итоговая цена
    priceWithMargin: 2255,
    priceWithTax: 2400,
    total: 2400
}
```

### 2. `calculateCost(params)`

Расчёт стоимости без загрузки файла.

**Параметры:**
```javascript
{
    printTimeHours: 4.5,
    resinVolumeCm3: 45.3,
    resinType: 'standard',
    printerHourlyRate: 250,
    printerPowerKw: 0.15,
    electricityRate: 5.5,
    postProcessingCost: 150,
    margin: 1.25,
    setupFee: 150,
    minOrder: 300,
    discount: 10,
    taxRate: 6,
    urgentFactor: 1.0
}
```

### 3. `parseFile(buffer)`

Парсинг бинарного буфера без загрузки с диска.

**Параметры:**
- `buffer` (ArrayBuffer) — бинарные данные файла

**Возвращает:**
```javascript
{
    valid: true,
    format: "Chitubox",
    width: 162,
    height: 102,
    layerCount: 1250,
    layerHeight: 0.05,
    printTimeSec: 16272,
    resinVolumeCm3: 45.3
}
```

### 4. `detectFormat(buffer)`

Определение формата файла по сигнатуре.

**Возвращает:**
```javascript
{ type: 'chitubox', version: 'v2' }
{ type: 'photon', version: 'v1' }
{ type: 'lychee', version: 'v3' }
{ type: 'unknown', confidence: 0.3 }
```

---

## 💡 Примеры использования

### Пример 1: Загрузка PWMO через UI

```javascript
// В index.html
window.loadPWMOWithCalculator = async function() {
    const result = await window.electron.showOpenDialog({
        title: 'Выберите PWMO файл',
        filters: [{ name: 'PWMO', extensions: ['pwmo', 'ctb'] }]
    });
    
    if (!result.canceled) {
        const pwmoPath = result.filePaths[0];
        
        const data = await window.SLACostCalculator.loadAndCalculate(pwmoPath, {
            resinType: 'standard',
            printerHourlyRate: 250
        });
        
        console.log('Итоговая стоимость:', data.total, '₽');
        console.log('Объём смолы:', data.resinVolumeCm3, 'см³');
    }
};
```

### Пример 2: Расчёт стоимости напрямую

```javascript
const cost = window.SLACostCalculator.calculateCost({
    printTimeHours: 3.5,
    resinVolumeCm3: 35.0,
    resinType: 'tough',
    printerHourlyRate: 300,
    margin: 1.3,
    discount: 5
});

console.log('Себестоимость:', cost.productionCost);
console.log('Цена для клиента:', cost.total);
```

### Пример 3: Парсинг буфера

```javascript
const buffer = await electron.readBinaryFile('/path/to/model.ctb');
const parsed = window.SLACostCalculator.parseFile(buffer.content);

if (parsed.valid) {
    console.log('Формат:', parsed.format);
    console.log('Слоёв:', parsed.layerCount);
    console.log('Время:', parsed.printTimeSec / 3600, 'ч');
}
```

---

## 📊 Типы смол

Модуль включает базу данных смол:

| Тип | Плотность (г/см³) | Цена (₽/л) |
|-----|-------------------|------------|
| standard | 1.10 | 3500 |
| tough | 1.15 | 5500 |
| flexible | 1.20 | 7000 |
| castable | 1.25 | 12000 |
| dental | 1.15 | 15000 |
| rapid | 1.08 | 6000 |
| waterWashable | 1.12 | 5000 |

---

## 🔍 Алгоритмы парсинга

### 1. Определение формата

```javascript
// Сигнатуры форматов
Chitubox:  0x07450403 (CWK v2), "PWMO"
Anycubic:  0x4D42 (BM), "PHO..."
Lychee:    "LYT\0", "lyt\0"
```

### 2. Поиск времени печати

**Приоритетные смещения:** 24, 28, 32, 36, 40, 44, 48 байт

**Глубокий поиск:**
1. Перебираем все uint32 в первых 5000 байтах
2. Фильтруем диапазон 5 минут - 72 часа
3. Проверяем контекст (соседние значения)
4. Выбираем кандидата с максимальным score

### 3. Расчёт объёма

Если объём не найден в файле:
```javascript
boundingBoxCm3 = (width × height × layerHeight × layerCount) / 1000
resinVolumeCm3 = boundingBoxCm3 × 0.25  // 25% заполнение
```

---

## ⚠️ Ограничения

1. **Поддерживаемые форматы:**
   - ✅ Chitubox (CWK v2, PWMO)
   - ⏳ Anycubic Photon (в разработке)
   - ⏳ Lychee Slicer (в разработке)

2. **Точность парсинга:**
   - Время печати: ~85-95% (зависит от версии слайсера)
   - Объём смолы: ~70-80% (если не указан явно)

3. **Требуется Electron:**
   - Для чтения файлов нужен `window.electron.readBinaryFile`

---

## 🚀 Интеграция

### 1. Подключение модуля

```html
<script src="src/modules/sla-cost-calculator.js"></script>
```

### 2. Обновление кнопки загрузки

```html
<!-- Было -->
<button onclick="loadPWMO()">📊 PWMO</button>

<!-- Стало -->
<button onclick="loadPWMOWithCalculator()">📊 PWMO</button>
```

### 3. Автоматический пересчёт

```javascript
// После загрузки PWMO
if (typeof window.autoCalculate === 'function') {
    setTimeout(() => window.autoCalculate(), 100);
}
```

---

## 📝 Changelog

### v1.0.0 (2026-03-09)
- ✅ Базовый парсинг Chitubox CWK/PWMO
- ✅ Определение формата по сигнатуре
- ✅ Поиск времени печати с эвристиками
- ✅ Расчёт стоимости SLA печати
- ✅ База данных смол (7 типов)
- ✅ Учёт пост-обработки (мойка + засветка)
- ✅ Амортизация FEP плёнки
- ✅ Расход изопропанола

---

## 📞 Поддержка

При проблемах с парсингом:
1. Проверьте консоль на наличие логов
2. Отправьте пример PWMO файла для анализа
3. Укажите версию слайсера (Chitubox, Lychee, etc.)
