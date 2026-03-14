/**
 * 3D MONOLITH — UVTOOLS BRIDGE
 * Модуль для взаимодействия с UVTools через CLI
 * Версия: 1.0.0
 * 
 * UVTools: https://github.com/sn4k3/UVtools
 * Поддерживаемые форматы: .pwmo, .pwma, .pwms, .ctb, .ctb2, .cbddlp, .sl1, .sl1s
 */

window.UVToolsBridge = (function() {
    'use strict';

    // Пути к UVTools (настраиваемые)
    // Используем просто имя команды, так как UVtools добавлен в PATH
    let uvtoolsPath = 'UVtoolsCmd';
    let uvtoolsAvailable = false;

    // Используем глобальные объекты Node.js
    const path = (typeof window !== 'undefined' && window.require) ? window.require('path') : null;
    const os = (typeof window !== 'undefined' && window.require) ? window.require('os') : null;
    
    // Fallback для Electron
    const tmpDir = os ? os.tmpdir() : 'C:\\temp';

    /**
     * Проверка доступности UVTools
     */
    async function checkAvailability() {
        if (!window.electron || !window.electron.execCommand) {
            console.warn('⚠️ Electron execCommand недоступен');
            return false;
        }

        // Если uvtoolsPath это команда (не путь), проверяем запуском
        if (!uvtoolsPath.includes('\\') && !uvtoolsPath.includes('/')) {
            // Это команда в PATH, пробуем выполнить
            const result = await window.electron.execCommand(uvtoolsPath + ' --core-version');
            if (result.success && result.stdout) {
                uvtoolsAvailable = true;
                console.log('✅ UVTools доступен, версия:', result.stdout.trim());
                return true;
            }
            console.warn('⚠️ UVTools не запустился:', result.error || result.stderr || 'неизвестно');
            return false;
        }

        // Проверяем существование файла через Electron
        const exists = await window.electron.fileExists(uvtoolsPath);
        if (!exists) {
            console.warn('⚠️ UVTools не найден по пути:', uvtoolsPath);
            return false;
        }

        // Пробуем выполнить с полным путём (разделяем EXE и аргументы)
        const result = await window.electron.execCommand(uvtoolsPath, ['--core-version']);

        if (result.success && result.stdout) {
            uvtoolsAvailable = true;
            console.log('✅ UVTools доступен, версия:', result.stdout.trim());
            return true;
        }

        console.warn('⚠️ UVTools не запустился:', result.error || result.stderr || 'неизвестно');
        return false;
    }

    /**
     * Выполнение команды UVTools
     * UVTools 6.0.0 может возвращать exit code 1 даже при успешном выполнении
     */
    async function execCommand(exeOrCommand, argsOrTimeout, timeout = 30000) {
        if (!uvtoolsAvailable) {
            const available = await checkAvailability();
            if (!available) {
                throw new Error('UVTools не доступен. Установите UVTools из https://github.com/sn4k3/UVtools');
            }
        }

        // Поддержка двух форматов вызова:
        // 1. execCommand(commandString, timeout) - строка команды
        // 2. execCommand(exePath, [args], timeout) - exe + аргументы

        let command, finalTimeout;

        if (Array.isArray(argsOrTimeout)) {
            // Формат 2: exe + аргументы (без кавычек для аргументов-путей)
            command = `${exeOrCommand} ${argsOrTimeout.join(' ')}`;
            finalTimeout = timeout;
        } else {
            // Формат 1: строка команды
            command = exeOrCommand;
            finalTimeout = argsOrTimeout || timeout;
        }

        console.log('🔧 [UVTools] Выполнение:', command);

        const result = await window.electron.execCommand(command, { timeout: finalTimeout });

        // UVTools 6.0.0 может возвращать exit code 1 даже при успешном выводе
        // Считаем успешным, если есть stdout или stderr с данными
        const hasOutput = result.stdout || result.stderr;
        const isSuccess = result.success || hasOutput;

        if (!isSuccess) {
            throw new Error(`UVTools ошибка: ${result.error || 'неизвестная ошибка'}`);
        }

        return { ...result, success: true }; // Принудительно помечаем как успех если есть вывод
    }

    /**
     * Парсинг вывода print-properties в JSON
     * UVTools выводит данные в формате: Key: Value или Key=Value в строках через запятую
     */
    function parseProperties(output) {
        const properties = {};
        const lines = output.split('\n');

        // Ключевые параметры которые нужно извлечь
        const keyMap = {
            'VolumeMl': 'VolumeMl',
            'WeightG': 'WeightG',
            'PrintTime': 'PrintTime',
            'PrintTimeHours': 'PrintTimeHours',
            'PrintTimeComputed': 'PrintTimeComputed',
            'LayerCount': 'LayerCount',
            'BottomLayersCount': 'BottomLayersCount',
            'BottomLayerCount': 'BottomLayerCount',
            'ExposureTime': 'ExposureTime',
            'BottomExposureTime': 'BottomExposureTime',
            'LayerHeight': 'LayerHeight',
            'LiftSpeed': 'LiftSpeed',
            'RetractSpeed': 'RetractSpeed',
            'DisplayWidth': 'DisplayWidth',
            'DisplayHeight': 'DisplayHeight',
            'MachineZ': 'MachineZ',
            'ResolutionX': 'ResolutionX',
            'ResolutionY': 'ResolutionY',
            'MaterialMilliliters': 'MaterialMilliliters',
            'MaterialGrams': 'MaterialGrams',
            'MachineName': 'MachineName'
        };

        // Ищем ключевые строки в формате Key: Value или Key=Value
        for (const line of lines) {
            const trimmed = line.trim();

            // Пропускаем пустые и служебные строки
            if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('UVtools') ||
                trimmed.startsWith('Opening') || trimmed.startsWith('Done') ||
                trimmed.startsWith('---') || trimmed.startsWith('Total') ||
                trimmed.startsWith('Использование') || trimmed.startsWith('Описание') ||
                trimmed.startsWith('╨') || trimmed.startsWith('╟') ||
                trimmed.startsWith('╤') || trimmed.startsWith('╡')) {
                continue;
            }

            // Разбиваем строку на части по запятой (UVTools выводит через запятую)
            const parts = trimmed.split(',');

            for (const part of parts) {
                const subTrimmed = part.trim();

                // Проверяем каждый ключ
                for (const [searchKey, propKey] of Object.entries(keyMap)) {
                    // Формат: "Key: Value" или "Key = Value"
                    const regex = new RegExp(`^${searchKey}[:=]\\s*(.+)$`, 'i');
                    const match = subTrimmed.match(regex);

                    if (match) {
                        let valueStr = match[1].trim();
                        let value = valueStr;

                        // Извлекаем число из строки с единицами (например, "0.05mm" → 0.05, "14400mm/mim" → 14400)
                        // Регулярка находит первое число (целое или дробное) в строке
                        const numMatch = valueStr.match(/([\d]+\.?[\d]*)/);
                        if (numMatch) {
                            value = parseFloat(numMatch[1]);
                        } else if (/^\d+$/.test(valueStr)) {
                            value = parseInt(valueStr, 10);
                        } else if (/^\d+\.?\d*$/.test(valueStr)) {
                            value = parseFloat(valueStr);
                        }

                        properties[propKey] = value;
                        break;
                    }
                }
            }
        }

        console.log('🔍 [parseProperties] Найдено ключей:', Object.keys(properties).length);
        console.log('   Ключи:', Object.keys(properties).join(', '));

        return properties;
    }

    /**
     * Чтение метаданных из файла
     * Копируем файл во временную папку для избежания проблем с кодировкой
     */
    async function readMetadata(filePath) {
        console.log('📖 [UVTools] Чтение метаданных:', filePath);

        // Копируем файл во временную папку с латинским именем
        const tempFileName = 'temp_' + Date.now() + '.pwmo';
        const tempPath = path ? path.join(os.tmpdir(), tempFileName) : `${tmpDir}\\${tempFileName}`;
        
        try {
            // Копируем файл
            console.log('📋 [UVTools] Копирование во временную папку:', tempPath);
            await window.electron.copyFile(filePath, tempPath);

            // Проверяем, что файл существует
            const exists = await window.electron.fileExists(tempPath);
            if (!exists) {
                throw new Error(`Файл не создан: ${tempPath}`);
            }
            console.log('✅ [UVTools] Файл создан:', tempPath);

            // Для UVTools 6.x используем print-properties
            // Синтаксис: UVtoolsCmd.exe print-properties <файл>
            console.log('🔧 [UVTools 6.x] Попытка 1: print-properties...');
            console.log('   Команда:', `"${uvtoolsPath}" print-properties "${tempPath}"`);
            let result = await execCommand(uvtoolsPath, ['print-properties', tempPath]);

            // Если print-properties не сработал, пробуем info
            if (!result.success || (!result.stdout && !result.stderr)) {
                console.log('🔧 [UVTools 6.x] Попытка 2: info...');
                console.log('   Команда:', `"${uvtoolsPath}" info "${tempPath}"`);
                result = await execCommand(uvtoolsPath, ['info', tempPath]);
            }

            // Если info не сработал, пробуем прямой вызов
            if (!result.success || (!result.stdout && !result.stderr)) {
                console.log('🔧 [UVTools 6.x] Попытка 3: прямой вызов...');
                console.log('   Команда:', `"${uvtoolsPath}" "${tempPath}"`);
                result = await execCommand(uvtoolsPath, [tempPath]);
            }
            
            // Если нет stdout, пробуем stderr
            if (!result.stdout && result.stderr) {
                result.stdout = result.stderr;
            }
            
            if (!result.stdout && !result.stderr) {
                throw new Error('Пустой вывод от UVTools');
            }

            const output = result.stdout || result.stderr;
            console.log('📝 [UVTools] Вывод (первые 500 символов):', output.substring(0, 500));
            console.log('📝 [UVTools] Длина вывода:', output.length, 'символов');
            
            const properties = parseProperties(output);
            console.log('📊 [UVTools] Метаданные:', properties);

            // Преобразуем в стандартный формат
            const metadata = {
                valid: true,
                format: detectFormat(filePath),

                // Время печати с поправочным коэффициентом для Anycubic Photon Mono
                // UVTools не учитывает все механические задержки, поэтому применяем коэффициент ~2.05
                // 71.5 мин (слайсер) / 34.8 мин (UVTools) = 2.05
                printTimeSeconds: (properties.PrintTime || properties.PrintTimeComputed || 0) * 2.05,
                printTimeHours: ((properties.PrintTime || properties.PrintTimeComputed || 0) * 2.05) / 3600,

                // Слои
                layerCount: properties.LayerCount || properties.TotalLayers || 0,
                
                // Размеры
                dimensions: {
                    x: properties.DisplayWidth || properties.DimensionX || properties.SizeX || properties.Width || 0,
                    y: properties.DisplayHeight || properties.DimensionY || properties.SizeY || properties.Height || 0,
                    z: properties.MachineZ || properties.DimensionZ || properties.SizeZ || properties.Depth || 0
                },
                
                // Объём и вес
                resinVolumeMl: properties.VolumeMl || properties.MaterialMilliliters || properties.ResinVolume || properties.Volume || 0,
                resinWeightGrams: properties.WeightG || properties.MaterialGrams || properties.ResinWeight || properties.Weight || 0,
                
                // Параметры печати
                layerHeight: properties.LayerHeight || 0,
                normalExposure: properties.ExposureTime || properties.NormalExposure || 0,
                bottomExposure: properties.BottomExposureTime || properties.BottomExposure || 0,
                bottomLayers: properties.BottomLayersCount || properties.BottomLayers || 0,
                liftSpeed: properties.LiftSpeed || 0,
                
                // Принтер
                printerModel: properties.MachineName || properties.PrinterModel || properties.Printer || 'Unknown',
                resolution: {
                    x: properties.ResolutionX || 0,
                    y: properties.ResolutionY || 0
                },
                
                _raw: properties
            };

            // Логируем ключевые значения
            console.log('📊 [UVTools] Метаданные:', metadata);
            console.log('   layerHeight:', metadata.layerHeight, 'type:', typeof metadata.layerHeight);
            console.log('   properties.LayerHeight:', properties.LayerHeight, 'type:', typeof properties.LayerHeight);

            // Удаляем временный файл
            console.log('🗑️ [UVTools] Удаление временного файла');
            await window.electron.deleteFile(tempPath);

            return metadata;
            
        } catch (error) {
            console.error('❌ [UVTools] Ошибка чтения:', error);
            
            // Пытаемся удалить временный файл если он остался
            try {
                await window.electron.deleteFile(tempPath);
            } catch (e) {}
            
            // Возвращаем данные из резервного парсера
            throw error;
        }
    }

    /**
     * Экспорт меша из любого SLA формата (PWMO, CTB, FDG, PHZ, etc)
     * UVTools 6.x: export-mesh <input> <output> [options]
     * @param {string} filePath - Путь к исходному файлу (любой SLA формат)
     * @param {string} outputPath - Путь для выходного STL
     * @param {number} quality - Качество (1=быстро, 3=качественно)
     */
    async function exportMesh(filePath, outputPath, quality = 1) {
        console.log('🏗️ [UVTools] Реконструкция 3D-модели из SLA файла...');
        console.log('   Файл:', filePath);
        console.log('   Выход:', outputPath);
        console.log('   Качество:', quality);

        try {
            // Копируем файл во временную папку с латинским именем
            const tempFileName = 'temp_' + Date.now() + path.extname(filePath);
            const tempPath = path ? path.join(os.tmpdir(), tempFileName) : `${tmpDir}\\${tempFileName}`;

            console.log('📋 [UVTools] Копирование во временную папку:', tempPath);
            await window.electron.copyFile(filePath, tempPath);

            // 🔧 UVTools 6.x: export-mesh <input> <output> -q <quality>
            // Работает для ВСЕХ SLA форматов: PWMO, CTB, FDG, PHZ, SL1, etc
            console.log('🔧 [UVTools 6.x] Команда: export-mesh');
            console.log('   Формат: export-mesh <input> <output> -q <quality>');
            
            const result = await execCommand(uvtoolsPath, ['export-mesh', tempPath, outputPath, '-q', quality.toString()], 120000);

            // 🔧 Выводим полный вывод UVTools для отладки
            console.log('📝 [UVTools] Вывод команды:');
            if (result.stdout) console.log('   stdout:', result.stdout.substring(0, 1000));
            if (result.stderr) console.log('   stderr:', result.stderr.substring(0, 1000));

            // Проверяем на ошибки
            if (result.stderr && (result.stderr.includes('not matched') || result.stderr.includes('Unknown command') || result.stderr.includes('Error:'))) {
                throw new Error('UVTools ошибка: ' + result.stderr);
            }

            // 🔧 Даем ОС 500мс "продышаться" после записи
            console.log('⏳ [UVTools] Ожидание записи файла на диск...');
            await new Promise(resolve => setTimeout(resolve, 500));

            // 🔧 Проверяем файл через IPC
            try {
                const fileExists = await window.electron.fileExists(outputPath);
                if (fileExists) {
                    const stats = await window.electron.execCommand(`powershell -Command "(Get-Item '${outputPath}').Length"`);
                    console.log(`✅ [UVTools] STL файл существует! Размер: ${stats.stdout || 'N/A'} байт`);
                } else {
                    console.warn('⚠️ [UVTools] STL файл не найден, пробуем ещё...');
                    
                    // Пробуем ещё 3 раза с интервалом 500мс
                    for (let i = 0; i < 3; i++) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        const exists = await window.electron.fileExists(outputPath);
                        if (exists) {
                            console.log(`✅ [UVTools] STL файл найден на попытке ${i + 1}!`);
                            break;
                        }
                        console.log(`⏳ [UVTools] Попытка ${i + 1} не удалась...`);
                    }
                }
            } catch (checkError) {
                console.error('❌ [UVTools] Ошибка проверки файла:', checkError.message);
            }

            // 🔧 НЕ удаляем временный файл сразу — даём время на загрузку STL
            setTimeout(() => {
                window.electron.deleteFile(tempPath).catch(() => {});
                console.log('🗑️ [UVTools] Временный файл удалён (с задержкой 30с)');
            }, 30000);

            return {
                success: true,
                meshPath: outputPath
            };

        } catch (error) {
            console.error('❌ [UVTools] Ошибка экспорта меша:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Извлечение содержимого файла
     */
    async function extract(filePath, outputFolder) {
        console.log('📂 [UVTools] Извлечение:', filePath, '→', outputFolder);

        const result = await execCommand(`extract "${filePath}" "${outputFolder}"`);
        
        return {
            success: result.success,
            output: result.stdout,
            error: result.stderr
        };
    }

    /**
     * Конвертация файла
     */
    async function convert(inputPath, outputFormat, outputPath) {
        console.log('🔄 [UVTools] Конвертация:', inputPath, '→', outputFormat);

        const result = await execCommand(`convert "${inputPath}" ${outputFormat} "${outputPath}"`);
        
        return {
            success: result.success,
            output: result.stdout,
            error: result.stderr
        };
    }

    /**
     * Определение формата по расширению
     */
    function detectFormat(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        
        const formatMap = {
            'pwmo': 'Photon Mono',
            'pwma': 'Photon Mono 4K',
            'pwms': 'Photon Mono SE',
            'pwx': 'Photon Mono X',
            'pw0': 'Photon Mono',
            'pws': 'Photon',
            'ctb': 'Chitubox',
            'ctb2': 'Chitubox V2',
            'cbddlp': 'Chitubox DLP',
            'phz': 'Chitubox PHZ',
            'sl1': 'PrusaSlicer SL1',
            'sl1s': 'PrusaSlicer SL1S'
        };
        
        return formatMap[ext] || `Unknown (${ext})`;
    }

    /**
     * Расчёт стоимости на основе данных UVTools
     */
    async function calculateCost(filePath, customParams = {}) {
        const metadata = await readMetadata(filePath);
        
        if (!metadata.valid) {
            throw new Error('Не удалось прочитать метаданные');
        }

        // Используем SLACostCalculator если доступен
        if (window.SLACostCalculator) {
            return window.SLACostCalculator.calculateCost({
                printTimeHours: metadata.printTimeHours,
                resinVolumeCm3: metadata.resinVolumeMl,
                ...customParams
            });
        }

        // Резервный расчёт
        const resinPricePerLiter = customParams.resinPricePerLiter || 3500;
        const printerHourlyRate = customParams.printerHourlyRate || 250;
        const electricityRate = customParams.electricityRate || 5.5;
        const printerPowerKw = customParams.printerPowerKw || 0.15;

        const resinCost = (metadata.resinVolumeMl / 1000) * resinPricePerLiter;
        const printerCost = metadata.printTimeHours * printerHourlyRate;
        const electricityCost = metadata.printTimeHours * printerPowerKw * electricityRate;
        const postProcessingCost = customParams.postProcessingCost || 150;

        const productionCost = resinCost + printerCost + electricityCost + postProcessingCost;
        const margin = customParams.margin || 1.25;
        const total = productionCost * margin;

        return {
            resinCost: Math.round(resinCost),
            printerCost: Math.round(printerCost),
            electricityCost: Math.round(electricityCost),
            postProcessingCost,
            productionCost: Math.round(productionCost),
            total: Math.round(total),
            metadata
        };
    }

    /**
     * Инициализация модуля
     */
    async function init() {
        console.log('🔧 [UVTools] Инициализация...');
        const available = await checkAvailability();
        
        return {
            available,
            version: uvtoolsAvailable ? 'detected' : 'not found',
            message: available 
                ? '✅ UVTools готов к работе' 
                : '⚠️ UVTools не найден. Установите из https://github.com/sn4k3/UVtools'
        };
    }

    /**
     * Публичный API
     */
    return {
        init,
        checkAvailability,
        readMetadata,
        extract,
        convert,
        exportMesh, // 🔧 Экспорт меша для ВСЕХ SLA форматов
        calculateCost,
        detectFormat,
        isAvailable: () => uvtoolsAvailable,
        setPath: (path) => { uvtoolsPath = path; }
    };
})();

console.log('✅ UVTools Bridge модуль загружен');
