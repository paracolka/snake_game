// Система авторизации для GitHub Pages
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.usersKey = 'snakeLadderUsers';
        this.currentUserKey = 'snakeLadderCurrentUser';
        this.guestUser = { id: 'guest', username: 'Гость', email: null, role: 'guest' };
        this.init();
    }

    init() {
        this.loadUsers();
        this.loadCurrentUser();
        this.setupEventListeners();
        this.checkRedirect();
    }

    loadUsers() {
        const usersJson = localStorage.getItem(this.usersKey);
        this.users = usersJson ? JSON.parse(usersJson) : [];
        
        // Создаем тестового пользователя, если нет пользователей
        if (this.users.length === 0) {
            const testUser = {
                id: this.generateId(),
                username: 'test',
                email: 'test@example.com',
                passwordHash: this.hashPassword('test123'),
                createdAt: new Date().toISOString(),
                lastLogin: null,
                gameData: null
            };
            this.users.push(testUser);
            this.saveUsers();
        }
    }

    saveUsers() {
        localStorage.setItem(this.usersKey, JSON.stringify(this.users));
    }

    loadCurrentUser() {
        const userJson = localStorage.getItem(this.currentUserKey);
        this.currentUser = userJson ? JSON.parse(userJson) : null;
        
        // Если пользователь гость из параметра URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('guest') === 'true') {
            this.currentUser = this.guestUser;
            this.saveCurrentUser();
        }
        
        // Перенаправляем, если авторизован и на странице логина
        if (this.currentUser && window.location.pathname.includes('login.html')) {
            window.location.href = 'game.html';
        }
        
        // Перенаправляем, если не авторизован и на странице игры
        if (!this.currentUser && window.location.pathname.includes('game.html')) {
            window.location.href = 'login.html';
        }
    }

    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem(this.currentUserKey, JSON.stringify(this.currentUser));
        }
    }

    checkRedirect() {
        // Проверяем параметры URL
        const urlParams = new URLSearchParams(window.location.search);
        
        // Автоматический вход как гость
        if (urlParams.get('guest') === 'true' && !this.currentUser) {
            this.currentUser = this.guestUser;
            this.saveCurrentUser();
            window.location.href = 'game.html';
        }
        
        // Автоматический выход
        if (urlParams.get('logout') === 'true') {
            this.logout();
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    hashPassword(password) {
        // Простое хеширование для демонстрации (в реальном приложении используйте bcrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    validateUsername(username) {
        if (!username || username.length < 3 || username.length > 20) {
            return { valid: false, error: 'Имя пользователя должно быть от 3 до 20 символов' };
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, error: 'Имя пользователя может содержать только буквы, цифры и подчеркивания' };
        }
        
        return { valid: true };
    }

    validatePassword(password) {
        if (!password || password.length < 6) {
            return { valid: false, error: 'Пароль должен быть не менее 6 символов' };
        }
        
        return { valid: true };
    }

    async register(username, password, email = null) {
        const usernameValidation = this.validateUsername(username);
        if (!usernameValidation.valid) {
            return { success: false, error: usernameValidation.error };
        }

        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.valid) {
            return { success: false, error: passwordValidation.error };
        }

        // Проверяем, существует ли пользователь
        const existingUser = this.users.find(u => u.username === username);
        if (existingUser) {
            return { success: false, error: 'Пользователь с таким именем уже существует' };
        }

        // Создаем нового пользователя
        const newUser = {
            id: this.generateId(),
            username,
            email,
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            gameData: null
        };

        this.users.push(newUser);
        this.saveUsers();

        // Автоматически входим
        this.currentUser = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: 'user'
        };
        this.saveCurrentUser();

        return { success: true, user: this.currentUser };
    }

    async login(username, password) {
        // Вход как гость
        if (username === 'guest' || username === '') {
            this.currentUser = this.guestUser;
            this.saveCurrentUser();
            return { success: true, user: this.currentUser };
        }

        // Поиск пользователя
        const user = this.users.find(u => u.username === username);
        if (!user) {
            return { success: false, error: 'Пользователь не найден' };
        }

        // Проверка пароля
        const passwordHash = this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, error: 'Неверный пароль' };
        }

        // Обновляем время последнего входа
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // Устанавливаем текущего пользователя
        this.currentUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: 'user'
        };
        this.saveCurrentUser();

        return { success: true, user: this.currentUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.currentUserKey);
        
        // Если мы на странице игры, перенаправляем на главную
        if (window.location.pathname.includes('game.html')) {
            window.location.href = 'index.html?logout=true';
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isGuest() {
        return this.currentUser && this.currentUser.id === 'guest';
    }

    setupEventListeners() {
        // Переключение между вкладками
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            }
        });

        // Кнопка входа
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value.trim();
                this.handleLogin(username, password);
            });

            // Поддержка Enter
            document.getElementById('login-password')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
        }

        // Кнопка регистрации
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                const username = document.getElementById('register-username').value.trim();
                const email = document.getElementById('register-email').value.trim();
                const password = document.getElementById('register-password').value.trim();
                const confirmPassword = document.getElementById('register-password-confirm').value.trim();
                this.handleRegister(username, email, password, confirmPassword);
            });

            // Поддержка Enter
            document.getElementById('register-password-confirm')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    registerBtn.click();
                }
            });
        }

        // Кнопка гостя
        const guestBtn = document.getElementById('guest-btn');
        if (guestBtn) {
            guestBtn.addEventListener('click', () => {
                this.handleGuestLogin();
            });
        }

        // Кнопка выхода в игре
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    this.logout();
                }
            });
        }
    }

    switchTab(tabName) {
        // Обновляем активные вкладки
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        // Активируем выбранную вкладку
        const activeTab = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        const activeForm = document.getElementById(`${tabName}-form`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeForm) activeForm.classList.add('active');

        // Очищаем сообщения
        this.clearMessages();
    }

    async handleLogin(username, password) {
        const loginBtn = document.getElementById('login-btn');
        const originalText = loginBtn.innerHTML;
        
        if (!username || !password) {
            this.showMessage('login-message', 'Заполните все поля', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        this.clearMessages();

        const result = await this.login(username, password);
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
        
        if (result.success) {
            this.showMessage('login-message', `Добро пожаловать, ${result.user.username}!`, 'success');
            
            // Перенаправление через 1 секунду
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1000);
        } else {
            this.showMessage('login-message', result.error, 'error');
        }
    }

    async handleRegister(username, email, password, confirmPassword) {
        const registerBtn = document.getElementById('register-btn');
        const originalText = registerBtn.innerHTML;
        
        // Валидация
        if (!username || !password || !confirmPassword) {
            this.showMessage('register-message', 'Заполните обязательные поля', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('register-message', 'Пароли не совпадают', 'error');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
        this.clearMessages();

        const result = await this.register(username, password, email || null);
        
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalText;
        
        if (result.success) {
            this.showMessage('register-message', 'Регистрация успешна! Выполняется вход...', 'success');
            
            // Перенаправление через 1.5 секунды
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1500);
        } else {
            this.showMessage('register-message', result.error, 'error');
        }
    }

    async handleGuestLogin() {
        const guestBtn = document.getElementById('guest-btn');
        const originalText = guestBtn.innerHTML;
        
        guestBtn.disabled = true;
        guestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        this.clearMessages();

        const result = await this.login('guest', '');
        
        guestBtn.disabled = false;
        guestBtn.innerHTML = originalText;
        
        if (result.success) {
            this.showMessage('login-message', 'Вход как гость выполнен!', 'success');
            
            // Перенаправление через 1 секунду
            setTimeout(() => {
                window.location.href = 'game.html';
            }, 1000);
        }
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
        }
    }

    clearMessages() {
        document.querySelectorAll('.message').forEach(msg => {
            msg.style.display = 'none';
            msg.textContent = '';
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Обновляем имя пользователя на странице игры
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && window.authSystem.currentUser) {
        usernameDisplay.textContent = window.authSystem.currentUser.username;
        
        // Добавляем иконку гостя, если это гость
        if (window.authSystem.isGuest()) {
            usernameDisplay.innerHTML = '<i class="fas fa-user-circle"></i> Гость';
        }
    }
});