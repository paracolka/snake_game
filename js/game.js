// Основная логика игры для GitHub Pages
class SnakeLadderGame {
    constructor() {
        this.currentPosition = 1;
        this.diceValue = 0;
        this.rollCount = 0;
        this.moveCount = 0;
        this.comments = {};
        this.playerPiece = null;
        this.gameBoard = document.getElementById('game-board');
        this.authSystem = window.authSystem;
        
        this.init();
    }

    async init() {
        await this.loadGame();
        this.createGameBoard();
        this.setupEventListeners();
        this.updatePlayerPosition();
        this.updateCommentsDisplay();
        this.updateStats();
        
        // Показываем уведомление для гостей
        if (this.authSystem && this.authSystem.isGuest()) {
            this.showNotification('Вы вошли как гость. Прогресс сохраняется только в этом браузере.', 'info', 5000);
        }
    }

    getStorageKey() {
        if (!this.authSystem || !this.authSystem.currentUser) {
            return 'snakeLadderGame_guest';
        }
        return `snakeLadderGame_${this.authSystem.currentUser.id}`;
    }

    getCommentsKey() {
        if (!this.authSystem || !this.authSystem.currentUser) {
            return 'snakeLadderComments_guest';
        }
        return `snakeLadderComments_${this.authSystem.currentUser.id}`;
    }

    async loadGame() {
        try {
            const gameData = localStorage.getItem(this.getStorageKey());
            const commentsData = localStorage.getItem(this.getCommentsKey());
            
            if (gameData) {
                const data = JSON.parse(gameData);
                this.currentPosition = data.position || 1;
                this.rollCount = data.rollCount || 0;
                this.moveCount = data.moveCount || 0;
            }
            
            if (commentsData) {
                this.comments = JSON.parse(commentsData) || {};
            }
        } catch (error) {
            console.error('Ошибка загрузки игры:', error);
        }
    }

    async saveGame() {
        try {
            const gameData = {
                position: this.currentPosition,
                rollCount: this.rollCount,
                moveCount: this.moveCount,
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.getStorageKey(), JSON.stringify(gameData));
            localStorage.setItem(this.getCommentsKey(), JSON.stringify(this.comments));
            
            return true;
        } catch (error) {
            console.error('Ошибка сохранения игры:', error);
            return false;
        }
    }

    createGameBoard() {
        if (!this.gameBoard) return;
        
        this.gameBoard.innerHTML = '';
        
        // Создаем поле 10x10 с зигзагообразной нумерацией
        for (let row = 9; row >= 0; row--) {
            const isEvenRow = row % 2 === 0;
            
            for (let col = 0; col < 10; col++) {
                const cellNumber = isEvenRow ? 
                    (row * 10) + col + 1 : 
                    (row * 10) + (10 - col);
                
                const cell = this.createCell(cellNumber);
                this.gameBoard.appendChild(cell);
            }
        }
        
        // Создаем фишку игрока
        this.playerPiece = document.createElement('div');
        this.playerPiece.className = 'player-piece';
        this.playerPiece.id = 'player-piece';
        this.gameBoard.appendChild(this.playerPiece);
        
        // Обновляем индикаторы комментариев
        this.updateCommentIndicators();
    }

    createCell(cellNumber) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.number = cellNumber;
        cell.title = `Клетка ${cellNumber}`;
        
        // Номер клетки
        const numberSpan = document.createElement('span');
        numberSpan.className = 'cell-number';
        numberSpan.textContent = cellNumber;
        cell.appendChild(numberSpan);
        
        // Кнопка для комментария
        const commentBtn = document.createElement('div');
        commentBtn.className = 'add-comment-btn';
        commentBtn.innerHTML = '<i class="fas fa-plus"></i>';
        commentBtn.title = 'Добавить комментарий';
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openCommentModal(cellNumber);
        });
        cell.appendChild(commentBtn);
        
        // Клик по клетке для перемещения
        cell.addEventListener('click', () => {
            if (confirm(`Переместить фишку на клетку ${cellNumber}?`)) {
                this.moveToCell(cellNumber);
            }
        });
        
        return cell;
    }

    updatePlayerPosition() {
        const positionValue = document.getElementById('position-value');
        if (positionValue) {
            positionValue.textContent = this.currentPosition;
        }
        
        if (this.playerPiece && this.gameBoard) {
            const cell = document.querySelector(`.cell[data-number="${this.currentPosition}"]`);
            if (cell) {
                const cellRect = cell.getBoundingClientRect();
                const boardRect = this.gameBoard.getBoundingClientRect();
                
                this.playerPiece.style.left = `${cellRect.left - boardRect.left + cellRect.width / 2 - 18}px`;
                this.playerPiece.style.top = `${cellRect.top - boardRect.top + cellRect.height / 2 - 18}px`;
                
                // Проверка победы
                if (this.currentPosition === 100) {
                    setTimeout(() => {
                        this.handleWin();
                    }, 500);
                }
            }
        }
    }

    updateStats() {
        const rollCountElement = document.getElementById('roll-count');
        const moveCountElement = document.getElementById('move-count');
        
        if (rollCountElement) rollCountElement.textContent = this.rollCount;
        if (moveCountElement) moveCountElement.textContent = this.moveCount;
    }

    async rollDice() {
        const diceDisplay = document.getElementById('dice-display');
        const diceResult = document.getElementById('dice-result');
        const rollBtn = document.getElementById('roll-dice-btn');
        const moveBtn = document.getElementById('move-btn');
        
        if (!diceDisplay || !rollBtn) return;
        
        // Анимация броска
        diceDisplay.querySelector('.dice-inner').textContent = '';
        rollBtn.disabled = true;
        rollBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> БРОСОК...';
        
        let rolls = 0;
        const rollInterval = setInterval(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            diceDisplay.querySelector('.dice-inner').textContent = this.diceValue;
            if (diceResult) diceResult.textContent = this.diceValue;
            rolls++;
            
            if (rolls > 10) {
                clearInterval(rollInterval);
                
                // Финальное значение
                this.diceValue = Math.floor(Math.random() * 6) + 1;
                diceDisplay.querySelector('.dice-inner').textContent = this.diceValue;
                if (diceResult) diceResult.textContent = this.diceValue;
                
                this.rollCount++;
                this.updateStats();
                
                // Активируем кнопку перемещения
                rollBtn.disabled = false;
                rollBtn.innerHTML = '<i class="fas fa-dice"></i> БРОСИТЬ КУБИК';
                
                if (moveBtn) {
                    moveBtn.disabled = false;
                    const newPosition = Math.min(this.currentPosition + this.diceValue, 100);
                    moveBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ПЕРЕЙТИ НА ${newPosition}`;
                }
                
                // Сохраняем состояние
                this.saveGame();
                this.showNotification(`Выпало: ${this.diceValue}!`, 'info');
            }
        }, 100);
    }

    async movePlayer() {
        if (this.diceValue === 0) return;
        
        const newPosition = Math.min(this.currentPosition + this.diceValue, 100);
        const moveBtn = document.getElementById('move-btn');
        
        if (moveBtn) moveBtn.disabled = true;
        
        // Анимация перемещения
        const moveInterval = setInterval(() => {
            if (this.currentPosition < newPosition) {
                this.currentPosition++;
                this.updatePlayerPosition();
            } else {
                clearInterval(moveInterval);
                this.diceValue = 0;
                
                const diceDisplay = document.getElementById('dice-display');
                if (diceDisplay) diceDisplay.querySelector('.dice-inner').textContent = '?';
                
                const diceResult = document.getElementById('dice-result');
                if (diceResult) diceResult.textContent = '0';
                
                this.moveCount++;
                this.updateStats();
                
                // Сохраняем состояние
                this.saveGame();
                
                // Показываем уведомление о достижении 100
                if (this.currentPosition === 100) {
                    setTimeout(() => {
                        this.showNotification('🎉 Поздравляем! Вы достигли клетки 100!', 'success', 5000);
                    }, 300);
                }
            }
        }, 200);
    }

    async moveToCell(cellNumber) {
        if (cellNumber < 1 || cellNumber > 100) return;
        if (cellNumber === this.currentPosition) return;
        
        // Анимация перемещения
        const direction = cellNumber > this.currentPosition ? 1 : -1;
        const moveInterval = setInterval(() => {
            if (direction > 0 ? this.currentPosition < cellNumber : this.currentPosition > cellNumber) {
                this.currentPosition += direction;
                this.updatePlayerPosition();
            } else {
                clearInterval(moveInterval);
                this.moveCount++;
                this.updateStats();
                this.saveGame();
                this.showNotification(`Перемещено на клетку ${cellNumber}`, 'info');
            }
        }, 100);
    }

    handleWin() {
        const rollBtn = document.getElementById('roll-dice-btn');
        const moveBtn = document.getElementById('move-btn');
        
        if (rollBtn) rollBtn.disabled = true;
        if (moveBtn) moveBtn.disabled = true;
        
        this.showNotification(
            `🎊 ПОЗДРАВЛЯЕМ! Вы достигли клетки 100 и выиграли игру! 
            Сделано бросков: ${this.rollCount}, ходов: ${this.moveCount}`,
            'success',
            10000
        );
    }

    async resetGame() {
        if (!confirm('Вы уверены, что хотите начать новую игру? Текущий прогресс будет сброшен.')) {
            return;
        }
        
        this.currentPosition = 1;
        this.diceValue = 0;
        this.rollCount = 0;
        this.moveCount = 0;
        
        const diceDisplay = document.getElementById('dice-display');
        if (diceDisplay) diceDisplay.querySelector('.dice-inner').textContent = '?';
        
        const diceResult = document.getElementById('dice-result');
        if (diceResult) diceResult.textContent = '0';
        
        const moveBtn = document.getElementById('move-btn');
        if (moveBtn) moveBtn.disabled = true;
        
        const rollBtn = document.getElementById('roll-dice-btn');
        if (rollBtn) rollBtn.disabled = false;
        
        this.updatePlayerPosition();
        this.updateStats();
        
        // Сохраняем сброшенное состояние
        await this.saveGame();
        
        this.showNotification('Новая игра начата!', 'success');
    }

    // Комментарии
    openCommentModal(cellNumber) {
        const modal = document.getElementById('comment-modal');
        const cellNumberSpan = document.getElementById('modal-cell-number');
        const commentText = document.getElementById('comment-text');
        const deleteBtn = document.getElementById('delete-comment-btn');
        
        if (!modal || !cellNumberSpan || !commentText) return;
        
        cellNumberSpan.textContent = cellNumber;
        
        // Загружаем существующий комментарий
        if (this.comments[cellNumber]) {
            commentText.value = this.comments[cellNumber].text;
            if (deleteBtn) deleteBtn.style.display = 'flex';
        } else {
            commentText.value = '';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
        
        modal.style.display = 'flex';
        commentText.focus();
    }

    closeCommentModal() {
        const modal = document.getElementById('comment-modal');
        const commentText = document.getElementById('comment-text');
        
        if (modal) modal.style.display = 'none';
        if (commentText) commentText.value = '';
    }

    async saveComment() {
        const cellNumberSpan = document.getElementById('modal-cell-number');
        const commentText = document.getElementById('comment-text');
        
        if (!cellNumberSpan || !commentText) return;
        
        const cellNumber = parseInt(cellNumberSpan.textContent);
        const text = commentText.value.trim();
        
        if (!text) {
            this.showNotification('Введите текст комментария', 'error');
            return;
        }
        
        this.comments[cellNumber] = {
            text: text,
            date: new Date().toLocaleString('ru-RU'),
            cell: cellNumber
        };
        
        await this.saveGame();
        this.updateCommentIndicator(cellNumber);
        this.updateCommentsDisplay();
        
        this.closeCommentModal();
        this.showNotification('Комментарий сохранен!', 'success');
    }

    async deleteComment() {
        const cellNumberSpan = document.getElementById('modal-cell-number');
        if (!cellNumberSpan) return;
        
        const cellNumber = parseInt(cellNumberSpan.textContent);
        
        if (!confirm(`Удалить комментарий к клетке ${cellNumber}?`)) {
            return;
        }
        
        delete this.comments[cellNumber];
        
        await this.saveGame();
        this.updateCommentIndicator(cellNumber);
        this.updateCommentsDisplay();
        
        this.closeCommentModal();
        this.showNotification('Комментарий удален', 'info');
    }

    async clearAllComments() {
        if (!confirm('Удалить все комментарии? Это действие нельзя отменить.')) {
            return;
        }
        
        this.comments = {};
        await this.saveGame();
        this.updateCommentIndicators();
        this.updateCommentsDisplay();
        
        this.showNotification('Все комментарии удалены', 'info');
    }

    updateCommentIndicator(cellNumber) {
        const cell = document.querySelector(`.cell[data-number="${cellNumber}"]`);
        if (cell) {
            if (this.comments[cellNumber]) {
                cell.classList.add('has-comment');
            } else {
                cell.classList.remove('has-comment');
            }
        }
    }

    updateCommentIndicators() {
        for (let i = 1; i <= 100; i++) {
            this.updateCommentIndicator(i);
        }
    }

    updateCommentsDisplay() {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        const sortedCellNumbers = Object.keys(this.comments)
            .map(Number)
            .sort((a, b) => a - b);
        
        if (sortedCellNumbers.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-info-circle"></i>
                    <p>Нажмите <i class="fas fa-plus"></i> на клетке, чтобы добавить комментарий</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        sortedCellNumbers.forEach(cellNumber => {
            const comment = this.comments[cellNumber];
            html += `
                <div class="comment-item" data-cell="${cellNumber}">
                    <div class="comment-header">
                        <div class="comment-cell">
                            <i class="fas fa-map-marker-alt"></i> Клетка ${cellNumber}
                        </div>
                        <div class="comment-date">${comment.date}</div>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `;
        });
        
        commentsList.innerHTML = html;
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.animation = 'notificationSlideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Закрытие по клику
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        });
    }

    setupEventListeners() {
        // Кнопка броска кубика
        const rollBtn = document.getElementById('roll-dice-btn');
        if (rollBtn) {
            rollBtn.addEventListener('click', () => this.rollDice());
        }
        
        // Кнопка перемещения
        const moveBtn = document.getElementById('move-btn');
        if (moveBtn) {
            moveBtn.addEventListener('click', () => this.movePlayer());
        }
        
        // Кнопка новой игры
        const resetBtn = document.getElementById('reset-game-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }
        
        // Кнопка сохранения игры
        const saveBtn = document.getElementById('save-game-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const success = await this.saveGame();
                if (success) {
                    this.showNotification('Игра сохранена!', 'success');
                } else {
                    this.showNotification('Ошибка сохранения', 'error');
                }
            });
        }
        
        // Кнопка очистки комментариев
        const clearCommentsBtn = document.getElementById('clear-comments-btn');
        if (clearCommentsBtn) {
            clearCommentsBtn.addEventListener('click', () => this.clearAllComments());
        }
        
        // Кнопка помощи
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeHelpBtn = document.getElementById('close-help-btn');
        const helpModalClose = document.getElementById('help-modal-close');
        
        if (helpBtn && helpModal) {
            helpBtn.addEventListener('click', () => {
                helpModal.style.display = 'flex';
            });
            
            if (closeHelpBtn) {
                closeHelpBtn.addEventListener('click', () => {
                    helpModal.style.display = 'none';
                });
            }
            
            if (helpModalClose) {
                helpModalClose.addEventListener('click', () => {
                    helpModal.style.display = 'none';
                });
            }
            
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.style.display = 'none';
                }
            });
        }
        
        // Модальное окно комментариев
        const commentModal = document.getElementById('comment-modal');
        const saveCommentBtn = document.getElementById('save-comment-btn');
        const cancelCommentBtn = document.getElementById('cancel-comment-btn');
        const deleteCommentBtn = document.getElementById('delete-comment-btn');
        const commentModalClose = document.getElementById('comment-modal-close');
        
        if (saveCommentBtn) {
            saveCommentBtn.addEventListener('click', () => this.saveComment());
        }
        
        if (cancelCommentBtn) {
            cancelCommentBtn.addEventListener('click', () => this.closeCommentModal());
        }
        
        if (deleteCommentBtn) {
            deleteCommentBtn.addEventListener('click', () => this.deleteComment());
        }
        
        if (commentModalClose) {
            commentModalClose.addEventListener('click', () => this.closeCommentModal());
        }
        
        if (commentModal) {
            commentModal.addEventListener('click', (e) => {
                if (e.target === commentModal) {
                    this.closeCommentModal();
                }
            });
        }
        
        // Закрытие модальных окон по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCommentModal();
                if (helpModal) helpModal.style.display = 'none';
            }
        });
        
        // Поддержка Enter в модальном окне комментариев
        const commentText = document.getElementById('comment-text');
        if (commentText) {
            commentText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    this.saveComment();
                }
            });
        }
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что мы на странице игры
    if (window.location.pathname.includes('game.html') || 
        window.location.pathname.endsWith('game.html') ||
        window.location.pathname === '/' && document.getElementById('game-board')) {
        
        // Инициализируем систему авторизации, если еще не инициализирована
        if (!window.authSystem) {
            window.authSystem = {
                currentUser: { id: 'guest', username: 'Гость' },
                isGuest: () => true
            };
        }
        
        window.game = new SnakeLadderGame();
    }
});