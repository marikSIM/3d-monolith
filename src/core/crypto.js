// ============================================
// 3D MONOLITH — ШИФРОВАНИЕ ДАННЫХ
// encoding: UTF-8 без BOM
// ============================================

window.CryptoUtils = {
    // Ключ шифрования (генерируется при первом запуске)
    key: null,
    
    // Инициализация
    init: function() {
        let savedKey = localStorage.getItem('mon_crypto_key');
        if (!savedKey) {
            // Генерация нового ключа
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            savedKey = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
            localStorage.setItem('mon_crypto_key', savedKey);
        }
        this.key = savedKey;
        console.log('✅ Шифрование инициализировано');
    },
    
    // Шифрование строки
    encrypt: function(text) {
        if (!text) return Promise.resolve('');
        try {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const algo = { name: 'AES-GCM', iv: iv };
            
            return crypto.subtle.importKey(
                'raw',
                this.hexToArrayBuffer(this.key),
                algo,
                false,
                ['encrypt']
            ).then(key => {
                const encoded = new TextEncoder().encode(text);
                return crypto.subtle.encrypt(algo, key, encoded);
            }).then(encrypted => {
                const result = new Uint8Array(iv.length + encrypted.byteLength);
                result.set(iv, 0);
                result.set(new Uint8Array(encrypted), iv.length);
                return btoa(String.fromCharCode(...result));
            });
        } catch (error) {
            console.error('Ошибка шифрования:', error);
            return Promise.resolve(text);
        }
    },
    
    // Расшифровка строки
    decrypt: function(encryptedBase64) {
        if (!encryptedBase64) return Promise.resolve('');
        try {
            const data = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            const iv = data.slice(0, 12);
            const encrypted = data.slice(12);
            const algo = { name: 'AES-GCM', iv: iv };
            
            return crypto.subtle.importKey(
                'raw',
                this.hexToArrayBuffer(this.key),
                algo,
                false,
                ['decrypt']
            ).then(key => {
                return crypto.subtle.decrypt(algo, key, encrypted);
            }).then(decrypted => {
                return new TextDecoder().decode(decrypted);
            });
        } catch (error) {
            console.error('Ошибка расшифровки:', error);
            return Promise.resolve(encryptedBase64);
        }
    },
    
    // Шифрование объекта
    encryptObject: function(obj) {
        const json = JSON.stringify(obj);
        return this.encrypt(json);
    },
    
    // Расшифровка объекта
    decryptObject: function(encryptedBase64) {
        return this.decrypt(encryptedBase64).then(json => {
            try {
                return JSON.parse(json);
            } catch (e) {
                return null;
            }
        });
    },
    
    // Конвертация hex в ArrayBuffer
    hexToArrayBuffer: function(hex) {
        const array = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            array[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return array.buffer;
    },
    
    // Хэширование пароля
    hashPassword: function(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        return crypto.subtle.digest('SHA-256', data).then(hash => {
            return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }
};

// Автоинициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.CryptoUtils.init());
} else {
    window.CryptoUtils.init();
}

console.log('✅ CryptoUtils загружен');
