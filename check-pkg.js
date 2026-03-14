const fs = require('fs');
try {
    JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    console.log('✅ package.json валиден');
} catch (e) {
    console.error('❌ package.json невалиден:', e.message);
}
