/**
 * UVTools CLI Integration for Electron
 * 
 * Установка:
 * 1. dotnet tool install -g uvtools
 * 2. В package.json добавить: "uvtools": "^3.0.0"
 * 
 * Использование:
 * const result = await parseSLAFile('file.pwmo');
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Парсинг SLA файла через UVTools CLI
 * @param {string} filePath - Путь к файлу (.pwmo, .ctb, .photon, etc.)
 * @returns {Promise<Object>} - Данные о файле
 */
function parseSLAFile(filePath) {
    return new Promise((resolve, reject) => {
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
            reject(new Error(`Файл не найден: ${filePath}`));
            return;
        }

        // Вызываем UVTools CLI
        const command = `uvtools info "${filePath}" --json`;
        
        exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
            if (error) {
                // Если UVTools не установлен, используем fallback парсер
                console.warn('⚠️ UVTools не найден, используем встроенный парсер...');
                resolve(fallbackParse(filePath));
                return;
            }

            try {
                const data = JSON.parse(stdout);
                
                // Форматируем данные для нашего интерфейса
                const result = {
                    valid: true,
                    format: data.format || 'Unknown',
                    printerModel: data.printer?.name || 'Unknown',
                    layerCount: data.layers || 0,
                    layerHeight: data.layerHeight || 0.05,
                    resolutionX: data.resolution?.x || 1620,
                    resolutionY: data.resolution?.y || 2560,
                    printTimeSec: data.printTime || 0,
                    resinVolumeCm3: data.volume || 0,
                    resinWeightGrams: data.weight || 0,
                    thumbnailUrl: data.thumbnail ? `data:image/jpeg;base64,${data.thumbnail}` : null
                };

                resolve(result);
            } catch (e) {
                reject(new Error(`Ошибка парсинга JSON: ${e.message}`));
            }
        });
    });
}

/**
 * Fallback парсер (если UVTools не установлен)
 */
function fallbackParse(filePath) {
    // Здесь можно использовать встроенный парсер из sla-cost-calculator.js
    const buffer = fs.readFileSync(filePath);
    // Вызываем window.SLACostCalculator.parseFile(buffer)
    // Но это нужно делать в renderer process
    return { valid: false, error: 'UVTools required' };
}

/**
 * Извлечение миниатюры из SLA файла
 */
function extractThumbnail(filePath, outputPath) {
    return new Promise((resolve, reject) => {
        const command = `uvtools extract "${filePath}" --thumbnail "${outputPath}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(outputPath);
        });
    });
}

module.exports = {
    parseSLAFile,
    extractThumbnail
};
