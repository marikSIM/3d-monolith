const { contextBridge, ipcRenderer } = require('electron');

// Создаём безопасный мост между Electron и веб-страницей
contextBridge.exposeInMainWorld('electron', {
    // Тест IPC связи
    testIPC: (data) => ipcRenderer.invoke('test-ipc', data),
    
    // Слайсинг
    sliceModel: (data) => ipcRenderer.invoke('slice-model', data),

    // Диалоги
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

    // Файловые операции
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    readBinaryFile: (filePath) => ipcRenderer.invoke('read-binary-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    getFilePath: (fileName) => ipcRenderer.invoke('get-file-path', fileName),
    copyFile: (srcPath, destPath) => ipcRenderer.invoke('copy-file', srcPath, destPath),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

    // Выполнение команд (для UVTools и других утилит)
    execCommand: (command, options) => ipcRenderer.invoke('exec-command', command, options),

    // Оптимизация
    optimizeStl: (stlPath) => ipcRenderer.invoke('optimize-stl', stlPath),

    // AI Engineer - расширенные методы
    loadAIModel: (modelPath) => ipcRenderer.invoke('load-ai-model', modelPath),
    getSavedAIModel: () => ipcRenderer.invoke('get-saved-ai-model'),
    generateAIResponse: (prompt, options) => ipcRenderer.invoke('generate-ai-response', prompt, options),

    // AI режимы и настройки
    getAIMode: () => ipcRenderer.invoke('get-ai-mode'),
    setAIMode: (mode) => ipcRenderer.invoke('set-ai-mode', mode),
    loadKnowledgeBase: () => ipcRenderer.invoke('load-knowledge-base'),
    saveAISettings: (settings) => ipcRenderer.invoke('save-ai-settings', settings),
    getAISettings: () => ipcRenderer.invoke('get-ai-settings'),

    // Поиск GGUF моделей
    findGGUFModels: () => ipcRenderer.invoke('find-gguf-models'),

    // WebGPU проверка
    checkWebGPU: () => ipcRenderer.invoke('check-webgpu'),

    // Версия Electron
    platform: process.platform,
    versions: process.versions
});

// Версия для проверки
contextBridge.exposeInMainWorld('isElectron', true);
