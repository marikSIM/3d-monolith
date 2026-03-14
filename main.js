// 🔧 ВКЛЮЧЕНИЕ WEBGL И GPU — ДОЛЖНО БЫТЬ ПЕРЕД ВСЕМ!
const { app } = require('electron');

// 🔧 ФЛАГИ ДЛЯ WEBGL И GPU (критично для 3D визуализации)
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-webgl2');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('gpu-memory-buffer-size', '2048');
app.commandLine.appendSwitch('use-gl', 'angle');  // 🔧 ANGLE для лучшей совместимости
app.commandLine.appendSwitch('use-angle', 'd3d11');  // 🔧 DirectX 11
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');
app.commandLine.appendSwitch('force_high_performance_gpu', 'true'); // 🔧 Для ноутбуков с 2 GPU
app.commandLine.appendSwitch('disable-direct-composition');  // 🔧 Исправление для некоторых GPU
app.commandLine.appendSwitch('enable-zero-copy');  // 🔧 Оптимизация памяти

// ИМПОРТЫ МОДУЛЕЙ (должны быть в самом начале!)
const { BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, spawn } = require('child_process');
const iconv = require('iconv-lite'); // 🔧 Декодирование вывода консоли (CP866 → UTF-8)

// Перехват необработанных ошибок (теперь path и fs уже определены)
process.on('uncaughtException', (err) => {
    const logPath = path.join(__dirname, 'electron-error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}\n\n`);
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    const logPath = path.join(__dirname, 'electron-error.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n\n`);
    console.error('💥 UNHANDLED REJECTION:', reason);
});

// ===== ТЕСТ: ВЫПОЛНЯЕТСЯ ЛИ MAIN.JS =====
const logPath = path.join(__dirname, 'electron-main.log');
try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] 🚀 main.js ЗАГРУЖЕН!\n`);
    fs.appendFileSync(logPath, `📁 Путь: ${__filename}\n`);
    fs.appendFileSync(logPath, `📂 Рабочая директория: ${process.cwd()}\n`);
    console.log('🚀 [main.js] ФАЙЛ ЗАГРУЖЕН! Лог записан в:', logPath);
    
    // 🔧 Создаём папку C:\temp для временных файлов PWMO/UVTools
    const tempDir = 'C:\\temp';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('✅ Папка C:\\temp создана');
    } else {
        console.log('✅ Папка C:\\temp существует');
    }
} catch (err) {
    console.error('❌ Ошибка записи лога:', err);
}
// ========================================

// Electron Store для настроек (ES Module - динамический импорт)
let Store;
let store;

async function initStore() {
    try {
        const { default: StoreModule } = await import('electron-store');
        Store = StoreModule;
        store = new Store({
            defaults: {
                aiMode: 'knowledge-base', // 'knowledge-base', 'local-llm', 'weblm'
                modelPath: null,
                webgpuAvailable: false
            }
        });
        console.log('✅ Electron Store инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации Electron Store:', error.message);
        // Fallback: используем простой JSON файл
        store = {
            get: (key, defaultValue) => {
                try {
                    const configPath = path.join(app.getPath('userData'), 'config.json');
                    if (fs.existsSync(configPath)) {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                        return config[key] !== undefined ? config[key] : defaultValue;
                    }
                } catch (e) {}
                return defaultValue;
            },
            set: (key, value) => {
                try {
                    const configPath = path.join(app.getPath('userData'), 'config.json');
                    let config = {};
                    if (fs.existsSync(configPath)) {
                        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                    }
                    config[key] = value;
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                } catch (e) {
                    console.error('Ошибка записи конфига:', e);
                }
            }
        };
        console.log('⚠️ Используем fallback хранилище (JSON файл)');
    }
}

// node-llama-cpp для локальной LLM
let LlamaInstance = null;
let currentLlamaModel = null;

async function initLlama() {
    try {
        const { Llama } = await import('node-llama-cpp');
        LlamaInstance = new Llama({
            modelCache: {
                directory: path.join(app.getPath('userData'), 'models')
            }
        });
        console.log('✅ node-llama-cpp инициализирован');
    } catch (error) {
        console.warn('⚠️ node-llama-cpp недоступен:', error.message);
    }
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,  // 🔧 ВКЛЮЧИТЬ для работы калькулятора
            contextIsolation: true,  // 🔧 ВКЛЮЧИТЬ для работы contextBridge
            enableRemoteModule: false,
            sandbox: false,  // 🔧 ВЫКЛЮЧИТЬ Sandbox (блокирует WebGL!)
            // 🔧 ВКЛЮЧЕНИЕ WEBGL
            webgl: true,
            experimentalFeatures: false
        },
        icon: path.join(__dirname, 'icon.png'),
        backgroundColor: '#0f172a'
    });

    mainWindow.loadFile('index.html');
    
    // Открываем DevTools в режиме разработки
    // mainWindow.webContents.openDevTools();
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    // Инициализация хранилища и LLM
    await initStore();
    await initLlama();
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ============================================
// IPC ОБРАБОТЧИКИ ДЛЯ СЛАЙСИНГА
// ============================================

// Тестовый обработчик для проверки IPC связи
ipcMain.handle('test-ipc', async (event, data) => {
    console.log('✅ [main.js] IPC TEST получен:', data);
    return { success: true, message: 'main.js работает!', timestamp: Date.now() };
});

// Запуск слайсинга через внешний слайсер
ipcMain.handle('slice-model', async (event, data) => {
    console.log('🔥 [main.js] slice-model ВЫЗВАН!');
    console.log('📦 Данные:', JSON.stringify(data, null, 2));
    
    const { slicerId, executable, stlPath, infill, layerHeight, printerConfig, modelVolume } = data;

    console.log(`📊 [main.js] Получены данные для слайсинга:`);
    console.log(`   - slicerId: ${slicerId}`);
    console.log(`   - stlPath: ${stlPath}`);
    console.log(`   - infill: ${infill}%`);
    console.log(`   - layerHeight: ${layerHeight} мм`);
    console.log(`   - modelVolume: ${modelVolume} см³`);

    try {
        // Проверяем существование файла
        if (!fs.existsSync(stlPath)) {
            throw new Error(`Файл не найден: ${stlPath}`);
        }

        // Проверяем существование слайсера
        let slicerExecutable = executable;
        
        if (!fs.existsSync(slicerExecutable)) {
            console.warn(`⚠️ Слайсер не найден по указанному пути: ${slicerExecutable}`);
            
            // Пробуем авто-поиск для Cura
            if (slicerId === 'cura') {
                const possiblePaths = [
                    // Правильное имя файла: UltiMaker-Cura.exe (с дефисом)
                    'C:\\Program Files\\UltiMaker Cura 5.8.1\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.8.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.7.2\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.7.1\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.7.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.6.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.5.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.4.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.3.1\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.3.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.2.2\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.2.1\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.2.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.1.1\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.1.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.0.0\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 4.13.1\\CuraEngine.exe',
                    'C:\\Program Files\\UltiMaker Cura 4.13.0\\CuraEngine.exe',
                    // Старое имя: Cura.exe (для совместимости)
                    'C:\\Program Files\\UltiMaker Cura 5.8.1\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.8.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.7.2\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.7.1\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.7.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.6.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.5.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.4.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.3.1\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.3.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.2.2\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.2.1\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.2.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.1.1\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.1.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 5.0.0\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 4.13.1\\Cura.exe',
                    'C:\\Program Files\\UltiMaker Cura 4.13.0\\Cura.exe',
                    // Старый регистр: Ultimaker (для совместимости)
                    'C:\\Program Files\\Ultimaker Cura 5.8.1\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.8.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.7.2\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.7.1\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.7.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.6.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.5.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.4.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.3.1\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.3.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.2.2\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.2.1\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.2.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.1.1\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.1.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 5.0.0\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 4.13.1\\CuraEngine.exe',
                    'C:\\Program Files\\Ultimaker Cura 4.13.0\\CuraEngine.exe',
                    'C:\\Program Files (x86)\\Ultimaker Cura\\CuraEngine.exe',
                    'C:\\Program Files (x86)\\UltiMaker Cura\\CuraEngine.exe',
                    path.join(app.getPath('appData'), '..', 'Local\\Programs\\Ultimaker Cura\\CuraEngine.exe'),
                    path.join(app.getPath('appData'), '..', 'Local\\Programs\\UltiMaker Cura\\CuraEngine.exe'),
                ];
                
                for (const testPath of possiblePaths) {
                    if (fs.existsSync(testPath)) {
                        console.log(`✅ CuraEngine найден: ${testPath}`);
                        slicerExecutable = testPath;
                        break;
                    }
                }
                
                if (!fs.existsSync(slicerExecutable)) {
                    throw new Error(
                        `CuraEngine не найдена ни по одному из путей!\n\n` +
                        `Указанный путь: ${executable}\n\n` +
                        `Проверьте установку Cura или укажите правильный путь в настройках.\n\n` +
                        `Возможные пути:\n` +
                        possiblePaths.slice(0, 5).join('\n') + '...'
                    );
                }
            } else {
                throw new Error(`Слайсер не найден: ${slicerExecutable}`);
            }
        }

        console.log(`🔧 Используем слайсер: ${slicerExecutable}`);

        // Генерируем путь для G-code
        const gcodePath = stlPath.replace(/\.[^.]+$/, '.gcode');
        console.log(`📄 G-код будет сохранён: ${gcodePath}`);

        // 🔧 КРИТИЧНО: Копируем файл если в пути КИРИЛЛИЦА или ПРОБЕЛЫ
        let actualStlPath = stlPath;
        let actualGcodePath = gcodePath;
        let tempFileCreated = false;

        // Проверяем на кириллицу ИЛИ пробелы в пути
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(stlPath);
        const hasSpaces = /\s/.test(stlPath);
        
        if (hasCyrillic || hasSpaces) {
            console.warn('⚠️ В пути есть кириллица или пробелы! Копируем во временную папку...');
            const tempDir = path.join(app.getPath('temp'), 'monolith_slicing_' + Date.now());
            console.log(`📁 Создаём временную папку: ${tempDir}`);
            fs.mkdirSync(tempDir, { recursive: true });

            // Генерируем безопасное имя файла (только латиница + цифры + подчёркивания)
            const safeFileName = `model_${Date.now()}.stl`;
            const safeGcodeName = `output_${Date.now()}.gcode`;

            actualStlPath = path.join(tempDir, safeFileName);
            actualGcodePath = path.join(tempDir, safeGcodeName);

            console.log(`📋 Копируем файл: ${stlPath} → ${actualStlPath}`);
            fs.copyFileSync(stlPath, actualStlPath);
            tempFileCreated = true;
            console.log(`✅ Временный файл создан: ${actualStlPath}`);
            console.log(`📄 Временный G-код будет: ${actualGcodePath}`);
        } else {
            console.log('✅ Путь безопасный, используем оригинальный');
        }

        // Формируем аргументы в зависимости от слайсера
        let args = [];
        let slicerProcess = slicerExecutable;

        switch (slicerId) {
            case 'orca':
                args = [
                    stlPath,
                    '--output', gcodePath,
                    '--layer-height', layerHeight || 0.2,
                    '--infill', infill || 20
                ];
                break;
            case 'bambu':
                args = [
                    stlPath,
                    '--output', gcodePath,
                    '--layer-height', layerHeight || 0.2,
                    '--infill', infill || 20
                ];
                break;
            case 'cura':
                // Cura использует CuraEngine для слайсинга
                const curaDir = path.dirname(slicerExecutable);

                // Пробуем найти CuraEngine
                let curaEngine = path.join(curaDir, 'CuraEngine.exe');

                // Если не найден, пробуем другие варианты
                if (!fs.existsSync(curaEngine)) {
                    curaEngine = path.join(curaDir, '..', 'CuraEngine.exe');
                }
                if (!fs.existsSync(curaEngine)) {
                    curaEngine = path.join(curaDir, '..', '..', 'CuraEngine.exe');
                }
                if (!fs.existsSync(curaEngine)) {
                    // Пробуем стандартные пути установки
                    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
                    curaEngine = path.join(programFiles, 'CuraEngine', 'CuraEngine.exe');
                }

                console.log('🔍 Поиск CuraEngine:', curaEngine);
                console.log('📁 CuraEngine существует:', fs.existsSync(curaEngine));

                // 🔧 КРИТИЧНО: CuraEngine 5.8.1 требует файлы определений (.def.json)
                // Которые находятся внутри resources/app.asar и недоступны напрямую
                // Поэтому используем GUI режим (UltiMaker-Cura.exe) вместо CuraEngine.exe
                
                // НО! CuraEngine.exe может работать без GUI, если передать правильные аргументы
                // Используем ПРЯМОЙ вызов CuraEngine с правильным синтаксисом!
                
                if (fs.existsSync(curaEngine)) {
                    console.log('✅ Используем CuraEngine.exe напрямую');
                    slicerProcess = curaEngine;
                    console.log('🔧 CuraEngine:', slicerProcess);

                    // Формируем аргументы для CuraEngine 5.8.1
                    // 🔧 КРИТИЧНО: Команда 'slice' БЕЗ тире!
                    args = [
                        'slice',  // БЕЗ '--'!
                        '-v',     // verbose
                    ];

                    // 1. Настройки машины (глобальные)
                    args.push('-s', 'machine_extruder_count=1');
                    args.push('-s', 'machine_width=200');
                    args.push('-s', 'machine_depth=200');
                    args.push('-s', 'machine_height=200');
                    args.push('-s', 'machine_heated_bed=true');
                    args.push('-s', 'machine_heated_build_volume=false');
                    args.push('-s', 'machine_gcode_flavor=Marlin');
                    args.push('-s', 'machine_nozzle_size=0.4');
                    args.push('-s', 'machine_center_is_zero=false');

                    // 2. 🔧 Переключаемся на экструдер 0 (КРИТИЧНО для 5.8.1!)
                    args.push('-e0');

                    // 3. Настройки экструдера (после -e0)
                    args.push('-s', 'extruder_nr=0');
                    args.push('-s', 'extruder_nr_per_extruder=0');
                    args.push('-s', 'machine_nozzle_id=0');
                    args.push('-s', 'extruder_material_enabled=true');
                    args.push('-s', 'extruder_material_air_diameter=1.75');
                    args.push('-s', 'extruder_material_initial_temperature=210');
                    args.push('-s', 'extruder_material_final_temperature=210');
                    args.push('-s', 'extruder_prime_enable=false');
                    args.push('-s', 'extruder_prime_amount=0');
                    args.push('-s', 'extruder_prime_pos_x=0');
                    args.push('-s', 'extruder_prime_pos_y=0');
                    args.push('-s', 'extruder_prime_pos_z=5');
                    // 🔧 КРИТИЧНО: Параметры усадки ВНУТРИ экструдера!
                    args.push('-s', 'material_shrinkage_percentage=100');
                    args.push('-s', 'material_shrinkage_percentage_xy=100');
                    args.push('-s', 'material_shrinkage_percentage_z=100');

                    // 4. Центрирование и позиционирование
                    args.push('-s', 'center_object=true');
                    args.push('-s', 'mesh_position_x=0');
                    args.push('-s', 'mesh_position_y=0');
                    args.push('-s', 'mesh_position_z=0');
                    args.push('-s', 'mesh_rotation_matrix=[[1,0,0],[0,1,0],[0,0,1]]');

                    // 5. Качество печати
                    args.push('-s', `layer_height=${layerHeight || 0.2}`);
                    args.push('-s', 'layer_height_0=0.2');
                    args.push('-s', 'wall_line_count=2');
                    args.push('-s', 'wall_thickness=0.8');
                    args.push('-s', 'top_bottom_thickness=0.8');
                    args.push('-s', 'top_layers=8');
                    args.push('-s', 'bottom_layers=6');

                    // 6. Заполнение
                    args.push('-s', `infill_sparse_density=${infill || 20}`);
                    args.push('-s', 'infill_pattern=grid');
                    args.push('-s', 'infill_mesh=false');
                    args.push('-s', 'cutting_mesh=false');
                    args.push('-s', 'anti_overhang_mesh=false');
                    args.push('-s', 'support_mesh=false');
                    args.push('-s', 'infill_before_walls=true');
                    args.push('-s', 'infill_support_enabled=false');
                    args.push('-s', 'infill_walls=0');

                    // 7. Материал
                    args.push('-s', 'material_diameter=1.75');
                    args.push('-s', 'material_density=1.24');
                    args.push('-s', 'material_flow=100');
                    args.push('-s', 'material_print_temperature=210');
                    args.push('-s', 'material_bed_temperature=60');
                    args.push('-s', 'material_print_temperature_layer_0=210');
                    args.push('-s', 'material_bed_temperature_layer_0=60');
                    // 🔧 Усадка уже задана в настройках экструдера
                    args.push('-s', 'material_crystallinity=0');
                    args.push('-s', 'material_anti_ooze_enabled=false');

                    // 8. Скорости
                    args.push('-s', 'speed_print=60');
                    args.push('-s', 'speed_travel=150');
                    args.push('-s', 'speed_wall=25');
                    args.push('-s', 'speed_topbottom=20');
                    args.push('-s', 'speed_infill=40');

                    // 9. Ускорения
                    args.push('-s', 'acceleration_print=1000');
                    args.push('-s', 'acceleration_travel=2000');
                    args.push('-s', 'jerk_print=20');
                    args.push('-s', 'jerk_travel=30');

                    // 10. Максимальные параметры
                    args.push('-s', 'machine_max_feedrate_x=300');
                    args.push('-s', 'machine_max_feedrate_y=300');
                    args.push('-s', 'machine_max_feedrate_z=5');
                    args.push('-s', 'machine_max_acceleration_x=5000');
                    args.push('-s', 'machine_max_acceleration_y=5000');
                    args.push('-s', 'machine_max_acceleration_z=100');
                    args.push('-s', 'machine_max_jerk_xy=20');
                    args.push('-s', 'machine_max_jerk_z=0.4');

                    // 11. Шаги на мм
                    args.push('-s', 'machine_steps_per_mm_x=80');
                    args.push('-s', 'machine_steps_per_mm_y=80');
                    args.push('-s', 'machine_steps_per_mm_z=400');

                    // 12. Концевики
                    args.push('-s', 'machine_endstop_positive_direction_x=false');
                    args.push('-s', 'machine_endstop_positive_direction_y=false');
                    args.push('-s', 'machine_endstop_positive_direction_z=true');

                    // 13. Адгезия
                    args.push('-s', 'adhesion_type=brim');
                    args.push('-s', 'brim_width=8');
                    args.push('-s', 'brim_line_count=5');
                    args.push('-s', 'skirt_line_count=1');
                    args.push('-s', 'skirt_gap=3');
                    args.push('-s', 'skirt_brim_minimal_length=250');

                    // 14. Поддержки
                    args.push('-s', 'support_enable=false');
                    args.push('-s', 'support_type=everywhere');
                    args.push('-s', 'support_pattern=zigzag');
                    args.push('-s', 'support_density=15');

                    // 15. Файлы (нормализованные пути + кавычки для пробелов!)
                    const normalizedStlPath = actualStlPath.replace(/\\/g, '/');
                    const normalizedGcodePath = actualGcodePath.replace(/\\/g, '/');
                    
                    // 🔧 КРИТИЧНО: Оборачиваем пути в кавычки из-за пробелов!
                    args.push('-l', `"${normalizedStlPath}"`);
                    args.push('-o', `"${normalizedGcodePath}"`);

                    console.log('📋 Финальные аргументы CuraEngine:');
                    console.log('   ', args.join(' '));
                    console.log('📁 STL:', normalizedStlPath);
                    console.log('📄 G-code:', normalizedGcodePath);
                    
                } else {
                    // CuraEngine не найден - используем GUI режим
                    console.log('⚠️ CuraEngine не найден, пробуем Cura GUI...');
                    slicerProcess = slicerExecutable;
                    
                    const tempProfileDir = path.join(app.getPath('temp'), 'cura_profiles');
                    if (!fs.existsSync(tempProfileDir)) {
                        fs.mkdirSync(tempProfileDir, { recursive: true });
                    }

                    const tempProfile = path.join(tempProfileDir, 'temp_profile.cfg');
                    const profileContent = `
[metadata]
type = definition
name = Temporary Profile
definition = fdmprinter

[values]
layer_height = ${layerHeight || 0.2}
infill_sparse_density = ${infill || 20}
extruder_nr = 0
`.trim();
                    fs.writeFileSync(tempProfile, profileContent);
                    console.log('📋 Временный профиль:', tempProfile);

                    // 🔧 КРИТИЧНО: Для GUI Cura используем правильный синтаксис
                    args = [
                        'slice',  // БЕЗ '--'!
                        '--single-instance',
                        '--quit-after-slicing',
                        '--input', actualStlPath,
                        '--output', actualGcodePath,
                        '--profile', tempProfile
                    ];
                }
                
                break;
            case 'prusa':
                args = [
                    stlPath,
                    '-o', gcodePath,
                    '--layer-height', layerHeight || 0.2,
                    '--infill', infill || 20
                ];
                break;
            case 'lychee':
                args = [
                    stlPath,
                    '--export', gcodePath
                ];
                break;
            default:
                throw new Error('Неподдерживаемый слайсер');
        }

        console.log(`🚀 Запуск слайсера: ${slicerProcess}`);
        console.log(`📋 Аргументы: ${args.join(' ')}`);

        // 🔧 Запускаем через shell для правильной обработки аргументов с пробелами
        const { spawn } = require('child_process');
        
        // КРИТИЧНО: Путь к исполняемому файлу должен быть в кавычках из-за пробелов в "Program Files"
        const quotedSlicerProcess = `"${slicerProcess}"`;
        console.log(`🔧 Команда: ${quotedSlicerProcess} ${args.join(' ')}`);
        
        const slicer = spawn(quotedSlicerProcess, args, { shell: true, windowsHide: true });

        return new Promise((resolve, reject) => {
            let stderr = '';
            let stdout = '';
            let timeoutId = null;

            // 🔧 Декодируем вывод из CP866 (консоль Windows) в UTF-8
            slicer.stdout.on('data', (data) => {
                const decoded = iconv.decode(data, 'cp866');
                stdout += decoded;
                console.log('📤 Слайсер (stdout):', decoded);
            });

            slicer.stderr.on('data', (data) => {
                const decoded = iconv.decode(data, 'cp866');
                stderr += decoded;
                console.error('❌ Слайсер (stderr):', decoded);
            });

            // Таймаут для защиты от зависания (5 минут)
            timeoutId = setTimeout(() => {
                console.log('⏰ Таймаут слайсинга (5 минут)');
                slicer.kill();
                reject(new Error('Таймаут слайсинга: слайсер не ответил за 5 минут'));
            }, 5 * 60 * 1000);

            slicer.on('close', (code) => {
                clearTimeout(timeoutId);
                console.log(`🏁 Слайсер завершён с кодом: ${code}`);
                console.log(`📝 Полный stderr: ${stderr}`);
                console.log(`📝 Полный stdout: ${stdout}`);
                console.log(`🔍 Проверяем G-код файл: ${actualGcodePath}`);
                console.log(`📁 Файл существует: ${fs.existsSync(actualGcodePath)}`);
                
                // Отладка: показываем полную ошибку
                const fullError = `Код: ${code}\n\nStderr:\n${stderr}\n\nStdout:\n${stdout}`;
                console.error('🔥 ПОЛНАЯ ОШИБКА:', fullError);

                // Если был создан временный файл, копируем результат обратно
                if (tempFileCreated && fs.existsSync(actualGcodePath)) {
                    // 🔧 КРИТИЧНО: Не копируем в папку с кириллицей/пробелами!
                    // Оставляем G-код во временной папке и сообщаем пользователю
                    console.log('✅ G-код создан:', actualGcodePath);
                    console.log('📁 Путь к G-коду (сохранён во временной папке):', actualGcodePath);
                }
                
                // Очищаем временные файлы
                // 🔧 КРИТИЧНО: НЕ удаляем, если там G-код!
                // if (tempFileCreated) { ... }
                // Теперь G-код остаётся во временной папке

                if (code === 0 || code === null) {
                    // Для Cura даже если код не 0, проверяем наличие gcode
                    if (slicerId === 'cura' && fs.existsSync(actualGcodePath)) {
                        console.log('✅ Cura: G-код файл найден, парсим...');
                        
                        // Проверяем размер файла
                        const fileSize = fs.statSync(actualGcodePath).size;
                        console.log(`📊 Размер G-код файла: ${(fileSize / 1024).toFixed(2)} КБ`);
                        
                        // Если файл пустой или очень маленький (< 1KB) — сразу резервный расчёт
                        if (fileSize < 1024) {
                            console.log('⚠️ G-код файл слишком маленький, используем резервный расчёт...');
                            const backupCalc = calculateBackupPrintTime(modelVolume, infill, layerHeight);
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: backupCalc.printTime,
                                filamentWeight: backupCalc.filamentWeight,
                                backupCalculation: true
                            });
                            return;
                        }

                        // Парсим реальные данные из G-кода
                        const parsedData = parseGCodeFile(actualGcodePath, modelVolume, infill, layerHeight);

                        // ЕСЛИ CURA ВЕРНУЛА НУЛИ — ИСПОЛЬЗУЕМ РЕЗЕРВНЫЙ РАСЧЁТ
                        if (parsedData.printTime === 0 || parsedData.filamentWeight === 0) {
                            console.log('⚠️ Cura вернула нули, используем резервный расчёт по объёму...');
                            const backupCalc = calculateBackupPrintTime(modelVolume, infill, layerHeight);
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: backupCalc.printTime,
                                filamentWeight: backupCalc.filamentWeight,
                                backupCalculation: true
                            });
                        } else {
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: parsedData.printTime,
                                filamentWeight: parsedData.filamentWeight
                            });
                        }
                    } else if (code === 0) {
                        console.log('✅ Слайсер: G-код файл найден, парсим...');
                        const parsedData = parseGCodeFile(actualGcodePath, modelVolume, infill, layerHeight);

                        // РЕЗЕРВНЫЙ РАСЧЁТ
                        if (parsedData.printTime === 0 || parsedData.filamentWeight === 0) {
                            console.log('⚠️ Слайсер вернул нули, используем резервный расчёт...');
                            const backupCalc = calculateBackupPrintTime(modelVolume, infill, layerHeight);
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: backupCalc.printTime,
                                filamentWeight: backupCalc.filamentWeight,
                                backupCalculation: true
                            });
                        } else {
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: parsedData.printTime,
                                filamentWeight: parsedData.filamentWeight
                            });
                        }
                    } else {
                        reject(new Error(`Слайсер завершился с кодом ${code}\n\n${fullError}`));
                    }
                } else {
                    // Даже если код не 0, проверяем наличие файла (для Cura)
                    if (slicerId === 'cura' && fs.existsSync(actualGcodePath)) {
                        console.log('⚠️ Cura: код ошибки, но файл создан, парсим...');
                        
                        // Проверяем размер файла
                        const fileSize = fs.statSync(actualGcodePath).size;
                        console.log(`📊 Размер G-код файла: ${(fileSize / 1024).toFixed(2)} КБ`);
                        
                        // Если файл пустой — резервный расчёт
                        if (fileSize < 1024) {
                            console.log('⚠️ G-код файл слишком маленький, используем резервный расчёт...');
                            const backupCalc = calculateBackupPrintTime(modelVolume, infill, layerHeight);
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: backupCalc.printTime,
                                filamentWeight: backupCalc.filamentWeight,
                                backupCalculation: true
                            });
                            return;
                        }

                        const parsedData = parseGCodeFile(actualGcodePath, modelVolume, infill, layerHeight);

                        // РЕЗЕРВНЫЙ РАСЧЁТ
                        if (parsedData.printTime === 0 || parsedData.filamentWeight === 0) {
                            console.log('⚠️ Cura вернула нули, используем резервный расчёт...');
                            const backupCalc = calculateBackupPrintTime(modelVolume, infill, layerHeight);
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: backupCalc.printTime,
                                filamentWeight: backupCalc.filamentWeight,
                                backupCalculation: true
                            });
                        } else {
                            resolve({
                                success: true,
                                gcodePath: actualGcodePath,  // 🔧 Используем временный путь
                                printTime: parsedData.printTime,
                                filamentWeight: parsedData.filamentWeight
                            });
                        }
                    } else {
                        let errorMessage = `Слайсер завершился с кодом ${code}\n\n${fullError}\n\n`;

                        // Проверяем на конкретные ошибки (и в stdout, и в stderr)
                        const allOutput = stdout + stderr;
                        
                        if (allOutput.includes('material_shrinkage_percentage_xy')) {
                            errorMessage += '❌ Ошибка параметра усадки материала\n';
                            errorMessage += 'Решение: Обновите приложение (параметры уже исправлены)\n\n';
                        }

                        if (allOutput.includes('disconnected faces') || allOutput.includes('Mesh has disconnected')) {
                            errorMessage += '⚠️ МОДЕЛЬ ИМЕЕТ ПОВРЕЖДЁННУЮ ГЕОМЕТРИЮ!\n\n';
                            errorMessage += 'Проблема: Сетка содержит несвязанные грани (disconnected faces)\n';
                            errorMessage += 'Это означает, что некоторые полигоны не соединены с основной сеткой.\n\n';
                            errorMessage += '🔧 РЕШЕНИЕ:\n';
                            errorMessage += '1. Откройте модель в 3D редакторе:\n';
                            errorMessage += '   • Blender: Edit Mode → Select All → Mesh → Clean Up → Delete Loose\n';
                            errorMessage += '   • Netfabb: Repair → Automatic Repair\n';
                            errorMessage += '   • Meshmixer: Analysis → Inspector → Auto Repair All\n\n';
                            errorMessage += '2. Или используйте Windows 3D Builder:\n';
                            errorMessage += '   • Откройте файл в 3D Builder\n';
                            errorMessage += '   • Нажмите "Исправить" при появлении запроса\n';
                            errorMessage += '   • Сохраните исправленную версию\n\n';
                            errorMessage += '3. Или Microsoft Print3D:\n';
                            errorMessage += '   • Откройте файл\n';
                            errorMessage += '   • Выберите "Исправить модель"\n';
                            errorMessage += '   • Сохраните результат\n\n';
                            errorMessage += 'После исправления попробуйте слайсинг снова.\n';
                        }

                        if (allOutput.includes('extruder_nr')) {
                            errorMessage += '\n⚠️ Ошибка параметра extruder_nr!\n';
                            errorMessage += 'Попробуйте пересохранить модель в другом слайсере.\n';
                        }

                        errorMessage += '\n━━━━━━━━━━━━━━━━━━━━━━━━\n';
                        errorMessage += 'Общие рекомендации:\n';
                        errorMessage += '1. Путь к файлу не должен содержать кириллицу\n';
                        errorMessage += '2. Проверьте доступ CuraEngine к файлу\n';
                        errorMessage += '3. Убедитесь, что достаточно места на диске\n';

                        reject(new Error(errorMessage));
                    }
                }
            });

            // 🔧 Очистка временных файлов после завершения
            slicer.on('exit', () => {
                if (tempFileCreated) {
                    // Ждём 2 секунды перед удалением (чтобы всё записалось)
                    setTimeout(() => {
                        try {
                            // Удаляем временный STL
                            if (fs.existsSync(actualStlPath)) {
                                fs.unlinkSync(actualStlPath);
                                console.log('🗑️ Временный STL удалён:', actualStlPath);
                            }
                            
                            // G-код НЕ удаляем — он нужен пользователю!
                            // Но можем удалить папку если G-код уже скопирован обратно
                            const tempDir = path.dirname(actualStlPath);
                            const gcodeFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.gcode'));
                            
                            // Если в папке только один G-код и он был скопирован в исходную папку — удаляем папку
                            if (gcodeFiles.length === 1) {
                                // Проверяем, существует ли оригинальный путь для G-кода
                                const originalGcodePath = stlPath.replace(/\.[^.]+$/, '.gcode');
                                if (fs.existsSync(originalGcodePath)) {
                                    fs.rmSync(tempDir, { recursive: true, force: true });
                                    console.log('🗑️ Временная папка удалена:', tempDir);
                                }
                            }
                        } catch (err) {
                            console.error('⚠️ Ошибка очистки временных файлов:', err.message);
                        }
                    }, 2000);
                }
            });

            slicer.on('error', (err) => {
                clearTimeout(timeoutId);
                console.error('🔥 Ошибка процесса слайсера:', err);
                reject(err);
            });
        });

    } catch (error) {
        console.error('Ошибка слайсинга:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================
// ПАРСИНГ G-КОДА (реальные данные из файла)
// ============================================
function parseGCodeFile(gcodePath, modelVolume = 0, infill = 20, layerHeight = 0.2) {
    let printTime = 0; // часы
    let filamentWeight = 0; // граммы
    let filamentLength = 0; // мм

    try {
        if (!fs.existsSync(gcodePath)) {
            console.warn('⚠️ G-код файл не найден:', gcodePath);
            // ВОЗВРАЩАЕМ РЕЗЕРВНЫЙ РАСЧЁТ ЕСЛИ ФАЙЛ НЕ НАЙДЕН
            if (modelVolume > 0) {
                console.log('🔄 Используем резервный расчёт по объёму модели...');
                const backup = calculateBackupPrintTime(modelVolume, infill, layerHeight);
                return backup;
            }
            return { printTime: 0, filamentWeight: 0 };
        }

        const content = fs.readFileSync(gcodePath, 'utf-8');
        const lines = content.split('\n');
        let foundMetadata = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // ;TIME:12345 (секунды) - стандартный формат Cura
            if (trimmed.startsWith(';TIME:')) {
                const seconds = parseFloat(trimmed.split(':')[1]);
                if (seconds) {
                    printTime = seconds / 3600; // конвертируем в часы
                    console.log(`📊 Cura TIME: ${seconds} сек (${printTime.toFixed(2)} ч)`);
                    foundMetadata = true;
                }
            }

            // ;TIME_ELAPSED:12345.67 (Cura/Prusa)
            if (trimmed.startsWith(';TIME_ELAPSED:')) {
                const seconds = parseFloat(trimmed.split(':')[1]);
                if (seconds && printTime === 0) {
                    printTime = seconds / 3600;
                    console.log(`📊 TIME_ELAPSED: ${seconds} сек (${printTime.toFixed(2)} ч)`);
                    foundMetadata = true;
                }
            }

            // ;Filament used: 12345.67mm (Cura)
            if (trimmed.startsWith(';Filament used:')) {
                const mm = parseFloat(trimmed.split(':')[1]);
                if (mm) {
                    filamentLength = mm;
                    // Конвертируем мм в граммы (приблизительно 1.24г на метр для PLA 1.75мм)
                    filamentWeight = (mm / 1000) * 1.24;
                    console.log(`📊 Filament used: ${mm} мм (${filamentWeight.toFixed(2)} г)`);
                    foundMetadata = true;
                }
            }

            // ;Filament weight: 123.45g
            if (trimmed.toLowerCase().includes(';filament weight:')) {
                const match = trimmed.match(/([\d.]+)\s*g/i);
                if (match) {
                    filamentWeight = parseFloat(match[1]);
                    console.log(`📊 Filament weight: ${filamentWeight} г`);
                    foundMetadata = true;
                }
            }

            // ;Filament used m1: 12345.67 (Cura multi-material)
            if (trimmed.startsWith(';Filament used m1:')) {
                const mm = parseFloat(trimmed.split(':')[1]);
                if (mm && filamentLength === 0) {
                    filamentLength = mm;
                    filamentWeight = (mm / 1000) * 1.24;
                    console.log(`📊 Filament used m1: ${mm} мм (${filamentWeight.toFixed(2)} г)`);
                    foundMetadata = true;
                }
            }

            // ;Layer count: 123
            if (trimmed.startsWith(';Layer count:')) {
                const layers = parseInt(trimmed.split(':')[1]);
                console.log(`📊 Layer count: ${layers}`);
            }

            // ; estimated printing time = 12h 34m 56s (Bambu Studio)
            const bambuTime = trimmed.match(/; estimated printing time.*= (\d+)h (\d+)m (\d+)s/);
            if (bambuTime && printTime === 0) {
                const hours = parseInt(bambuTime[1]);
                const minutes = parseInt(bambuTime[2]);
                const seconds = parseInt(bambuTime[3]);
                printTime = hours + (minutes / 60) + (seconds / 3600);
                console.log(`📊 Bambu time: ${printTime.toFixed(2)} ч`);
                foundMetadata = true;
            }
        }

        // ===== РЕЗЕРВНЫЙ РАСЧЁТ ЕСЛИ МЕТАДАННЫЕ НЕ НАЙДЕНЫ =====
        if (!foundMetadata && modelVolume > 0) {
            console.log('⚠️ Метаданные не найдены в G-коде, рассчитываем по объёму модели...');

            // Расчёт веса филамента
            // Объём в см³ * плотность PLA (1.24 г/см³) * (инфилл/100 + стенки)
            const density = 1.24; // г/см³ для PLA
            const wallCoefficient = 0.3; // Добавляем 30% на стенки и верхние/нижние слои
            const effectiveInfill = (infill / 100) + wallCoefficient;
            filamentWeight = modelVolume * density * effectiveInfill;

            console.log(`📊 Расчёт веса: объём=${modelVolume.toFixed(2)} см³, инфилл=${infill}%, плотность=${density}`);
            console.log(`   Вес = ${modelVolume.toFixed(2)} × ${density} × ${effectiveInfill.toFixed(2)} = ${filamentWeight.toFixed(2)} г`);

            // Расчёт времени печати
            // Объём / скорость экструзии (приблизительно)
            const printSpeed = 50; // мм/с средняя скорость печати
            const travelSpeed = 120; // мм/с скорость перемещения
            const layerThickness = layerHeight || 0.2; // мм

            // Длина периметра (приблизительно на основе объёма)
            const approximateLength = (modelVolume * 1000) / (layerThickness * 0.4); // мм
            const printTimeHours = (approximateLength / printSpeed / 3600) * (1 + (100 - infill) / 200);

            printTime = printTimeHours;
            console.log(`📊 Расчёт времени: длина=~${approximateLength.toFixed(0)} мм, скорость=${printSpeed} мм/с`);
            console.log(`   Время = ${printTime.toFixed(2)} ч (${(printTime * 60).toFixed(0)} мин)`);
        } else if (modelVolume > 0) {
            console.log(`ℹ️ Модель: объём=${modelVolume.toFixed(2)} см³ (используется для проверки)`);
        }

        console.log(`✅ Распарсен G-код: время=${printTime.toFixed(2)}ч, вес=${filamentWeight.toFixed(2)}г`);

    } catch (error) {
        console.error('❌ Ошибка парсинга G-кода:', error.message);
        console.error(error.stack);
    }

    return { printTime, filamentWeight };
}

// ============================================
// РЕЗЕРВНЫЙ РАСЧЁТ ВРЕМЕНИ И ВЕСА (когда Cura возвращает 0)
// ============================================
function calculateBackupPrintTime(modelVolume, infill = 20, layerHeight = 0.2) {
    console.log('🔄 Резервный расчёт по объёму модели...');
    
    const density = 1.24; // г/см³ для PLA
    const wallCoefficient = 0.3; // 30% на стенки и верхние/нижние слои
    const effectiveInfill = (infill / 100) + wallCoefficient;
    
    // Расчёт веса
    const filamentWeight = modelVolume * density * effectiveInfill;
    
    // Расчёт времени печати
    const printSpeed = 50; // мм/с средняя скорость печати
    const layerThickness = layerHeight || 0.2; // мм
    
    // Приблизительная длина экструзии
    const approximateLength = (modelVolume * 1000) / (layerThickness * 0.4); // мм
    
    // Время печати с учётом travel moves
    const printTimeHours = (approximateLength / printSpeed / 3600) * (1 + (100 - infill) / 200);
    
    console.log(`📊 Расчёт веса: ${modelVolume.toFixed(2)} см³ × ${density} г/см³ × ${effectiveInfill.toFixed(2)} = ${filamentWeight.toFixed(2)} г`);
    console.log(`📊 Расчёт времени: ~${(printTimeHours * 60).toFixed(0)} мин (${printTimeHours.toFixed(2)} ч)`);
    
    return {
        printTime: printTimeHours,
        filamentWeight: filamentWeight
    };
}

// Выбор файла через диалог
ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

// Выбор файла для сохранения
ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

// Чтение файла
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Чтение бинарного файла (для PWMO, STL и т.д.)
ipcMain.handle('read-binary-file', async (event, filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);
        // Преобразуем Buffer в ArrayBuffer для передачи в браузер
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        return { success: true, content: arrayBuffer };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Выполнение системной команды (для UVTools и других утилит)
// Поддерживает два формата:
// 1. exec-command(exePath, [args], options) - предпочтительно
// 2. exec-command(commandString, options) - через shell
ipcMain.handle('exec-command', async (event, commandOrExe, argsOrOptions, options = {}) => {
    let exe, args, timeout;
    
    // Поддержка двух форматов:
    if (Array.isArray(argsOrOptions)) {
        // Формат 1: exe + аргументы (execFile)
        exe = commandOrExe;
        args = argsOrOptions;
        timeout = options.timeout || 30000;
        
        return new Promise((resolve) => {
            console.log('🔧 [Electron] Выполнение execFile:', exe, args);
            
            // Используем execFile для прямого вызова без shell
            // Важно: encoding: 'buffer' для поддержки любой кодировки
            execFile(exe, args, {
                timeout,
                encoding: 'buffer',
                maxBuffer: 50 * 1024 * 1024, // 50MB буфер
                env: { ...process.env, DOTNET_CLI_UI_LANGUAGE: 'en-US' }
            }, (error, stdoutBuffer, stderrBuffer) => {
                // Конвертируем буферы в строки
                let stdout = '';
                let stderr = '';
                
                try {
                    // Пробуем UTF-8 сначала
                    stdout = stdoutBuffer.toString('utf8');
                    stderr = stderrBuffer.toString('utf8');
                    
                    // Если видим кракозябры, пробуем другие кодировки
                    if (stdout.includes('') || stdout.includes('')) {
                        stdout = stdoutBuffer.toString('cp866');
                        stderr = stderrBuffer.toString('cp866');
                    }
                } catch (e) {
                    stdout = stdoutBuffer.toString();
                    stderr = stderrBuffer.toString();
                }
                
                if (error) {
                    console.error('❌ [Electron] Ошибка выполнения:', error.message);
                    console.error('   STDERR:', stderr.substring(0, 200));
                    resolve({
                        success: false,
                        error: error.message,
                        stdout: stdout || '',
                        stderr: stderr || ''
                    });
                } else {
                    resolve({
                        success: true,
                        stdout,
                        stderr: stderr || null
                    });
                }
            });
        });
        
    } else {
        // Формат 2: строка команды (через spawn для лучшего контроля)
        const command = commandOrExe;
        timeout = argsOrOptions?.timeout || 30000;
        
        return new Promise((resolve) => {
            console.log('🔧 [Electron] Выполнение spawn:', command);
            
            // Парсим команду на exe и аргументы
            const parts = command.match(/"[^"]+"|\S+/g) || [];
            const exe = parts[0]?.replace(/^"|"$/g, '');
            const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));
            
            const child = spawn(exe, args, {
                encoding: 'buffer',
                maxBuffer: 50 * 1024 * 1024,
                shell: true,
                env: { ...process.env, LANG: 'en_US.UTF-8', DOTNET_CLI_UI_LANGUAGE: 'en-US' }
            });
            
            let stdoutBuffer = Buffer.alloc(0);
            let stderrBuffer = Buffer.alloc(0);
            
            child.stdout.on('data', (data) => { stdoutBuffer = Buffer.concat([stdoutBuffer, data]); });
            child.stderr.on('data', (data) => { stderrBuffer = Buffer.concat([stderrBuffer, data]); });
            
            child.on('close', (code) => {
                let stdout = '';
                let stderr = '';
                
                try {
                    stdout = stdoutBuffer.toString('utf8');
                    stderr = stderrBuffer.toString('utf8');
                    
                    if (stdout.includes('') || stdout.includes('')) {
                        stdout = stdoutBuffer.toString('cp866');
                        stderr = stderrBuffer.toString('cp866');
                    }
                } catch (e) {
                    stdout = stdoutBuffer.toString();
                    stderr = stderrBuffer.toString();
                }
                
                if (code === 0) {
                    resolve({ success: true, stdout, stderr: stderr || null });
                } else {
                    resolve({ 
                        success: false, 
                        error: `Exit code: ${code}`, 
                        stdout, 
                        stderr 
                    });
                }
            });
            
            child.on('error', (err) => {
                resolve({ success: false, error: err.message, stdout: '', stderr: '' });
            });
            
            setTimeout(() => {
                child.kill();
                resolve({ success: false, error: 'Timeout', stdout: '', stderr: '' });
            }, timeout);
        });
    }
});

// Запись файла
ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Копирование файла (для UVTools)
ipcMain.handle('copy-file', async (event, srcPath, destPath) => {
    try {
        fs.copyFileSync(srcPath, destPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Проверка существования файла
ipcMain.handle('file-exists', async (event, filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
});

// Удаление файла
ipcMain.handle('delete-file', async (event, filePath) => {
    try {
        fs.unlinkSync(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Получение пути к файлу
ipcMain.handle('get-file-path', async (event, fileName) => {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, fileName);
});

// Оптимизация STL (заглушка)
ipcMain.handle('optimize-stl', async (event, stlPath) => {
    try {
        // Здесь можно подключить MeshOptimizer или другую библиотеку
        return {
            success: true,
            outputPath: stlPath.replace('.stl', '_optimized.stl'),
            originalSize: fs.statSync(stlPath).size,
            optimizedSize: fs.statSync(stlPath).size * 0.7
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================
// AI ENGINEER IPC ОБРАБОТЧИКИ
// ============================================

// Загрузка AI модели (GGUF формат)
ipcMain.handle('load-ai-model', async (event, modelPath) => {
    try {
        if (!modelPath) {
            // Диалог выбора файла
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Выберите AI модель (GGUF)',
                filters: [
                    { name: 'GGUF Models', extensions: ['gguf'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                message: 'Выберите файл модели формата GGUF для загрузки'
            });

            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, error: 'Отменено пользователем' };
            }

            modelPath = result.filePaths[0];
        }

        // Проверяем существование файла
        if (!fs.existsSync(modelPath)) {
            return { success: false, error: 'Файл модели не найден' };
        }

        // Проверяем размер (0.5-8 ГБ)
        const stats = fs.statSync(modelPath);
        const sizeGB = stats.size / (1024 * 1024 * 1024);

        if (sizeGB < 0.5 || sizeGB > 8) {
            return {
                success: false,
                error: `Размер модели (${sizeGB.toFixed(2)} ГБ) вне рекомендуемого диапазона (0.5-8 ГБ)`
            };
        }

        // Сохраняем путь к модели в конфиг
        store.set('modelPath', modelPath);
        store.set('aiMode', 'local-llm');

        console.log(`✅ AI модель загружена: ${modelPath} (${sizeGB.toFixed(2)} ГБ)`);

        return {
            success: true,
            path: modelPath,
            size: stats.size,
            sizeGB: sizeGB.toFixed(2)
        };
    } catch (error) {
        console.error('Ошибка загрузки AI модели:', error);
        return { success: false, error: error.message };
    }
});

// Получение сохраненной модели
ipcMain.handle('get-saved-ai-model', async () => {
    try {
        const modelPath = store.get('modelPath');

        if (modelPath && fs.existsSync(modelPath)) {
            const stats = fs.statSync(modelPath);
            return {
                success: true,
                path: modelPath,
                size: stats.size
            };
        }

        return { success: false, error: 'Модель не настроена' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Проверка доступности WebGPU
ipcMain.handle('check-webgpu', async () => {
    // WebGPU доступен только в renderer процессе
    // Этот обработчик для совместимости
    return { 
        available: false, 
        message: 'WebGPU определяется в renderer процессе' 
    };
});

// Генерация ответа через локальную модель (node-llama-cpp)
ipcMain.handle('generate-ai-response', async (event, prompt, options) => {
    try {
        const aiMode = store.get('aiMode');

        if (aiMode === 'knowledge-base') {
            // Режим базы знаний - быстрый ответ
            return {
                success: true,
                response: null, // Будет сгенерирован в renderer
                source: 'knowledge-base',
                mode: 'knowledge-base'
            };
        }

        if (aiMode === 'local-llm') {
            const modelPath = store.get('modelPath');
            
            if (!modelPath || !fs.existsSync(modelPath)) {
                return {
                    success: false,
                    error: 'LLM модель не найдена. Загрузите GGUF модель.',
                    fallbackToKnowledgeBase: true
                };
            }

            // Проверяем наличие node-llama-cpp
            if (!LlamaInstance) {
                return {
                    success: false,
                    error: 'node-llama-cpp не инициализирован',
                    fallbackToKnowledgeBase: true
                };
            }

            try {
                // Загружаем модель если ещё не загружена
                if (!currentLlamaModel || currentLlamaModel.modelPath !== modelPath) {
                    console.log('🔄 Загрузка модели:', modelPath);
                    
                    currentLlamaModel = await LlamaInstance.loadModel({
                        modelPath: modelPath,
                        // Опции для оптимизации
                        seed: Math.floor(Math.random() * 10000),
                        contextSize: options?.contextSize || 4096,
                        threads: options?.threads || 4
                    });
                    
                    console.log('✅ Модель загружена');
                }

                // Создаём контекст для генерации
                const context = currentLlamaModel.createContext();
                
                // Формируем промпт с системной инструкцией
                const systemPrompt = `Ты — 3D MONOLITH AI Engineer, помощник оператора 3D-печати.
Отвечай профессионально, кратко и по делу.
Специализация: FDM/SLA 3D-печать, материалы, настройки, диагностика.

`;
                
                const fullPrompt = systemPrompt + prompt;

                // Генерируем ответ
                const response = await context.evaluate(fullPrompt, {
                    temperature: options?.temperature || 0.7,
                    topP: options?.topP || 0.9,
                    topK: options?.topK || 40,
                    maxTokens: options?.maxTokens || 500,
                    onStopSequence: options?.stopSequences || ['\n\n', 'Пользователь:', 'User:']
                });

                return {
                    success: true,
                    response: response,
                    source: 'local-llm',
                    mode: 'local-llm',
                    modelPath: modelPath
                };
                
            } catch (llamaError) {
                console.error('Ошибка node-llama-cpp:', llamaError);
                
                // Fallback на базу знаний при ошибке
                return {
                    success: true,
                    response: null,
                    source: 'knowledge-base',
                    mode: 'knowledge-base',
                    fallbackMessage: `⚠️ Ошибка LLM: ${llamaError.message}\n\nИспользуется база знаний...`
                };
            }
        }

        if (aiMode === 'weblm') {
            // WebLLM режим - обработка в renderer
            return {
                success: true,
                response: null,
                source: 'weblm',
                mode: 'weblm'
            };
        }

        return {
            success: false,
            error: 'Неизвестный режим AI'
        };
    } catch (error) {
        console.error('Ошибка генерации AI ответа:', error);
        return { 
            success: false, 
            error: error.message,
            fallbackToKnowledgeBase: true
        };
    }
});

// Получение текущего режима AI
ipcMain.handle('get-ai-mode', async () => {
    return {
        mode: store.get('aiMode'),
        modelPath: store.get('modelPath'),
        webgpuAvailable: store.get('webgpuAvailable')
    };
});

// Установка режима AI
ipcMain.handle('set-ai-mode', async (event, mode) => {
    const validModes = ['knowledge-base', 'local-llm', 'weblm'];
    
    if (!validModes.includes(mode)) {
        return { success: false, error: 'Неверный режим AI' };
    }

    store.set('aiMode', mode);
    
    return {
        success: true,
        mode: mode
    };
});

// Загрузка базы знаний из JSON файла
ipcMain.handle('load-knowledge-base', async () => {
    try {
        const kbPath = path.join(__dirname, 'data', 'knowledge-base.json');
        
        if (!fs.existsSync(kbPath)) {
            return { 
                success: false, 
                error: 'Файл базы знаний не найден' 
            };
        }

        const content = fs.readFileSync(kbPath, 'utf-8');
        const knowledgeBase = JSON.parse(content);

        return {
            success: true,
            data: knowledgeBase
        };
    } catch (error) {
        console.error('Ошибка загрузки базы знаний:', error);
        return { success: false, error: error.message };
    }
});

// Сохранение настроек AI
ipcMain.handle('save-ai-settings', async (event, settings) => {
    try {
        store.set('aiSettings', settings);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Получение настроек AI
ipcMain.handle('get-ai-settings', async () => {
    return {
        settings: store.get('aiSettings', {})
    };
});

// Поиск GGUF моделей в папке Загрузки и проекте
ipcMain.handle('find-gguf-models', async (event) => {
    try {
        const allFiles = [];
        
        // 1. Папка загрузок
        const downloadsPath = path.join(require('os').homedir(), 'Downloads');
        if (fs.existsSync(downloadsPath)) {
            const downloadsFiles = fs.readdirSync(downloadsPath)
                .filter(file => file.toLowerCase().endsWith('.gguf'))
                .map(file => {
                    const filePath = path.join(downloadsPath, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime,
                        location: 'Загрузки'
                    };
                });
            allFiles.push(...downloadsFiles);
        }
        
        // 2. Папка проекта
        const projectPath = __dirname;
        if (fs.existsSync(projectPath)) {
            const projectFiles = findGGUFInDirectory(projectPath);
            allFiles.push(...projectFiles);
        }
        
        // 3. Рабочий стол
        const desktopPath = path.join(require('os').homedir(), 'Desktop');
        if (fs.existsSync(desktopPath)) {
            const desktopFiles = fs.readdirSync(desktopPath)
                .filter(file => file.toLowerCase().endsWith('.gguf'))
                .map(file => {
                    const filePath = path.join(desktopPath, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime,
                        location: 'Рабочий стол'
                    };
                });
            allFiles.push(...desktopFiles);
        }
        
        // 4. Документы
        const documentsPath = path.join(require('os').homedir(), 'Documents');
        if (fs.existsSync(documentsPath)) {
            const documentsFiles = fs.readdirSync(documentsPath)
                .filter(file => file.toLowerCase().endsWith('.gguf'))
                .map(file => {
                    const filePath = path.join(documentsPath, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime,
                        location: 'Документы'
                    };
                });
            allFiles.push(...documentsFiles);
        }
        
        // Удаляем дубликаты
        const uniqueFiles = allFiles.filter((file, index, self) =>
            index === self.findIndex(f => f.path === file.path)
        );
        
        // Сортируем по дате (новые первые)
        uniqueFiles.sort((a, b) => b.modified - a.modified);
        
        console.log(`🔍 Найдено GGUF файлов: ${uniqueFiles.length}`);
        
        return {
            success: true,
            files: uniqueFiles,
            searchPaths: [downloadsPath, projectPath, desktopPath, documentsPath]
        };
    } catch (error) {
        console.error('Ошибка поиска GGUF моделей:', error);
        return { success: false, error: error.message };
    }
});

// Рекурсивный поиск GGUF файлов в директории
function findGGUFInDirectory(dir, maxDepth = 2) {
    const results = [];
    
    try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            // Пропускаем node_modules и скрытые папки
            if (file === 'node_modules' || file.startsWith('.') || file === 'dist') {
                continue;
            }
            
            const filePath = path.join(dir, file);
            
            try {
                const stats = fs.statSync(filePath);
                
                if (stats.isFile() && file.toLowerCase().endsWith('.gguf')) {
                    results.push({
                        name: file,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime,
                        location: 'Папка проекта'
                    });
                } else if (stats.isDirectory() && maxDepth > 0) {
                    // Рекурсивный поиск с уменьшением глубины
                    const subResults = findGGUFInDirectory(filePath, maxDepth - 1);
                    results.push(...subResults);
                }
            } catch (e) {
                // Пропускаем файлы к которым нет доступа
            }
        }
    } catch (e) {
        // Пропускаем директории к которым нет доступа
    }
    
    return results;
}
