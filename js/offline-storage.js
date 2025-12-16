// Менеджер локального хранилища для игры
class OfflineStorage {
    constructor() {
        this.prefix = 'snakeLadder_';
        this.init();
    }

    init() {
        // Проверяем поддержку localStorage
        if (!this.isSupported()) {
            console.warn('localStorage не поддерживается. Сохранение не будет работать.');
            this.showStorageWarning();
        }
        
        // Очистка устаревших данных (старше 30 дней)
        this.cleanupOldData();
    }

    isSupported() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    showStorageWarning() {
        // Показываем предупреждение только один раз
        if (!sessionStorage.getItem('storageWarningShown')) {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 15px;
                border-radius: 10px;
                z-index: 9999;
                text-align: center;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                animation: slideInDown 0.5s ease-out;
            `;
            warning.innerHTML = `
                <strong>⚠️ Внимание!</strong>
                <p>Ваш браузер не поддерживает сохранение данных. Прогресс игры не будет сохраняться.</p>
                <small>Рекомендуем использовать современный браузер (Chrome, Firefox, Edge, Safari)</small>
            `;
            document.body.appendChild(warning);
            
            // Убираем через 10 секунд
            setTimeout(() => {
                warning.style.animation = 'slideInDown 0.5s ease-out reverse';
                setTimeout(() => {
                    if (warning.parentNode) {
                        document.body.removeChild(warning);
                    }
                }, 500);
            }, 10000);
            
            sessionStorage.setItem('storageWarningShown', 'true');
        }
    }

    getKey(userId, dataType) {
        return `${this.prefix}${userId}_${dataType}`;
    }

    // Сохранение данных игры
    saveGameData(userId, gameData) {
        if (!this.isSupported()) return false;
        
        try {
            const key = this.getKey(userId, 'game');
            const data = {
                ...gameData,
                _savedAt: new Date().toISOString(),
                _version: '1.0'
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения игры:', error);
            return false;
        }
    }

    // Загрузка данных игры
    loadGameData(userId) {
        if (!this.isSupported()) return null;
        
        try {
            const key = this.getKey(userId, 'game');
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Ошибка загрузки игры:', error);
            return null;
        }
    }

    // Сохранение комментариев
    saveComments(userId, comments) {
        if (!this.isSupported()) return false;
        
        try {
            const key = this.getKey(userId, 'comments');
            const data = {
                comments,
                _savedAt: new Date().toISOString(),
                _version: '1.0'
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения комментариев:', error);
            return false;
        }
    }

    // Загрузка комментариев
    loadComments(userId) {
        if (!this.isSupported()) return {};
        
        try {
            const key = this.getKey(userId, 'comments');
            const data = localStorage.getItem(key);
            if (!data) return {};
            
            const parsed = JSON.parse(data);
            return parsed.comments || {};
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
            return {};
        }
    }

    // Сохранение настроек пользователя
    saveSettings(userId, settings) {
        if (!this.isSupported()) return false;
        
        try {
            const key = this.getKey(userId, 'settings');
            const data = {
                ...settings,
                _savedAt: new Date().toISOString()
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            return false;
        }
    }

    // Загрузка настроек пользователя
    loadSettings(userId) {
        if (!this.isSupported()) return {};
        
        try {
            const key = this.getKey(userId, 'settings');
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            return {};
        }
    }

    // Удаление всех данных пользователя
    clearUserData(userId) {
        if (!this.isSupported()) return false;
        
        try {
            const keys = ['game', 'comments', 'settings'];
            keys.forEach(dataType => {
                const key = this.getKey(userId, dataType);
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            return false;
        }
    }

    // Очистка устаревших данных (старше 30 дней)
    cleanupOldData() {
        if (!this.isSupported()) return;
        
        try {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                if (key.startsWith(this.prefix)) {
                    try {
                        const item = localStorage.getItem(key);
                        const data = JSON.parse(item);
                        
                        if (data && data._savedAt) {
                            const savedDate = new Date(data._savedAt).getTime();
                            if (savedDate < thirtyDaysAgo) {
                                localStorage.removeItem(key);
                            }
                        }
                    } catch (e) {
                        // Пропускаем некорректные данные
                        continue;
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка очистки устаревших данных:', error);
        }
    }

    // Экспорт всех данных пользователя
    exportUserData(userId) {
        if (!this.isSupported()) return null;
        
        try {
            const data = {
                game: this.loadGameData(userId),
                comments: this.loadComments(userId),
                settings: this.loadSettings(userId),
                exportedAt: new Date().toISOString()
            };
            
            // Создаем blob для скачивания
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            return url;
        } catch (error) {
            console.error('Ошибка экспорта данных:', error);
            return null;
        }
    }

    // Импорт данных пользователя
    importUserData(userId, data) {
        if (!this.isSupported()) return false;
        
        try {
            if (data.game) {
                this.saveGameData(userId, data.game);
            }
            
            if (data.comments) {
                this.saveComments(userId, data.comments);
            }
            
            if (data.settings) {
                this.saveSettings(userId, data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Ошибка импорта данных:', error);
            return false;
        }
    }

    // Получение статистики хранилища
    getStorageStats() {
        if (!this.isSupported()) return null;
        
        try {
            let totalSize = 0;
            let itemCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const item = localStorage.getItem(key);
                totalSize += key.length + item.length;
                itemCount++;
            }
            
            return {
                totalSize: totalSize,
                itemCount: itemCount,
                estimatedSize: (totalSize * 2) / 1024, // Примерный размер в KB
                limit: 5 * 1024 * 1024 // Примерный лимит localStorage (5MB)
            };
        } catch (error) {
            console.error('Ошибка получения статистики хранилища:', error);
            return null;
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.offlineStorage = new OfflineStorage();
});