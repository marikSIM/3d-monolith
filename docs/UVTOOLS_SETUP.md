# 🔧 UVTools — Установка и настройка

## 📋 Что такое UVTools?

**UVTools** — это утилита с открытым исходным кодом для работы с файлами фотополимерной 3D-печати (.pwmo, .ctb, .lyt и др.).

**Возможности:**
- 📖 Чтение метаданных (время печати, объём смолы, количество слоёв)
- 🔍 Просмотр слоёв и выявление проблем
- 🔄 Конвертация между форматами
- 📊 Точный расчёт стоимости печати

**Репозиторий:** https://github.com/sn4k3/UVtools

---

## 🚀 Установка UVTools

### Способ 1: Готовый исполняемый файл (рекомендуется)

1. **Скачайте последнюю версию:**
   - Перейдите на https://github.com/sn4k3/UVtools/releases
   - Скачайте файл `UVtoolsCmd-win-x64.zip` (для Windows)

2. **Распакуйте в удобную папку:**
   ```
   C:\Program Files\UVtools\
   ```

3. **Добавьте в PATH (опционально):**
   - Откройте «Система» → «Дополнительные параметры системы»
   - Нажмите «Переменные среды»
   - В «Системные переменные» найдите `Path`
   - Добавьте путь: `C:\Program Files\UVtools\`

4. **Проверьте установку:**
   ```cmd
   UVtoolsCmd --core-version
   ```

### Способ 2: Через .NET Global Tools

**Требования:** Установленный .NET 6.0 или выше

1. **Установите .NET SDK:**
   - Скачайте с https://dotnet.microsoft.com/download

2. **Установите UVTools:**
   ```cmd
   dotnet tool install -g UVtoolsCmd
   ```

3. **Проверьте установку:**
   ```cmd
   UVtoolsCmd --version
   ```

### Способ 3: Сборка из исходного кода

**Требования:** Git, .NET 6.0 SDK

```cmd
git clone https://github.com/sn4k3/UVtools.git
cd UVtools
dotnet build -c Release
```

---

## ⚙️ Настройка в 3D MONOLITH

### Автоматическое обнаружение

Модуль `UVToolsBridge` автоматически ищет UVTools в следующих местах:

1. `UVtoolsCmd` (в PATH)
2. `UVtools` (в PATH)
3. `C:\Program Files\UVtools\UVtoolsCmd.exe`
4. `C:\Program Files (x86)\UVtools\UVtoolsCmd.exe`

### Ручная настройка пути

Если UVTools установлен в другом месте:

```javascript
// В index.html или через консоль
window.UVToolsBridge.setPath('C:\\MyApps\\UVtools\\UVtoolsCmd.exe');
```

---

## 📖 Использование

### 1. Чтение метаданных из PWMO

```javascript
const metadata = await window.UVToolsBridge.readMetadata('C:\\models\\test.pwmo');

console.log('Время печати:', metadata.printTimeHours, 'ч');
console.log('Объём смолы:', metadata.resinVolumeMl, 'мл');
console.log('Количество слоёв:', metadata.layerCount);
console.log('Размеры:', metadata.dimensions);
```

### 2. Расчёт стоимости

```javascript
const cost = await window.UVToolsBridge.calculateCost('C:\\models\\test.pwmo', {
    resinType: 'standard',
    printerHourlyRate: 250,
    electricityRate: 5.5,
    margin: 1.25
});

console.log('Себестоимость:', cost.productionCost, '₽');
console.log('Итоговая цена:', cost.total, '₽');
```

### 3. Извлечение содержимого

```javascript
const result = await window.UVToolsBridge.extract(
    'C:\\models\\test.pwmo',
    'C:\\output\\extracted'
);

// В папке будут:
// - Изображения слоёв (PNG)
// - Файл конфигурации (JSON/XML)
// - Миниатюры
```

### 4. Конвертация формата

```javascript
// Конвертация PWMO → CTB
await window.UVToolsBridge.convert(
    'C:\\models\\test.pwmo',
    'ctb',
    'C:\\output\\test.ctb'
);
```

---

## 🛠️ CLI команды

### Просмотр метаданных
```cmd
UVtoolsCmd print-properties model.pwmo
```

**Пример вывода:**
```
Printer Model: Anycubic Photon Mono
Resolution: 162 x 102 mm
Layer Count: 1250
Layer Height: 0.05 mm
Print Time: 4h 31m 12s
Resin Volume: 45.3 ml
Resin Weight: 49.8 g
Normal Exposure: 2.5 s
Bottom Exposure: 30 s
Bottom Layers: 5
Lift Height: 5.0 mm
Lift Speed: 60 mm/min
```

### Извлечение содержимого
```cmd
UVtoolsCmd extract model.pwmo C:\output\folder
```

### Конвертация
```cmd
UVtoolsCmd convert input.pwmo ctb output.ctb
```

### Проверка проблем
```cmd
UVtoolsCmd print-issues model.pwmo
```

---

## 📊 Поддерживаемые форматы

| Формат | Расширения | Чтение | Запись |
|--------|-----------|--------|--------|
| Photon Mono | .pwmo, .pwma, .pwms, .pwx | ✅ | ✅ |
| Photon | .pws, .photon | ✅ | ✅ |
| Chitubox | .ctb, .ctb2, .cbddlp | ✅ | ✅ |
| PrusaSlicer | .sl1, .sl1s | ✅ | ✅ |
| Lychee | .lyt, .lgs | ✅ | ⏳ |

---

## ⚠️ Решение проблем

### «UVtoolsCmd не является внутренней или внешней командой»

**Решение:**
1. Убедитесь, что UVTools установлен
2. Добавьте папку с UVtoolsCmd.exe в PATH
3. Или укажите полный путь в настройках:
   ```javascript
   window.UVToolsBridge.setPath('C:\\Program Files\\UVtools\\UVtoolsCmd.exe');
   ```

### «Отказано в доступе»

**Решение:**
1. Запустите приложение от имени администратора
2. Проверьте права доступа к папке UVTools

### «Не удалось распарсить файл»

**Возможные причины:**
- Файл повреждён
- Неподдерживаемый формат
- Новая версия слайсера

**Решение:**
1. Обновите UVTools до последней версии
2. Попробуйте открыть файл в Photon Workshop
3. Отправьте файл разработчикам UVTools для анализа

---

## 🔗 Полезные ссылки

- **GitHub:** https://github.com/sn4k3/UVtools
- **Wiki:** https://github.com/sn4k3/UVtools/wiki
- **NuGet пакет:** https://www.nuget.org/packages/UVtools.Core
- **Обсуждения:** https://github.com/sn4k3/UVtools/discussions

---

## 📝 Интеграция в 3D MONOLITH

### Структура модулей

```
3D MONOLITH/
├── src/modules/
│   ├── uvtools-bridge.js    # Мост для UVTools
│   ├── sla-cost-calculator.js # Расчёт стоимости SLA
│   └── calculator-advanced.js # Расширенный калькулятор
├── main.js                   # Electron (добавлен execCommand)
├── preload.js                # Контекстный мост
└── index.html                # UI
```

### Последовательность работы

1. Пользователь нажимает «📊 PWMO»
2. `loadPWMOWithCalculator()` открывает диалог
3. Проверяется доступность UVTools
4. Если UVTools доступен → чтение метаданных через CLI
5. Если нет → резервный парсинг через SLACostCalculator
6. Заполняются поля калькулятора
7. Пересчитывается стоимость

---

## ✅ Проверка установки

Выполните в консоли приложения:

```javascript
// Проверка доступности UVTools
const status = await window.UVToolsBridge.init();
console.log(status);
// { available: true, version: 'detected', message: '✅ UVTools готов к работе' }

// Чтение тестового файла
const metadata = await window.UVToolsBridge.readMetadata('path/to/test.pwmo');
console.log(metadata);
```

Если всё работает — вы увидите метаданные файла!
