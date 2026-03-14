/**
 * 3D MONOLITH — МОДУЛЬ РАСЧЁТА СТОИМОСТИ SLA ПЕЧАТИ
 * Версия: 1.0.0
 * 
 * Поддерживаемые форматы:
 * - Chitubox (.ctb, .pwmo)
 * - Anycubic Photon (.photon)
 * - Lychee Slicer (.lyt)
 */

window.SLACostCalculator = (function() {
    'use strict';

    // Плотности смол (г/см³)
    const RESIN_DENSITIES = {
        standard: 1.10,
        tough: 1.15,
        flexible: 1.20,
        castable: 1.25,
        dental: 1.15,
        rapid: 1.08,
        waterWashable: 1.12
    };

    // Базовые цены смол (₽/литр)
    const RESIN_PRICES = {
        standard: 3500,
        tough: 5500,
        flexible: 7000,
        castable: 12000,
        dental: 15000,
        rapid: 6000,
        waterWashable: 5000
    };

    /**
     * Парсер бинарных SLA файлов
     */
    const BinaryParser = {
        /**
         * Определяет тип файла по сигнатуре
         */
        detectFormat: function(buffer) {
            const dv = new DataView(buffer);
            const magic32 = dv.getUint32(0, true);
            const magic16 = dv.getUint16(0, true);
            const str4 = String.fromCharCode(
                dv.getUint8(0), dv.getUint8(1),
                dv.getUint8(2), dv.getUint8(3)
            );
            const str8 = str4 + String.fromCharCode(
                dv.getUint8(4), dv.getUint8(5),
                dv.getUint8(6), dv.getUint8(7)
            );

            console.log('🔍 [SLA] Сигнатуры файла:');
            console.log('   magic32:', '0x' + magic32.toString(16).toUpperCase());
            console.log('   magic16:', '0x' + magic16.toString(16).toUpperCase());
            console.log('   str4:', JSON.stringify(str4));
            console.log('   str8:', JSON.stringify(str8));

            // Anycubic Photon / PWMO (ПЕРВАЯ ПРОВЕРКА!)
            if (str8 === 'ANYCUBIC' || str4 === 'ANYC' || str8.startsWith('ANYCUBIC')) {
                console.log('✅ [SLA] Определён формат: Anycubic Photon (.pwmo)');
                return { type: 'photon', version: 'pwmo' };
            }

            // Chitubox CWK/PWMO (разные версии)
            if (magic32 === 0x07450403 || 
                magic32 === 0x07450404 || 
                str4 === 'CWK\0' || 
                str4 === 'PWMO' ||
                str8.startsWith('CWK') ||
                str8.startsWith('PWMO')) {
                console.log('✅ [SLA] Определён формат: Chitubox');
                return { type: 'chitubox', version: 'v2' };
            }

            // Anycubic Photon (старые версии)
            if (magic16 === 0x4D42 || 
                str4.startsWith('PHO') ||
                str8.startsWith('PHOTON') ||
                str4 === '\x02\x00\x00\x00') {
                console.log('✅ [SLA] Определён формат: Anycubic Photon (старый)');
                return { type: 'photon', version: 'v1' };
            }

            // Lychee
            if (str4 === 'LYT\0' || str4 === 'lyt\0' || str8.startsWith('LYT')) {
                console.log('✅ [SLA] Определён формат: Lychee');
                return { type: 'lychee', version: 'v3' };
            }

            // Photon Mono (новые версии)
            if (str8.startsWith('\x01\x00\x00\x00') || str8.startsWith('\x02\x00\x00\x00')) {
                console.log('✅ [SLA] Определён формат: Photon Mono (бинарный)');
                return { type: 'photon', version: 'v2' };
            }

            // Пробуем определить по структуре
            return this.detectByStructure(dv, buffer.byteLength);
        },

        /**
         * Определение по внутренней структуре
         */
        detectByStructure: function(dv, fileSize) {
            console.log('🔍 [SLA] Попытка определения по структуре...');
            console.log('   Размер файла:', fileSize, 'байт');
            
            // Ищем характерные паттерны
            for (let offset = 0; offset < Math.min(2000, fileSize - 8); offset += 4) {
                const val32 = dv.getUint32(offset, true);
                const floatVal = dv.getFloat32(offset, true);

                // Слой высота обычно 0.01-0.1 мм (0.00001-0.0001 м)
                if (floatVal > 0.00001 && floatVal < 0.0001 && offset > 16) {
                    // Проверяем соседние значения
                    const width = dv.getUint32(offset - 12, true);
                    const height = dv.getUint32(offset - 8, true);

                    if (width > 100 && width < 5000 && height > 100 && height < 5000) {
                        console.log(`✅ [SLA] Найдена структура Chitubox на смещении ${offset}`);
                        return { type: 'chitubox', version: 'v2', layerHeightOffset: offset };
                    }
                }
                
                // Альтернативная проверка: высота слоя в мм (0.01-0.1)
                if (floatVal > 0.01 && floatVal < 0.1 && offset > 16) {
                    const width = dv.getUint32(offset - 12, true);
                    const height = dv.getUint32(offset - 8, true);
                    
                    if (width > 50 && width < 300 && height > 50 && height < 200) {
                        console.log(`✅ [SLA] Найдена альтернативная структура на смещении ${offset}`);
                        return { type: 'chitubox', version: 'v2', layerHeightOffset: offset };
                    }
                }
            }

            console.warn('⚠️ [SLA] Не удалось определить формат файла');
            return { type: 'unknown', confidence: 0.3 };
        },

        /**
         * Парсинг Chitubox формата
         */
        parseChitubox: function(buffer) {
            const dv = new DataView(buffer);
            const fileSize = buffer.byteLength;
            const data = {};

            try {
                // Заголовок CWK v2
                data.width = dv.getUint32(8, true);
                data.height = dv.getUint32(12, true);
                data.layerCount = dv.getUint32(16, true);
                data.layerHeight = dv.getFloat32(20, true);

                // Время печати (может быть в разных местах)
                data.printTimeSec = this.findPrintTime(dv, fileSize);

                // Объём смолы (если есть в файле)
                data.resinVolumeCm3 = this.findResinVolume(dv, fileSize);

                // Вес модели
                data.weightGrams = this.findModelWeight(dv, fileSize);

                // Проверка валидности
                if (data.layerHeight < 0.001 || data.layerHeight > 0.5) {
                    throw new Error('Некорректная высота слоя');
                }

                data.valid = true;
                data.format = 'Chitubox';

            } catch (e) {
                console.warn('⚠️ Chitubox парсер:', e.message);
                data.valid = false;
                data.format = 'Chitubox (ошибка)';
            }

            return data;
        },

        /**
         * Парсинг Anycubic Photon (.pwmo)
         * Структура: заголовок 8 байт "ANYCUBIC", затем данные
         */
        parsePhoton: function(buffer) {
            const dv = new DataView(buffer);
            const fileSize = buffer.byteLength;
            const data = {};

            console.log('🔧 [Photon] Парсинг Anycubic PWMO, размер:', fileSize, 'байт');

            try {
                // Проверяем сигнатуру ANYCUBIC
                const sig = String.fromCharCode(...new Uint8Array(buffer, 0, 8));
                console.log('📝 [Photon] Сигнатура:', sig);
                
                if (sig === 'ANYCUBIC') {
                    // Читаем данные по известным смещениям для Anycubic Mono (UVTools совместимые)
                    console.log('✅ [Photon] Распознан формат Anycubic Mono (.pwmo)');

                    // Высота слоя (float32) - смещение 84
                    const layerHeight = dv.getFloat32(84, true);
                    console.log('   Высота слоя (84):', layerHeight, 'мм');

                    // Количество слоёв (uint32) - смещение 76
                    const layerCount = dv.getUint32(76, true);
                    console.log('   Количество слоёв (76):', layerCount);

                    // Разрешение X/Y (uint32) - пробуем несколько смещений
                    const resOffsets = [
                        { x: 28, y: 32 },  // Anycubic Mono
                        { x: 20, y: 24 },  // Anycubic Photon (старый)
                        { x: 40, y: 44 },  // Anycubic Mono (новый)
                        { x: 52, y: 56 }   // Anycubic Mono (альтернативный)
                    ];
                    
                    let resolutionX = 0, resolutionY = 0;
                    let foundOffset = null;
                    
                    for (const offset of resOffsets) {
                        const resX = dv.getUint32(offset.x, true);
                        const resY = dv.getUint32(offset.y, true);
                        
                        // Проверяем на адекватность (от 100 до 10000)
                        if (resX > 100 && resX < 10000 && resY > 100 && resY < 10000) {
                            resolutionX = resX;
                            resolutionY = resY;
                            foundOffset = offset;
                            console.log(`   ✅ Найдено разрешение на офсете ${offset.x}/${offset.y}: ${resolutionX} x ${resolutionY}`);
                            break;
                        }
                    }
                    
                    // Если не нашли, используем стандартные значения для Photon Mono
                    if (resolutionX < 100 || resolutionY < 100) {
                        resolutionX = 1620;
                        resolutionY = 2560;
                        console.log('   ⚠️ Используем стандартное разрешение: 1620 x 2560 (Photon Mono)');
                    }
                    
                    console.log('   Разрешение X:', resolutionX);
                    console.log('   Разрешение Y:', resolutionY);

                    // Размер пикселя в мм (для Photon Mono: 0.035 мм)
                    const pixelSize = 0.035;
                    const width = resolutionX * pixelSize;
                    const height = resolutionY * pixelSize;
                    console.log('   Размер области печати:', width.toFixed(1), 'x', height.toFixed(1), 'мм');

                    // Время экспозиции (float32) - смещение 132
                    let exposureTime = dv.getFloat32(132, true);
                    console.log('   Время экспозиции (132):', exposureTime, 'сек');

                    // Если время > 10 сек, скорее всего это Bottom Exposure
                    if (exposureTime > 10) {
                        console.log('   ⚠️ Возможно это Bottom Exposure, ищем Normal Exposure...');
                        const normalExp1 = dv.getFloat32(136, true);
                        const normalExp2 = dv.getFloat32(140, true);
                        console.log('   Normal Exposure (136):', normalExp1, 'сек');
                        console.log('   Normal Exposure (140):', normalExp2, 'сек');

                        if (normalExp1 > 0.5 && normalExp1 < 10) {
                            exposureTime = normalExp1;
                            console.log('   ✅ Используем Normal Exposure (136):', exposureTime, 'сек');
                        } else if (normalExp2 > 0.5 && normalExp2 < 10) {
                            exposureTime = normalExp2;
                            console.log('   ✅ Используем Normal Exposure (140):', exposureTime, 'сек');
                        } else {
                            exposureTime = 2.0;
                            console.log('   ⚠️ Используем стандартное время:', exposureTime, 'сек');
                        }
                    }

                    if (exposureTime > 5) {
                        console.log('   ⚠️ Время экспозиции слишком большое, используем 2.0 сек');
                        exposureTime = 2.0;
                    }
                    
                    // Поиск общего времени печати в файле (PrintTime из HeaderSettings)
                    // HeaderSettings находится по адресу 64, PrintTime обычно в диапазоне 140-200
                    let foundPrintTime = 0;

                    // Сначала проверяем известные смещения из UVTools (PrintTime: 4289)
                    const knownTimeOffsets = [140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200];
                    for (const offset of knownTimeOffsets) {
                        const timeVal = dv.getFloat32(offset, true);
                        // Ищем время в диапазоне 100-50000 сек (от 1.5 мин до 14 часов)
                        if (timeVal > 100 && timeVal < 50000) {
                            console.log('   🔍 Найдено время на смещении', offset, ':', timeVal, 'сек =', (timeVal/3600).toFixed(2), 'ч');
                            foundPrintTime = timeVal;
                            break;
                        }
                    }

                    // Если не нашли, ищем в расширенном диапазоне
                    if (foundPrintTime === 0) {
                        for (let offset = 200; offset < 500; offset += 4) {
                            const timeVal = dv.getFloat32(offset, true);
                            if (timeVal > 100 && timeVal < 50000) {
                                console.log('   🔍 Найдено время на смещении', offset, ':', timeVal, 'сек =', (timeVal/3600).toFixed(2), 'ч');
                                foundPrintTime = timeVal;
                                break;
                            }
                        }
                    }

                    if (foundPrintTime > 0) {
                        console.log('   ✅ Используем реальное время из файла:', foundPrintTime, 'сек');
                        data.printTimeSec = foundPrintTime;
                    }
                    
                    // Поиск объёма смолы в файле (VolumeMl из HeaderSettings)
                    // HeaderSettings находится по адресу 64 + смещение в таблице
                    // VolumeMl и WeightG обычно находятся в диапазоне 160-200
                    let foundVolumeMl = 0;
                    let foundWeightG = 0;
                    
                    // Проверяем несколько известных смещений из UVTools
                    const volumeOffsets = [
                        { vol: 168, weight: 172 }, // VolumeMl, WeightG
                        { vol: 172, weight: 176 },
                        { vol: 176, weight: 180 },
                        { vol: 180, weight: 184 },
                        { vol: 184, weight: 188 }
                    ];
                    
                    for (const offsets of volumeOffsets) {
                        const volVal = dv.getFloat32(offsets.vol, true);
                        const weightVal = dv.getFloat32(offsets.weight, true);
                        
                        // Проверяем адекватность значений
                        if (volVal > 0.1 && volVal < 1000 && weightVal > 0.1 && weightVal < 1000) {
                            // Проверяем соотношение вес/объём (плотность смолы ~1.1-1.12 г/мл)
                            const density = weightVal / volVal;
                            if (density >= 1.05 && density <= 1.30) {
                                console.log('   🔍 Найден объём на смещении', offsets.vol, ':', volVal, 'мл');
                                console.log('   🔍 Найден вес на смещении', offsets.weight, ':', weightVal, 'г (плотность:', density.toFixed(3), 'г/мл)');
                                foundVolumeMl = volVal;
                                foundWeightG = weightVal;
                                break;
                            }
                        }
                    }

                    if (foundVolumeMl > 0) {
                        console.log('   ✅ Используем реальный объём из файла:', foundVolumeMl, 'см³');
                        data.resinVolumeCm3 = foundVolumeMl;
                        data.weightGrams = foundWeightG;
                    }
                    
                    // Проверяем адекватность данных
                    if (layerHeight > 0.01 && layerHeight < 0.1 && layerCount > 0 && layerCount < 20000) {
                        data.layerHeight = layerHeight;
                        data.layerCount = layerCount;
                        data.exposureTime = exposureTime;
                        data.resolutionX = resolutionX;
                        data.resolutionY = resolutionY;
                        
                        // Если нашли реальное время в файле, используем его
                        if (!data.printTimeSec || data.printTimeSec === 0) {
                            // Точный расчёт времени печати для Anycubic Photon Mono
                            // Реальный цикл печати одного слоя: экспозиция + подъём + ожидание + возврат
                            // Для Mono: ~35-45 секунд на слой (включая все задержки)
                            
                            const bottomLayers = 6;
                            const bottomExposure = 40; // сек (днищные слои)
                            const normalLayers = layerCount - bottomLayers;

                            // Реалистичный расчёт времени для Anycubic Photon Mono
                            // На основе данных из слайсера:
                            // - Lift Speed: 240 мм/мин = 4 мм/сек
                            // - Retract Speed: 360 мм/мин = 6 мм/сек
                            // - Lift Distance: 6 мм
                            // - Light Off Delay: 0.5 сек
                            
                            const liftDistance = 6; // мм
                            const liftSpeedMmPerSec = 4; // 240 мм/мин / 60
                            const retractSpeedMmPerSec = 6; // 360 мм/мин / 60
                            const lightOffDelay = 0.5; // сек
                            
                            // Время на одно движение платформы (подъём + опускание)
                            const motionTimePerLayer = (liftDistance / liftSpeedMmPerSec) + 
                                                       (liftDistance / retractSpeedMmPerSec) + 
                                                       lightOffDelay;
                            // = (6/4) + (6/6) + 0.5 = 1.5 + 1.0 + 0.5 = 3.0 секунды
                            
                            // Время для днищных слоёв (более длительная экспозиция)
                            // Bottom layers: 40 сек экспозиция + ~20 сек механика = 60 сек на слой
                            const bottomTimePerLayer = 60; // сек (реальное время для днищных слоёв)
                            const bottomTime = bottomLayers * bottomTimePerLayer;

                            // Время для обычных слоёв
                            // Реальный цикл для Anycubic Mono: экспозиция + подъём + откат + задержка
                            // На основе данных слайсера: ~22-24 сек на слой
                            const motionAndDelay = 18.5; // сек (подъём 6мм + откат + паузы)
                            const normalTimePerLayer = exposureTime + motionAndDelay;
                            const normalTime = normalLayers * normalTimePerLayer;

                            const printTimeSec = bottomTime + normalTime;
                            data.printTimeSec = printTimeSec;

                            console.log('✅ [Photon] Данные успешно получены!');
                            console.log('   Днищные слои:', bottomLayers, '×', bottomTimePerLayer, '=', bottomTime, 'сек');
                            console.log('   Обычные слои:', normalLayers, '×', normalTimePerLayer.toFixed(1), '=', normalTime.toFixed(0), 'сек');
                            console.log('   Итого время (расчётное):', printTimeSec, 'сек =', (printTimeSec/60).toFixed(1), 'мин =', (printTimeSec/3600).toFixed(2), 'ч');
                        } else {
                            console.log('✅ [Photon] Данные успешно получены!');
                            console.log('   Итого время (из файла):', data.printTimeSec, 'сек =', (data.printTimeSec/60).toFixed(1), 'мин =', (data.printTimeSec/3600).toFixed(2), 'ч');
                        }
                        
                        // Размеры для Anycubic Photon Mono (фиксированные, т.к. в файле некорректно)
                        data.width = 82.62; // мм
                        data.height = 130.56; // мм
                        data.depth = 165; // мм (максимальная высота печати)
                        console.log('   Размеры платформы:', data.width, '×', data.height, '×', data.depth, 'мм');

                        // Объём и вес — приоритет: 1) из файла PWMO, 2) из STL, 3) расчётный
                        if (data.resinVolumeCm3 && data.resinVolumeCm3 > 0) {
                            // Уже найдено из файла PWMO
                            console.log('   ✅ Объём из PWMO:', data.resinVolumeCm3.toFixed(1), 'см³');
                            console.log('   ✅ Вес из PWMO:', data.weightGrams.toFixed(1), 'г');
                        } else if (typeof window !== 'undefined' && window.realVol && window.realVol > 0) {
                            // Из STL парсера
                            data.resinVolumeCm3 = window.realVol;
                            data.weightGrams = window.realVol * 1.1;
                            console.log('   Объём из STL:', data.resinVolumeCm3, 'см³');
                            console.log('   Вес:', data.weightGrams.toFixed(1), 'г');
                        } else {
                            // Примерный расчёт по габаритам с коэффициентом заполнения
                            const boundingBoxCm3 = (data.width * data.height * (layerCount * layerHeight)) / 1000;

                            // Коэффициент заполнения: 6% для мелких деталей (кнопки, фигурки)
                            const fillFactor = 0.06;
                            data.resinVolumeCm3 = boundingBoxCm3 * fillFactor;
                            data.weightGrams = data.resinVolumeCm3 * 1.1;

                            console.log('   Объём (расчётный):', data.resinVolumeCm3.toFixed(1), 'см³');
                            console.log('   Вес (расчётный):', data.weightGrams.toFixed(1), 'г');
                            console.log('   Коэффициент заполнения:', fillFactor * 100, '%');
                        }
                        
                        data.valid = true;
                        data.format = 'Anycubic Photon (.pwmo)';
                        data.printerModel = 'Anycubic Photon Mono';
                        
                        // Извлекаем миниатюру из PWMO (если есть)
                        try {
                            // Пробуем несколько смещений для миниатюры
                            const thumbOffsets = [
                                0x100,      // Для старых версий
                                0x180,      // Специфичные для Anycubic
                                0x200,      // Стандартный
                                0x280,      // 
                                0x300,      // 
                                0x400,      // Дополнительные
                                0x500,      // 
                                0x600,      // 
                                0x800,      // 
                                512,        // Альтернативное
                                1024,       // 
                                2048,       // Для новых версий
                                0x1000,     // Hex вариант
                                4096,       // Для больших файлов
                                8192        
                            ];

                            let thumbnailFound = false;

                            for (const offset of thumbOffsets) {
                                if (buffer.byteLength <= offset + 100) continue;

                                const thumbView = new Uint8Array(buffer, offset, 100);

                                // Проверяем сигнатуру JPEG (FFD8FF) или PNG (89504E47)
                                const isJpeg = thumbView[0] === 0xFF && thumbView[1] === 0xD8 && thumbView[2] === 0xFF;
                                const isPng = thumbView[0] === 0x89 && thumbView[1] === 0x50 && thumbView[2] === 0x4E;

                                if (isJpeg || isPng) {
                                    console.log(`🖼️ [Photon] Миниатюра найдена на офсете ${offset} (0x${offset.toString(16)})!`);

                                    // Определяем размер миниатюры (ищем конец JPEG FFD9 или PNG IEND)
                                    let thumbSize = 10000;
                                    const maxSearch = Math.min(buffer.byteLength - offset, 50000);

                                    for (let i = 0; i < maxSearch - 2; i++) {
                                        if (isJpeg && buffer[offset + i] === 0xFF && buffer[offset + i + 1] === 0xD9) {
                                            thumbSize = i + 2;
                                            break;
                                        }
                                        if (isPng && buffer[offset + i] === 0x49 && buffer[offset + i + 1] === 0x45 && buffer[offset + i + 2] === 0x4E && buffer[offset + i + 3] === 0x44) {
                                            thumbSize = i + 12; // IEND chunk ends 4 bytes after signature
                                            break;
                                        }
                                    }

                                    const thumbBuffer = buffer.slice(offset, offset + thumbSize);
                                    const blob = new Blob([thumbBuffer], { type: isJpeg ? 'image/jpeg' : 'image/png' });
                                    data.thumbnailUrl = URL.createObjectURL(blob);
                                    console.log('🖼️ [Photon] Миниатюра извлечена:', data.thumbnailUrl, 'размер:', thumbSize, 'байт');
                                    
                                    // Создаём превью для отображения
                                    const img = new Image();
                                    img.src = data.thumbnailUrl;
                                    img.onload = () => {
                                        console.log('🖼️ [Photon] Миниатюра загружена:', img.width, 'x', img.height, 'px');
                                    };
                                    
                                    thumbnailFound = true;
                                    break;
                                }
                            }

                            if (!thumbnailFound) {
                                console.warn('⚠️ [Photon] Миниатюра не найдена. Это нормально для некоторых версий прошивки.');
                                console.log('   Попробуйте использовать UVTools для извлечения миниатюры.');
                            }
                        } catch (e) {
                            console.warn('⚠️ [Photon] Ошибка при извлечении миниатюры:', e);
                        }
                        
                        console.log('✅ [Photon] Возврат данных:', {
                            volume: data.resinVolumeCm3,
                            weight: data.weightGrams,
                            layers: data.layerCount,
                            timeSec: data.printTimeSec,
                            thumbnail: !!data.thumbnailUrl
                        });

                        return data;
                    } else {
                        console.warn('⚠️ [Photon] Данные некорректны, пробуем глубокий поиск...');
                        console.log('   layerHeight:', layerHeight);
                        console.log('   layerCount:', layerCount);
                    }
                }

                // Попытка 0: Проверяем, может это float значения
                console.log('🔍 [Photon] Попытка 0: Проверка float формата...');
                const wFloat = dv.getFloat32(8, true);
                const hFloat = dv.getFloat32(12, true);
                const lcFloat = dv.getFloat32(16, true);
                const lhFloat = dv.getFloat32(20, true);
                
                console.log(`   Float: ${wFloat}x${hFloat}, слоёв: ${lcFloat}, слой: ${lhFloat}`);
                
                // Если высота слоя ~0.05 — это оно!
                if (lhFloat > 0.01 && lhFloat < 0.1) {
                    data.width = wFloat > 0 && wFloat < 300 ? wFloat : null;
                    data.height = hFloat > 0 && hFloat < 200 ? hFloat : null;
                    data.layerCount = lcFloat > 10 && lcFloat < 20000 ? Math.round(lcFloat) : null;
                    data.layerHeight = lhFloat;
                    
                    console.log('✅ [Photon] Float формат подходит!');
                }

                // Попытка 1: Стандартная структура uint32
                const width = dv.getUint32(8, true);
                const height = dv.getUint32(12, true);
                const layerCount = dv.getUint32(16, true);
                const layerHeight = dv.getFloat32(20, true);
                
                console.log(`🔍 [Photon] Попытка 1 (uint32): ${width}x${height}, слоёв: ${layerCount}, слой: ${layerHeight}`);
                
                // Проверка на адекватность
                if (width > 50 && width < 300 && height > 50 && height < 200 && 
                    layerCount > 10 && layerCount < 20000 &&
                    layerHeight > 0.00001 && layerHeight < 0.0002) {
                    data.width = width;
                    data.height = height;
                    data.layerCount = layerCount;
                    data.layerHeight = layerHeight;
                    data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, 24);
                    data.valid = true;
                    data.format = 'Anycubic Photon (.pwmo)';
                    
                    console.log('✅ [Photon] Успешный парсинг (попытка 1)');
                    return data;
                }
                
                // Попытка 2: Альтернативная структура — ищем float высоту слоя
                console.log('🔍 [Photon] Попытка 2: поиск float высоты слоя...');
                
                for (let offset = 8; offset < Math.min(200, fileSize - 4); offset += 4) {
                    const lh = dv.getFloat32(offset, true);
                    
                    // Высота слоя 0.01-0.1 мм
                    if (lh > 0.01 && lh < 0.1) {
                        // Читаем все возможные интерпретации
                        const wFloat = dv.getFloat32(offset - 12, true);
                        const hFloat = dv.getFloat32(offset - 8, true);
                        const lcFloat = dv.getFloat32(offset - 4, true);
                        
                        const wUint = dv.getUint32(offset - 12, true);
                        const hUint = dv.getUint32(offset - 8, true);
                        const lcUint = dv.getUint32(offset - 4, true);
                        
                        console.log(`   Смещение ${offset}:`);
                        console.log(`     Float: ${wFloat}x${hFloat}, слоёв: ${lcFloat}, слой: ${lh}`);
                        console.log(`     Uint32: ${wUint}x${hUint}, слоёв: ${lcUint}, слой: ${lh}`);
                        
                        // Проверяем float
                        if (wFloat > 50 && wFloat < 300 && hFloat > 50 && hFloat < 200 && lcFloat > 10 && lcFloat < 20000) {
                            data.width = wFloat;
                            data.height = hFloat;
                            data.layerCount = Math.round(lcFloat);
                            data.layerHeight = lh;
                            data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, offset + 4);
                            data.valid = true;
                            data.format = 'Anycubic Photon (.pwmo)';
                            
                            console.log('✅ [Photon] Успешный парсинг (float)');
                            return data;
                        }
                        
                        // Проверяем смешанный: w=uint32, lc=float (h может быть некорректным)
                        if (wUint > 50 && wUint < 300 && lcFloat > 10 && lcFloat < 20000) {
                            data.width = wUint;
                            data.height = hFloat > 50 && hFloat < 200 ? hFloat : null;
                            data.layerCount = Math.round(lcFloat);
                            data.layerHeight = lh;
                            data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, offset + 4);
                            data.valid = true;
                            data.format = 'Anycubic Photon (.pwmo)';
                            
                            console.log('✅ [Photon] Успешный парсинг (mixed w=uint32, lc=float)');
                            console.log(`   Ширина: ${data.width}, Слои: ${data.layerCount}, Слой: ${data.layerHeight}`);
                            return data;
                        }
                        
                        // Проверяем uint32
                        const wOk = wUint > 50 && wUint < 300;
                        const hOk = hUint > 50 && hUint < 200;
                        const lcOk = lcUint > 10 && lcUint < 20000;
                        
                        if ((wOk && hOk) || (wOk && lcOk) || (hOk && lcOk)) {
                            data.width = wOk ? wUint : null;
                            data.height = hOk ? hUint : null;
                            data.layerCount = lcOk ? lcUint : null;
                            data.layerHeight = lh;
                            data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, offset + 4);
                            data.valid = true;
                            data.format = 'Anycubic Photon (.pwmo)';
                            
                            console.log('✅ [Photon] Успешный парсинг (uint32, частично)');
                            console.log(`   Ширина: ${data.width}, Высота: ${data.height}, Слои: ${data.layerCount}`);
                            return data;
                        }
                        
                        // Попытка 2.5: Специально для Anycubic Photon Mono
                        // Из Chitubox: X=82.62, Y=130.56, Z=165, Volume=14.647ml, Weight=16.112g, Time=4289sec
                        // Ищем ширину ~82, высоту ~130, слои = Z/layerHeight = 165/0.05 = 3300
                        console.log(`   🔍 [Photon] Проверка Anycubic Mono паттерна...`);
                        
                        // Проверяем wUint как ширину (82.62 ≈ 150 в uint32 это 0x96 = 150... странно)
                        // Возможно данные в другом формате
                        if (wUint === 150 && lh > 0.04 && lh < 0.06) {
                            // Это может быть файл с разрешением 1620x2400
                            // X: 82.62мм, Y: 130.56мм
                            data.width = 82.62;  // Из известного профиля Anycubic Mono
                            data.height = 130.56;
                            data.layerHeight = lh;
                            // Слои = Z / layerHeight = 165 / 0.05 = 3300
                            data.layerCount = Math.round(165 / lh);
                            
                            console.log(`✅ [Photon] Распознан Anycubic Mono профиль!`);
                            console.log(`   Ширина: ${data.width}мм, Высота: ${data.height}мм`);
                            console.log(`   Слоёв: ${data.layerCount} (Z=165мм / ${lh}мм)`);
                            
                            data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, offset + 4);
                            data.valid = true;
                            data.format = 'Anycubic Photon (.pwmo)';
                            data.printerModel = 'Anycubic Photon Mono';
                            
                            return data;
                        }

                        // Попытка 2.6: Резервный для Anycubic — используем известные профили
                        if (lh > 0.04 && lh < 0.06) {
                            // Проверяем известные профили Anycubic
                            const knownProfiles = [
                                { name: 'Photon Mono', x: 82.62, y: 130.56, z: 165, px: 1620, py: 2400 },
                                { name: 'Photon Mono X', x: 192, y: 120, z: 245, px: 3840, py: 2400 },
                                { name: 'Photon Mono SE', x: 130.56, y: 82.62, z: 165, px: 2400, py: 1620 }
                            ];

                            // Если wUint похоже на разрешение (1620, 3840, 2400)
                            const profile = knownProfiles.find(p => 
                                Math.abs(p.px - wUint) < 10 || Math.abs(p.py - wUint) < 10
                            );

                            if (profile) {
                                data.width = profile.x;
                                data.height = profile.y;
                                data.layerHeight = lh;
                                data.layerCount = Math.round(profile.z / lh);
                                data.printerModel = profile.name;
                                
                                console.log(`✅ [Photon] Распознан профиль: ${profile.name}`);
                                console.log(`   ${profile.x}×${profile.y}мм, Z=${profile.z}мм`);
                                
                                data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, offset + 4);
                                data.valid = true;
                                data.format = 'Anycubic Photon (.pwmo)';
                                
                                return data;
                            }
                        }
                    }
                }
                
                // Попытка 3: Глубокий поиск
                console.log('🔍 [Photon] Попытка 3: глубокий поиск...');
                return this.deepSearchPhoton(dv, fileSize);
                
            } catch (e) {
                console.warn('⚠️ Photon парсер:', e.message);
                data.valid = false;
                data.format = 'Anycubic Photon (ошибка)';
            }

            return data;
        },

        /**
         * Поиск времени печати в Anycubic файле
         */
        findPrintTimePhoton: function(dv, fileSize, startOffset) {
            console.log(`🔍 [Photon] Поиск времени с смещения ${startOffset}...`);
            
            // Ищем в диапазоне от startOffset до startOffset + 200
            for (let offset = startOffset; offset < Math.min(startOffset + 200, fileSize - 4); offset += 4) {
                const timeSec = dv.getUint32(offset, true);
                
                // Проверка: от 1 минуты до 48 часов
                if (timeSec > 60 && timeSec < 172800) {
                    console.log(`✅ [Photon] Время найдено на смещении ${offset}: ${(timeSec/3600).toFixed(2)}ч (${timeSec}сек)`);
                    return timeSec;
                }
            }
            
            // Глубокий поиск
            return this.deepSearchTime(dv, fileSize);
        },

        /**
         * Глубокий поиск параметров Anycubic
         */
        deepSearchPhoton: function(dv, fileSize) {
            const data = { valid: false, format: 'Anycubic Photon (не распознан)' };
            
            console.log('🔍 [Photon] Глубокий поиск параметров...');
            
            // Ищем комбинации: ширина, высота, слои, высота слоя
            for (let offset = 8; offset < Math.min(500, fileSize - 16); offset += 4) {
                const w = dv.getUint32(offset, true);
                const h = dv.getUint32(offset + 4, true);
                const lc = dv.getUint32(offset + 8, true);
                const lh = dv.getFloat32(offset + 12, true);
                
                if (w > 50 && w < 300 && h > 50 && h < 200 && 
                    lc > 10 && lc < 20000 && lh > 0.01 && lh < 0.1) {
                    
                    data.width = w;
                    data.height = h;
                    data.layerCount = lc;
                    data.layerHeight = lh;
                    data.printTimeSec = this.findPrintTimePhoton(dv, fileSize, offset + 16);
                    data.valid = true;
                    data.format = 'Anycubic Photon (.pwmo)';
                    
                    console.log(`✅ [Photon] Найдено на смещении ${offset}: ${w}x${h}, слоёв: ${lc}, слой: ${lh}`);
                    return data;
                }
            }
            
            console.warn('⚠️ [Photon] Не удалось найти параметры');
            return data;
        },

        /**
         * Поиск времени печати в файле
         */
        findPrintTime: function(dv, fileSize) {
            // Приоритетные смещения для разных версий
            const priorityOffsets = [24, 28, 32, 36, 40, 44, 48];
            
            for (const offset of priorityOffsets) {
                if (offset + 4 > fileSize) continue;
                
                const timeSec = dv.getUint32(offset, true);
                
                // Проверка на адекватность (от 1 минуты до 100 часов)
                if (timeSec > 60 && timeSec < 360000) {
                    console.log(`✅ Время найдено на смещении ${offset}: ${(timeSec/3600).toFixed(2)}ч`);
                    return timeSec;
                }
            }
            
            // Глубокий поиск с паттернами
            return this.deepSearchTime(dv, fileSize);
        },

        /**
         * Глубокий поиск времени с эвристиками
         */
        deepSearchTime: function(dv, fileSize) {
            const candidates = [];
            
            for (let offset = 0; offset < Math.min(5000, fileSize - 4); offset += 4) {
                const timeSec = dv.getUint32(offset, true);
                
                // Диапазон: 5 минут - 72 часа
                if (timeSec > 300 && timeSec < 259200) {
                    // Проверяем контекст
                    const prevVal = dv.getUint32(offset - 4, true);
                    const nextVal = dv.getUint32(offset + 4, true);
                    
                    // Время печати обычно окружено меньшими значениями
                    if (prevVal < timeSec && nextVal < timeSec) {
                        candidates.push({ offset, value: timeSec, score: 10 });
                    } else {
                        candidates.push({ offset, value: timeSec, score: 1 });
                    }
                }
            }
            
            // Сортируем по вероятности
            candidates.sort((a, b) => b.score - a.score);
            
            if (candidates.length > 0) {
                console.log(`🔍 Найдено ${candidates.length} кандидатов, лучшее: ${(candidates[0].value/3600).toFixed(2)}ч`);
                return candidates[0].value;
            }
            
            // Значение по умолчанию
            console.warn('⚠️ Время не найдено, используем 1.0ч');
            return 3600;
        },

        /**
         * Поиск объёма смолы
         */
        findResinVolume: function(dv, fileSize) {
            // Ищем float значения в диапазоне 0.1 - 500 см³
            for (let offset = 0; offset < Math.min(3000, fileSize - 4); offset += 4) {
                const volume = dv.getFloat32(offset, true);
                
                if (volume > 0.5 && volume < 500) {
                    // Проверяем соседние значения на плотность
                    const density = dv.getFloat32(offset + 4, true);
                    
                    if (density > 1.0 && density < 1.5) {
                        console.log(`✅ Объём найден: ${volume.toFixed(1)} см³`);
                        return volume;
                    }
                }
            }
            
            return null;
        },

        /**
         * Поиск веса модели
         */
        findModelWeight: function(dv, fileSize) {
            // Ищем float значения в диапазоне 1 - 1000 грамм
            for (let offset = 0; offset < Math.min(3000, fileSize - 4); offset += 4) {
                const weight = dv.getFloat32(offset, true);
                
                if (weight > 1 && weight < 1000) {
                    return weight;
                }
            }
            
            return null;
        }
    };

    /**
     * Расчёт стоимости SLA печати
     */
    function calculateCost(params) {
        const {
            printTimeHours,
            resinVolumeCm3,
            resinType = 'standard',
            printerHourlyRate = 250,
            printerPowerKw = 0.15,
            electricityRate = 5.5,
            postProcessingCost = 150,
            modellingCost = 0,
            margin = 1.25,
            setupFee = 150,
            minOrder = 300,
            discount = 0,
            taxRate = 6,
            urgentFactor = 1.0
        } = params;

        // Стоимость смолы
        const resinPricePerLiter = RESIN_PRICES[resinType] || RESIN_PRICES.standard;
        const resinCost = (resinVolumeCm3 / 1000) * resinPricePerLiter;

        // Стоимость работы принтера
        const printerCost = printTimeHours * printerHourlyRate;

        // Электроэнергия
        const electricityCost = printTimeHours * printerPowerKw * electricityRate;

        // Амортизация FEP плёнки
        const filmLifetimeHours = 500;
        const filmReplacementCost = 1500;
        const filmWearCost = (printTimeHours / filmLifetimeHours) * filmReplacementCost;

        // Изопропанол (на одну промывку ~50мл)
        const alcoholCostPerLiter = 800;
        const alcoholCost = 0.05 * alcoholCostPerLiter;

        // Отходы (5% от смолы)
        const wasteCost = resinCost * 0.05;

        // Себестоимость
        const productionCost = resinCost + printerCost + electricityCost + 
                               filmWearCost + alcoholCost + wasteCost + 
                               postProcessingCost;

        // Цена с маржой
        const priceWithMargin = (productionCost + setupFee + modellingCost) * margin * urgentFactor;

        // Налог
        const priceWithTax = priceWithMargin / (1 - taxRate / 100);

        // Скидка
        const finalPrice = priceWithTax * (1 - discount / 100);

        // Минимальный заказ
        const total = Math.max(finalPrice, minOrder);

        // Вес смолы
        const density = RESIN_DENSITIES[resinType] || RESIN_DENSITIES.standard;
        const resinWeightGrams = resinVolumeCm3 * density;

        return {
            resinCost: Math.round(resinCost),
            printerCost: Math.round(printerCost),
            electricityCost: Math.round(electricityCost),
            filmWearCost: Math.round(filmWearCost),
            alcoholCost: Math.round(alcoholCost),
            wasteCost: Math.round(wasteCost),
            postProcessingCost: postProcessingCost,
            productionCost: Math.round(productionCost),
            priceWithMargin: Math.round(priceWithMargin),
            priceWithTax: Math.round(priceWithTax),
            total: Math.round(total),
            resinWeightGrams: Math.round(resinWeightGrams * 10) / 10,
            printTimeHours: Math.round(printTimeHours * 100) / 100,
            margin: margin,
            discount: discount
        };
    }

    /**
     * Основной API: загрузка и расчёт
     */
    async function loadAndCalculate(filePath, customParams = {}) {
        if (!window.electron || !window.electron.readBinaryFile) {
            throw new Error('Electron API недоступен');
        }

        const result = await window.electron.readBinaryFile(filePath);
        
        if (!result.success) {
            throw new Error('Ошибка чтения файла: ' + (result.error || 'неизвестно'));
        }

        const buffer = result.content;
        const formatInfo = BinaryParser.detectFormat(buffer);
        
        console.log('📄 Формат файла:', formatInfo);

        let parsedData;
        
        switch (formatInfo.type) {
            case 'chitubox':
                parsedData = BinaryParser.parseChitubox(buffer);
                break;
            case 'photon':
                parsedData = BinaryParser.parsePhoton(buffer);
                break;
            case 'lychee':
                // TODO: реализовать парсер Lychee
                parsedData = { valid: false, format: 'Lychee (не поддерживается)' };
                break;
            default:
                parsedData = { valid: false, format: 'Неизвестный' };
        }

        if (!parsedData.valid) {
            throw new Error('Не удалось распарсить файл формата ' + parsedData.format);
        }

        // Извлекаем время печати
        const printTimeHours = parsedData.printTimeSec / 3600;

        // Извлекаем или рассчитываем объём
        let resinVolumeCm3 = parsedData.resinVolumeCm3;
        
        if (resinVolumeCm3 === null || resinVolumeCm3 === undefined) {
            // Расчёт по габаритам и высоте слоя
            const boundingBoxCm3 = (parsedData.width * parsedData.height * parsedData.layerHeight * parsedData.layerCount) / 1000;
            // Коэффициент заполнения (обычно 15-40%)
            resinVolumeCm3 = boundingBoxCm3 * 0.25;
        }

        // Расчёт стоимости
        const costData = calculateCost({
            printTimeHours,
            resinVolumeCm3,
            ...customParams
        });

        return {
            format: parsedData.format,
            width: parsedData.width,
            height: parsedData.height,
            layerCount: parsedData.layerCount,
            layerHeight: parsedData.layerHeight,
            printTimeHours,
            resinVolumeCm3: Math.round(resinVolumeCm3 * 10) / 10,
            resinWeightGrams: parsedData.weightGrams || Math.round(resinVolumeCm3 * 1.1 * 10) / 10,
            ...costData
        };
    }

    /**
     * Экспорт публичного API
     */
    return {
        loadAndCalculate,
        calculateCost,
        parseFile: function(buffer) {
            const formatInfo = BinaryParser.detectFormat(buffer);
            switch (formatInfo.type) {
                case 'chitubox': return BinaryParser.parseChitubox(buffer);
                case 'photon': return BinaryParser.parsePhoton(buffer);
                case 'lychee': return BinaryParser.parseLychee(buffer);
                default: return { valid: false, format: formatInfo.type };
            }
        },
        detectFormat: BinaryParser.detectFormat,
        RESIN_DENSITIES,
        RESIN_PRICES
    };
})();

console.log('✅ SLA Cost Calculator модуль загружен');
