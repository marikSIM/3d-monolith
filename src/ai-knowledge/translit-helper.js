/**
 * 3D MONOLITH AI - УНИВЕРСАЛЬНАЯ ТРАНСЛИТЕРАЦИЯ
 * Файл: translit-helper.js
 * Описание: Помощник для преобразования русских ↔ английских букв
 * 
 * Использование:
 * const q = normalizeQuery("что такое СЛА печать");
 * // q = "что такое sla печать"
 */

window.AI_TRANSLIT = {
    // Карта транслитерации (русские → английские)
    map: {
        'сла': 'sla',
        'слэ': 'sla',
        'фдм': 'fdm',
        'пла': 'pla',
        'петг': 'petg',
        'абс': 'abs',
        'тпу': 'tpu',
        'тпе': 'tpe',
        'нейлон': 'nylon',
        'поликарбонат': 'polycarbonate',
        'полипропилен': 'polypropylene',
        'пва': 'pva',
        'пик': 'peek',
        'пей': 'pei',
        'полиэфирэфиркетон': 'peek',
        'полиэфиримид': 'pei',
        'полилактид': 'pla',
        'полиэтилентерефталат': 'petg',
        'акрилонитрилбутадиенстирол': 'abs',
        'акрилонитрилстиролакрилат': 'asa',
        'термопластичный полиуретан': 'tpu',
        'термопластичный эластомер': 'tpe',
        'стереолитограф': 'stereolithography',
        'стереолитография': 'stereolithography',
        'фотополимер': 'photopolymer',
        'фотополимерная': 'photopolymer',
        'слэ': 'sla',
        'длп': 'dlp',
        'lcd': 'lcd',
        'мслад': 'msla',
        'ультимейкер': 'ultimaker',
        'прусa': 'prusa',
        'анет': 'anet',
        'крил': 'creality',
        'эндер': 'ender',
        'сопло': 'nozzle',
        'экструдер': 'extruder',
        'хотэнд': 'hotend',
        'ретракт': 'retract',
        'ринтракт': 'retract',
        'инфил': 'infill',
        'заполнение': 'infill',
        'периметр': 'perimeter',
        'слой': 'layer',
        'адгез': 'adhesion',
        'варпинг': 'warping',
        'стрингинг': 'stringing',
        'бридж': 'bridging',
        'мост': 'bridge',
        'поддержк': 'support',
        'саппорт': 'support',
        'вайп': 'wipe',
        'зуп': 'z-hop',
        'з-хоп': 'z-hop',
        'феп': 'fep',
        'пленк': 'film',
        'ванночк': 'vat',
        'платформ': 'platform',
        'билд': 'build',
        'плейт': 'plate',
        'изопропанол': 'ipa',
        'изопропиловый спирт': 'ipa',
        'спирт': 'alcohol',
        'промыв': 'wash',
        'засветк': 'exposure',
        'куринг': 'curing',
        'постобработк': 'postprocessing',
        'пост-обработк': 'postprocessing',
        'пост процесс': 'postprocessing'
    },
    
    // Нормализация запроса
    normalize: function(query) {
        let result = query.toLowerCase();
        
        for (const [rus, eng] of Object.entries(this.map)) {
            result = result.replace(new RegExp(rus, 'gi'), eng);
        }
        
        return result;
    },
    
    // Проверка содержит ли запрос ключевое слово (с учётом транслита)
    includes: function(query, keyword) {
        const normalized = this.normalize(query);
        return query.toLowerCase().includes(keyword.toLowerCase()) || 
               normalized.includes(keyword.toLowerCase());
    },
    
    // Проверка точного совпадения (с учётом транслита)
    equals: function(query, keyword) {
        const normalized = this.normalize(query.trim());
        return query.toLowerCase().trim() === keyword.toLowerCase() || 
               normalized === keyword.toLowerCase();
    }
};

console.log('✅ AI Translit Helper загружен');
console.log('📚 Поддерживаемые замены:');
console.log('   - СЛА/СЛЭ → SLA');
console.log('   - ФДМ → FDM');
console.log('   - ПЛА → PLA');
console.log('   - ПЕТГ → PETG');
console.log('   - АБС → ABS');
console.log('   - ТПУ → TPU');
console.log('   - и ещё 50+ терминов');
