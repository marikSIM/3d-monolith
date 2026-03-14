/**
 * ТЕСТОВЫЙ СКОРИПТ для исследования PWMO файла
 * Запустите в консоли после загрузки PWMO
 */

window.debugPWMO = async function(filePath) {
    console.log('🔍 Исследование PWMO файла:', filePath);
    
    if (!window.electron || !window.electron.readBinaryFile) {
        console.error('❌ Electron API недоступен');
        return;
    }
    
    const result = await window.electron.readBinaryFile(filePath);
    if (!result.success) {
        console.error('❌ Ошибка чтения:', result.error);
        return;
    }
    
    const buffer = result.content;
    const dv = new DataView(buffer);
    const fileSize = buffer.byteLength;
    
    console.log('📊 Размер файла:', fileSize, 'байт');
    console.log('📊 Размер:', (fileSize / 1024 / 1024).toFixed(2), 'МБ');
    
    // Сигнатура
    const sig8 = String.fromCharCode(...new Uint8Array(buffer, 0, 8));
    console.log('📝 Сигнатура:', JSON.stringify(sig8));
    
    // Исследуем первые 200 байт
    console.log('\n📋 Первые 200 байт (смещение | uint32 | float32):');
    console.log('─────────────────────────────────────────────────────');
    
    for (let offset = 0; offset < 200; offset += 4) {
        const uint32 = dv.getUint32(offset, true);
        const float32 = dv.getFloat32(offset, true);
        const hex = '0x' + uint32.toString(16).toUpperCase().padStart(8, '0');
        
        let annotation = '';
        
        // Проверяем на высоту слоя
        if (float32 > 0.01 && float32 < 0.1) {
            annotation = '← ВОЗМОЖНО высота слоя!';
        }
        
        // Проверяем на ширину/высоту
        if (uint32 > 50 && uint32 < 300 && offset > 4) {
            annotation = '← ВОЗМОЖНО ширина/высота';
        }
        
        // Проверяем на количество слоёв
        if (uint32 > 10 && uint32 < 20000 && offset > 8) {
            annotation = '← ВОЗМОЖНО количество слоёв';
        }
        
        // Проверяем на время
        if (uint32 > 60 && uint32 < 172800) {
            annotation = '← ВОЗМОЖНО время (сек)';
        }
        
        console.log(
            `${offset.toString().padStart(3)} | ${hex.padEnd(12)} | ${float32.toFixed(6).padStart(12)} ${annotation}`
        );
    }
    
    // Поиск высоты слоя по всему файлу
    console.log('\n🔍 Поиск высоты слоя (0.01-0.1 мм):');
    const layerHeights = [];
    
    for (let offset = 0; offset < Math.min(1000, fileSize - 4); offset += 4) {
        const lh = dv.getFloat32(offset, true);
        
        if (lh > 0.01 && lh < 0.1) {
            layerHeights.push({ offset, value: lh });
            
            // Показываем первые 10 находок
            if (layerHeights.length <= 10) {
                const w = dv.getFloat32(offset - 12, true);
                const h = dv.getFloat32(offset - 8, true);
                const lc = dv.getFloat32(offset - 4, true);
                
                console.log(
                    `   Смещение ${offset}: слой=${lh.toFixed(4)}, ${w}x${h}, слоёв=${lc}`
                );
            }
        }
    }
    
    console.log(`\n✅ Найдено ${layerHeights.length} потенциальных высот слоя`);
    
    // Поиск времени печати
    console.log('\n🔍 Поиск времени печати (60-172800 сек):');
    const times = [];
    
    for (let offset = 0; offset < Math.min(2000, fileSize - 4); offset += 4) {
        const t = dv.getUint32(offset, true);
        
        if (t > 60 && t < 172800) {
            times.push({ offset, value: t });
        }
    }
    
    // Показываем топ-10 кандидатов
    times.sort((a, b) => b.value - a.value);
    console.log('   Топ-10 кандидатов:');
    times.slice(0, 10).forEach(({ offset, value }) => {
        console.log(`   Смещение ${offset}: ${value} сек = ${(value/3600).toFixed(2)} ч`);
    });
    
    // Сохраняем для удобства
    window.PWMO_DEBUG = {
        buffer,
        dv,
        fileSize,
        layerHeights,
        times
    };
    
    console.log('\n💡 Данные сохранены в window.PWMO_DEBUG');
    console.log('💡 Пример: window.PWMO_DEBUG.layerHeights[0]');
};

// Автозапуск если PWMO уже загружен
if (window.currentPWMO && window.currentPWMO.path) {
    console.log('🚀 Автозапуск debugPWMO для текущего файла...');
    window.debugPWMO(window.currentPWMO.path);
}

console.log('✅ Скрипт загружен. Запустите: window.debugPWMO("путь/к/файлу.pwmo")');
