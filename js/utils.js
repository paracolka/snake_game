// Вспомогательные функции для игры

// Форматирование даты
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Генерация случайного цвета
function getRandomColor() {
    const colors = [
        '#4a90e2', '#2c6cb0', '#34c759', '#2a9c46',
        '#af52de', '#8e44ad', '#ff6b6b', '#ff5252',
        '#ff9500', '#ff7b00', '#5ac8fa', '#007aff'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Проверка поддержки localStorage
function isLocalStorageAvailable() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage недоступен. Сохранение не будет работать.');
        return false;
    }
}

// Анимация элементов
function animateElement(element, animation, duration = 300) {
    element.style.animation = `${animation} ${duration}ms ease-out`;
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

// Валидация email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Дебаунсинг функции
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Сохранение в localStorage с обработкой ошибок
function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        // Пытаемся очистить старое хранилище
        try {
            localStorage.clear();
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e2) {
            console.error('Не удалось очистить localStorage:', e2);
            return false;
        }
    }
}

// Загрузка из localStorage с обработкой ошибок
function safeLocalStorageGet(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
        return defaultValue;
    }
}

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        getRandomColor,
        isLocalStorageAvailable,
        animateElement,
        isValidEmail,
        debounce,
        safeLocalStorageSet,
        safeLocalStorageGet
    };
}