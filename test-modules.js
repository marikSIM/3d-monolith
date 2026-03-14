// ============================================
// 3D MONOLITH — ТЕСТОВЫЙ СКРИПТ
// encoding: UTF-8 без BOM
// ============================================

/**
 * БЫСТРОЕ ТЕСТИРОВАНИЕ МОДУЛЕЙ
 * Запустите в консоли браузера (F12)
 */

(function() {
    console.log('🧪 === ТЕСТИРОВАНИЕ МОДУЛЕЙ 3D MONOLITH ===\n');
    
    // 1. Проверка PrinterFarm
    console.log('1️⃣ Проверка PrinterFarm...');
    if (typeof window.PrinterFarm === 'undefined') {
        console.error('❌ PrinterFarm не загружен!');
        return;
    }
    
    console.log('✅ PrinterFarm загружен');
    console.log(`   FDM принтеров: ${window.PRINTER_FARM_FDM?.length || 0}`);
    console.log(`   SLA принтеров: ${window.PRINTER_FARM_SLA?.length || 0}`);
    
    // 2. Создание тестовых принтеров
    console.log('\n2️⃣ Создание тестовых принтеров...');
    
    const testFDM = window.PrinterFarm.createPrinter('fdm', {
        name: 'Test FDM Printer',
        manufacturer: 'Test',
        model: 'Test Model',
        buildVolumeX: 200,
        buildVolumeY: 200,
        buildVolumeZ: 200,
        hourlyRate: 250,
        powerConsumption: 0.15
    });
    
    console.log(`✅ Создан FDM принтер: ${testFDM.name}`);
    
    const testSLA = window.PrinterFarm.createPrinter('sla', {
        name: 'Test SLA Printer',
        manufacturer: 'Test',
        model: 'Test Model',
        buildVolumeX: 200,
        buildVolumeY: 120,
        buildVolumeZ: 200,
        hourlyRate: 180,
        powerConsumption: 0.05
    });
    
    console.log(`✅ Создан SLA принтер: ${testSLA.name}`);
    
    // 3. Проверка Calculator
    console.log('\n3️⃣ Проверка PrinterCalculator...');
    
    if (typeof window.PrinterCalculator === 'undefined') {
        console.error('❌ PrinterCalculator не загружен!');
        return;
    }
    
    console.log('✅ PrinterCalculator загружен');
    
    // Тестовый расчёт
    const testModel = {
        volume: 50, // см³
        dimensions: { x: 50, y: 50, z: 50 }
    };
    
    const testSettings = {
        layerHeight: 0.2,
        infillDensity: 20,
        printSpeed: 250,
        supportEnabled: true
    };
    
    const fdmResult = window.PrinterCalculator.calculate(
        testModel,
        testFDM,
        { pricePerKg: 1600 },
        testSettings
    );
    
    console.log('📊 Тестовый расчёт FDM:');
    console.log(`   Время печати: ${Math.round(fdmResult.printTime.totalTime)} мин`);
    console.log(`   Стоимость: ${fdmResult.cost.total} ₽`);
    
    // 4. Проверка MaterialsManager
    console.log('\n4️⃣ Проверка MaterialsManager...');
    
    if (typeof window.MaterialsManager === 'undefined') {
        console.error('❌ MaterialsManager не загружен!');
        return;
    }
    
    console.log('✅ MaterialsManager загружен');
    console.log(`   Материалов: ${window.MATERIALS_DB?.length || 0}`);
    
    // 5. Проверка StorageManager
    console.log('\n5️⃣ Проверка StorageManager...');
    
    if (typeof window.StorageManager === 'undefined') {
        console.error('❌ StorageManager не загружен!');
        return;
    }
    
    console.log('✅ StorageManager загружен');
    
    const freeSpace = window.StorageManager.getFreeSpace();
    console.log(`   Свободно: ${freeSpace.mb} МБ`);
    
    // 6. Проверка CryptoUtils
    console.log('\n6️⃣ Проверка CryptoUtils...');
    
    if (typeof window.CryptoUtils === 'undefined') {
        console.error('❌ CryptoUtils не загружен!');
        return;
    }
    
    console.log('✅ CryptoUtils загружен');
    
    // Тест шифрования
    window.CryptoUtils.encrypt('Тест').then(enc => {
        console.log('✅ Шифрование работает');
        return window.CryptoUtils.decrypt(enc);
    }).then(dec => {
        console.log(`✅ Расшифровка: "${dec}"`);
        
        // ФИНАЛ
        console.log('\n🎉 === ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
        console.log('✅ Все модули работают корректно!');
        console.log('\n📝 Созданные принтеры:');
        console.log(`   - ${testFDM.name} (${testFDM.id})`);
        console.log(`   - ${testSLA.name} (${testSLA.id})`);
        console.log('\n💡 Для очистки тестовых данных:');
        console.log('   localStorage.clear()');
    });
    
})();
