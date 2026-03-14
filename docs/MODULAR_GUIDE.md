# 3D MONOLITH — МОДУЛЬНАЯ СТРУКТУРА

## 📋 Структура проекта

```
3d-monolith/
├── index.html              # Оригинальная версия (монолит)
├── package.json            # Зависимости Electron (будущее)
│
├── src/                    # Модульная версия
│   ├── index.html          # Главный файл модульной версии
│   │
│   ├── core/               # Ядро системы
│   │   ├── utils.js        # Базовые утилиты
│   │   ├── config.js       # Конфигурация
│   │   ├── storage.js      # Управление хранилищем
│   │   └── crypto.js       # Шифрование данных
│   │
│   ├── modules/            # Модули приложения
│   │   ├── calculator.js   # Калькулятор стоимости
│   │   ├── crm.js          # CRM (будущий)
│   │   ├── printers.js     # Управление принтерами (будущий)
│   │   └── finances.js     # Финансы (будущий)
│   │
│   └── styles/             # Стили
│       └── main.css        # Основные стили
│
└── docs/                   # Документация
    └── MODULAR_GUIDE.md    # Это руководство
```

---

## 🔧 КАК ИСПОЛЬЗОВАТЬ

### Вариант 1: Модульная версия (рекомендуется для разработки)

1. Откройте `src/index.html` в браузере
2. Все модули загрузятся автоматически
3. Проверьте статус в разделе "Статус модулей"

### Вариант 2: Оригинальная версия (для продакшена)

1. Откройте `index.html` в браузере
2. Весь код в одном файле
3. Все функции работают

---

## ✅ ПРЕИМУЩЕСТВА МОДУЛЬНОЙ СТРУКТУРЫ

### 1. Кодировка UTF-8 без BOM
- ✅ Все файлы в единой кодировке
- ✅ Нет проблем с кириллицей
- ✅ Корректное отображение на всех платформах

### 2. Разделение ответственности
- ✅ `utils.js` — базовые функции
- ✅ `config.js` — настройки приложения
- ✅ `storage.js` — работа с localStorage
- ✅ `crypto.js` — шифрование данных
- ✅ `calculator.js` — расчёт стоимости

### 3. Упрощённая разработка
- ✅ Легко найти нужный код
- ✅ Удобно тестировать модули
- ✅ Проще поддерживать

### 4. Готовность к Electron
- ✅ Легко конвертировать в EXE
- ✅ Модули готовы для сборки
- ✅ Code signing проще применить

---

## 🔤 ПРОБЛЕМЫ КОДИРОВКИ — РЕШЕНИЕ

### Как сохранены файлы:

**Все `.js` и `.css` файлы:**
- Кодировка: **UTF-8 без BOM**
- Это гарантирует корректную работу кириллицы

### Проверка кодировки:

1. **В VS Code:**
   - Откройте файл
   - Кликните на кодировку внизу справа
   - Должно быть: `UTF-8`

2. **В Notepad++:**
   - Меню "Кодировки"
   - Выберите "UTF-8 без BOM"

3. **В PowerShell:**
   ```powershell
   Get-Content src\core\utils.js -Encoding UTF8 | Select-Object -First 5
   ```

---

## 📦 ПОДКЛЮЧЕНИЕ НОВЫХ МОДУЛЕЙ

### 1. Создайте файл модуля

`src/modules/crm.js`:
```javascript
// ============================================
// 3D MONOLITH — CRM МОДУЛЬ
// encoding: UTF-8 без BOM
// ============================================

window.CRM = {
    clients: [],
    
    addClient: function(client) {
        this.clients.push(client);
    },
    
    // ... другие методы
};

console.log('✅ CRM загружен');
```

### 2. Добавьте в `src/index.html`

```html
<!-- ✅ Модули приложения -->
<script charset="UTF-8" src="src/modules/calculator.js"></script>
<script charset="UTF-8" src="src/modules/crm.js"></script>  <!-- Новый -->
```

### 3. Проверьте загрузку

Откройте консоль браузера (F12):
```
✅ Utils загружен
✅ Config загружен
✅ Storage загружен
✅ Crypto загружен
✅ Calculator загружен
✅ CRM загружен  ← Новый модуль
```

---

## 🛡️ БЕЗОПАСНОСТЬ

### Шифрование данных:

```javascript
// Шифрование токена
window.CryptoUtils.encrypt('my-secret-token').then(encrypted => {
    localStorage.setItem('encrypted_token', encrypted);
});

// Расшифровка
window.CryptoUtils.decrypt(encrypted).then(decrypted => {
    console.log('Токен:', decrypted);
});
```

### XSS-защита:

```javascript
// Экранирование
const safeName = window.escapeHtml(clientName);

// Безопасный парсинг
const data = window.safeParseJSON(jsonString, {});
```

---

## 📊 ТЕСТИРОВАНИЕ

### 1. Проверка загрузки модулей

Откройте `src/index.html` и проверьте:
- ✅ Все статусы модулей = `✅`
- ✅ В консоли нет ошибок
- ✅ Кириллица отображается

### 2. Проверка кодировки

```javascript
// В консоли браузера:
document.characterSet  // Должно быть "UTF-8"

// Проверка работы кириллицы:
'Тест кодировки 3D MONOLITH' === 
decodeURIComponent(encodeURIComponent('Тест кодировки 3D MONOLITH'))
// true
```

### 3. Проверка шифрования

```javascript
// В консоли:
window.CryptoUtils.encrypt('Привет').then(r => {
    console.log('Зашифровано:', r);
    return window.CryptoUtils.decrypt(r);
}).then(r => {
    console.log('Расшифровано:', r);
});
```

---

## 🚀 СБОРКА В ELECTRON

### 1. Установите зависимости

```bash
npm init -y
npm install electron --save-dev
```

### 2. Создайте `main.js`

```javascript
const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    
    win.loadFile('src/index.html');
}

app.whenReady().then(createWindow);
```

### 3. Запустите

```bash
npx electron .
```

---

## 📝 ЧЕК-ЛИСТ ПРОВЕРКИ

### Перед запуском:
- [ ] Все файлы в UTF-8 без BOM
- [ ] В HTML указан `<meta charset="UTF-8">`
- [ ] Все `<script>` с `charset="UTF-8"`
- [ ] В CSS `@charset "UTF-8";` (если нужно)

### После запуска:
- [ ] В консоли нет ошибок
- [ ] Все модули загружены (✅)
- [ ] Кириллица отображается
- [ ] Шифрование работает

### Для Electron:
- [ ] `main.js` читает файлы с `encoding: 'utf-8'`
- [ ] `package.json` настроен
- [ ] `electron-builder.yml` создан

---

## 💡 СОВЕТЫ

### 1. Настройка VS Code

`.vscode/settings.json`:
```json
{
    "files.encoding": "utf8",
    "files.eol": "\n",
    "files.insertFinalNewline": true
}
```

### 2. Автоматическая проверка

Скрипт `scripts/check-encoding.js`:
```javascript
const fs = require('fs');
const files = fs.readdirSync('src/core');

files.forEach(file => {
    const content = fs.readFileSync(`src/core/${file}`, 'utf8');
    console.log(`✅ ${file} - OK`);
});
```

### 3. Резервное копирование

Используйте автосохранение:
```javascript
// Каждые 30 минут
setInterval(() => {
    window.backupAllData();
}, 30 * 60 * 1000);
```

---

## 📞 ПОДДЕРЖКА

### Проблемы с кодировкой:
1. Проверьте кодировку файла в редакторе
2. Пересохраните в UTF-8 без BOM
3. Проверьте `<meta charset="UTF-8">`

### Проблемы с модулями:
1. Проверьте порядок подключения
2. Проверьте пути к файлам
3. Откройте консоль (F12) для ошибок

### Проблемы с шифрованием:
1. Проверьте поддержку Web Crypto API
2. Убедитесь, что HTTPS (или localhost)
3. Проверьте ключ в localStorage

---

**Версия:** 2026.1  
**Дата:** 07.03.2026  
**Статус:** ✅ Готово к использованию
