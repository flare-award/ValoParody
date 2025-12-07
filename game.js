class ValorantGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.screens = document.querySelectorAll('.screen');
        
        // Игровые переменные
        this.gameState = 'menu';
        this.player = {
            x: 400,
            y: 300,
            health: 100,
            maxHealth: 100,
            armor: 50,
            maxArmor: 100,
            credits: 800,
            kills: 0,
            deaths: 0,
            assists: 0,
            agent: null,
            weapons: ['classic'],
            currentWeapon: 'classic',
            team: 'attack'
        };
        
        this.round = {
            number: 1,
            timer: 105, // 1:45 в секундах
            phase: 'buy', // buy, fight, end
            winner: null
        };
        
        this.bots = [];
        this.bullets = [];
        this.gameObjects = [];
        this.isPaused = false;
        
        // Управление
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        // Настройки
        this.settings = {
            graphics: 'medium',
            sfxVolume: 70,
            musicVolume: 50,
            mouseSensitivity: 5
        };
        
        this.init();
    }
    
    init() {
        // Установка размеров canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // События управления
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', () => this.mouse.down = true);
        this.canvas.addEventListener('mouseup', () => this.mouse.down = false);
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.touches[0].clientX - rect.left;
            this.mouse.y = e.touches[0].clientY - rect.top;
            this.mouse.down = true;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.touches[0].clientX - rect.left;
            this.mouse.y = e.touches[0].clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchend', () => this.mouse.down = false);
        
        // Загрузка данных
        this.loadAgents();
        this.loadWeapons();
        
        // Запуск игрового цикла
        this.gameLoop();
        
        // Запуск таймера раунда
        setInterval(() => this.updateRoundTimer(), 1000);
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    showScreen(screenId) {
        this.screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        this.gameState = screenId.replace('-screen', '');
        
        if (screenId === 'game-screen') {
            this.startRound();
        }
    }
    
    loadAgents() {
        const agents = [
            {
                id: 'jett',
                name: 'Джетт',
                role: 'Дуэлянт',
                abilities: ['Q', 'E', 'C', 'X'],
                description: 'Мобильный дуэлянт из Кореи'
            },
            {
                id: 'phoenix',
                name: 'Феникс',
                role: 'Дуэлянт',
                abilities: ['Q', 'E', 'C', 'X'],
                description: 'Британский дуэлянт с огненными способностями'
            },
            {
                id: 'sage',
                name: 'Сейдж',
                role: 'Хилер',
                abilities: ['Q', 'E', 'C', 'X'],
                description: 'Хилер из Китая'
            },
            {
                id: 'sova',
                name: 'Сова',
                role: 'Разведчик',
                abilities: ['Q', 'E', 'C', 'X'],
                description: 'Разведчик из России'
            },
            {
                id: 'cypher',
                name: 'Шифр',
                role: 'Страж',
                abilities: ['Q', 'E', 'C', 'X'],
                description: 'Страж из Марокко'
            }
        ];
        
        const container = document.getElementById('agents-container');
        container.innerHTML = '';
        
        agents.forEach(agent => {
            const card = document.createElement('div');
            card.className = 'agent-card';
            card.innerHTML = `
                <div class="agent-icon">${agent.name.charAt(0)}</div>
                <div class="agent-name">${agent.name}</div>
                <div class="agent-role">${agent.role}</div>
                <div class="agent-desc">${agent.description}</div>
                <div class="agent-abilities">
                    ${agent.abilities.map(a => `<div class="ability-icon">${a}</div>`).join('')}
                </div>
            `;
            card.addEventListener('click', () => this.selectAgent(agent.id));
            container.appendChild(card);
        });
    }
    
    selectAgent(agentId) {
        this.player.agent = agentId;
        document.querySelectorAll('.agent-card').forEach(card => {
            card.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        this.showNotification(`Агент выбран: ${agentId}`);
        setTimeout(() => this.showScreen('buy-menu'), 500);
    }
    
    loadWeapons() {
        const weapons = [
            { id: 'classic', name: 'Classic', price: 0, type: 'pistol', damage: 25, fireRate: 5 },
            { id: 'ghost', name: 'Ghost', price: 500, type: 'pistol', damage: 30, fireRate: 6 },
            { id: 'phantom', name: 'Phantom', price: 2900, type: 'rifle', damage: 35, fireRate: 9 },
            { id: 'vandal', name: 'Vandal', price: 2900, type: 'rifle', damage: 40, fireRate: 8 },
            { id: 'operator', name: 'Operator', price: 4700, type: 'sniper', damage: 150, fireRate: 1 },
            { id: 'spectre', name: 'Spectre', price: 1600, type: 'smg', damage: 25, fireRate: 12 }
        ];
        
        const container = document.getElementById('weapons-container');
        container.innerHTML = '';
        
        weapons.forEach(weapon => {
            const card = document.createElement('div');
            card.className = 'weapon-card';
            card.innerHTML = `
                <div class="weapon-name">${weapon.name}</div>
                <div class="weapon-price">$${weapon.price}</div>
                <div class="weapon-stats">
                    <span>Урон: ${weapon.damage}</span>
                    <span>Скорость: ${weapon.fireRate}</span>
                </div>
            `;
            card.addEventListener('click', () => this.buyWeapon(weapon));
            container.appendChild(card);
        });
    }
    
    buyWeapon(weapon) {
        if (this.player.credits >= weapon.price) {
            this.player.credits -= weapon.price;
            if (!this.player.weapons.includes(weapon.id)) {
                this.player.weapons.push(weapon.id);
            }
            this.player.currentWeapon = weapon.id;
            this.updateUI();
            this.showNotification(`Куплено: ${weapon.name}`);
        } else {
            this.showNotification('Недостаточно кредитов!', 'error');
        }
    }
    
    startGame() {
        this.showScreen('agent-select');
    }
    
    startRound() {
        this.showScreen('game-screen');
        this.round.phase = 'fight';
        this.round.timer = 105;
        
        // Создание ботов
        this.createBots();
        
        // Обновление UI
        this.updateUI();
    }
    
    createBots() {
        this.bots = [];
        const botCount = 5;
        
        for (let i = 0; i < botCount; i++) {
            this.bots.push({
                id: i,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                health: 100,
                team: i % 2 === 0 ? 'attack' : 'defense',
                target: null,
                state: 'patrol'
            });
        }
    }
    
    updateRoundTimer() {
        if (this.round.phase === 'fight' && !this.isPaused) {
            this.round.timer--;
            
            if (this.round.timer <= 0) {
                this.endRound('defense'); // Защита побеждает при тайм-ауте
            }
            
            // Обновление таймера в UI
            const minutes = Math.floor(this.round.timer / 60);
            const seconds = this.round.timer % 60;
            document.getElementById('round-timer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    endRound(winner) {
        this.round.phase = 'end';
        this.round.winner = winner;
        
        // Обновление счета
        if (winner === 'attack') {
            document.getElementById('attack-score').textContent = 
                parseInt(document.getElementById('attack-score').textContent) + 1;
        } else {
            document.getElementById('defense-score').textContent = 
                parseInt(document.getElementById('defense-score').textContent) + 1;
        }
        
        // Обновление статистики игрока
        document.getElementById('final-attack-score').textContent = 
            document.getElementById('attack-score').textContent;
        document.getElementById('final-defense-score').textContent = 
            document.getElementById('defense-score').textContent;
        
        document.getElementById('stat-kills').textContent = this.player.kills;
        document.getElementById('stat-deaths').textContent = this.player.deaths;
        document.getElementById('stat-assists').textContent = this.player.assists;
        document.getElementById('stat-money').textContent = this.player.credits;
        
        // Показ экрана результатов
        setTimeout(() => this.showScreen('results-screen'), 1000);
    }
    
    nextRound() {
        this.round.number++;
        this.player.credits += 2400; // Награда за раунд
        this.player.health = 100;
        this.player.armor = 50;
        
        // Смена стороны
        this.player.team = this.player.team === 'attack' ? 'defense' : 'attack';
        
        document.getElementById('round-number').textContent = this.round.number;
        this.updateUI();
        this.showScreen('buy-menu');
    }
    
    updateUI() {
        // Обновление здоровья и брони
        document.getElementById('health-text').textContent = this.player.health;
        document.getElementById('armor-text').textContent = this.player.armor;
        document.getElementById('health-bar').style.width = `${(this.player.health / this.player.maxHealth) * 100}%`;
        document.getElementById('armor-bar').style.width = `${(this.player.armor / this.player.maxArmor) * 100}%`;
        
        // Обновление кредитов
        document.getElementById('credits').textContent = this.player.credits;
        document.getElementById('current-credits').textContent = this.player.credits;
        
        // Обновление оружия
        document.getElementById('current-weapon').textContent = 
            this.player.currentWeapon.charAt(0).toUpperCase() + this.player.currentWeapon.slice(1);
    }
    
    gameLoop() {
        if (this.gameState === 'game' && !this.isPaused) {
            // Очистка canvas
            this.ctx.fillStyle = '#1a2634';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Обновление игрока
            this.updatePlayer();
            
            // Обновление ботов
            this.updateBots();
            
            // Обновление пуль
            this.updateBullets();
            
            // Отрисовка
            this.drawPlayer();
            this.drawBots();
            this.drawBullets();
            
            // Отрисовка миникарты
            this.drawMinimap();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayer() {
        // Движение
        const speed = 5;
        
        if (this.keys['w'] || this.keys['ArrowUp']) {
            this.player.y -= speed;
        }
        if (this.keys['s'] || this.keys['ArrowDown']) {
            this.player.y += speed;
        }
        if (this.keys['a'] || this.keys['ArrowLeft']) {
            this.player.x -= speed;
        }
        if (this.keys['d'] || this.keys['ArrowRight']) {
            this.player.x += speed;
        }
        
        // Ограничение в пределах canvas
        this.player.x = Math.max(0, Math.min(this.canvas.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height, this.player.y));
        
        // Стрельба
        if (this.mouse.down) {
            this.shoot();
        }
    }
    
    shoot() {
        const weapon = this.getCurrentWeapon();
        if (!weapon) return;
        
        // Создание пули
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            dx: (this.mouse.x - this.player.x) / 10,
            dy: (this.mouse.y - this.player.y) / 10,
            damage: weapon.damage,
            team: this.player.team
        });
        
        // Обновление UI с боеприпасами
        this.showNotification('Выстрел!');
    }
    
    getCurrentWeapon() {
        const weapons = {
            'classic': { damage: 25, fireRate: 5 },
            'ghost': { damage: 30, fireRate: 6 },
            'phantom': { damage: 35, fireRate: 9 },
            'vandal': { damage: 40, fireRate: 8 },
            'operator': { damage: 150, fireRate: 1 },
            'spectre': { damage: 25, fireRate: 12 }
        };
        return weapons[this.player.currentWeapon];
    }
    
    updateBots() {
        this.bots.forEach(bot => {
            // ИИ бота
            if (bot.state === 'patrol') {
                bot.x += (Math.random() - 0.5) * 2;
                bot.y += (Math.random() - 0.5) * 2;
                
                // Обнаружение игрока
                const distance = Math.sqrt(
                    Math.pow(bot.x - this.player.x, 2) + 
                    Math.pow(bot.y - this.player.y, 2)
                );
                
                if (distance < 200 && bot.team !== this.player.team) {
                    bot.state = 'attack';
                    bot.target = 'player';
                }
            } else if (bot.state === 'attack') {
                // Движение к цели
                if (bot.target === 'player') {
                    const dx = this.player.x - bot.x;
                    const dy = this.player.y - bot.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 50) {
                        bot.x += (dx / dist) * 2;
                        bot.y += (dy / dist) * 2;
                    }
                    
                    // Стрельба
                    if (Math.random() < 0.02) {
                        this.bullets.push({
                            x: bot.x,
                            y: bot.y,
                            dx: (this.player.x - bot.x) / 10,
                            dy: (this.player.y - bot.y) / 10,
                            damage: 20,
                            team: bot.team
                        });
                    }
                }
            }
            
            // Проверка столкновений с пулями
            this.bullets.forEach((bullet, bulletIndex) => {
                if (bullet.team !== bot.team) {
                    const distance = Math.sqrt(
                        Math.pow(bullet.x - bot.x, 2) + 
                        Math.pow(bullet.y - bot.y, 2)
                    );
                    
                    if (distance < 20) {
                        bot.health -= bullet.damage;
                        this.bullets.splice(bulletIndex, 1);
                        
                        if (bot.health <= 0) {
                            this.bots.splice(this.bots.indexOf(bot), 1);
                            this.player.kills++;
                            this.player.credits += 300;
                            this.updateUI();
                            this.showNotification('Убийство! +$300');
                            
                            // Проверка конца раунда
                            if (this.bots.length === 0) {
                                this.endRound(this.player.team);
                            }
                        }
                    }
                }
            });
        });
    }
    
    updateBullets() {
        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            
            // Удаление пуль за пределами экрана
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(index, 1);
            }
            
            // Проверка попадания в игрока
            if (bullet.team !== this.player.team) {
                const distance = Math.sqrt(
                    Math.pow(bullet.x - this.player.x, 2) + 
                    Math.pow(bullet.y - this.player.y, 2)
                );
                
                if (distance < 20) {
                    let damage = bullet.damage;
                    
                    // Учет брони
                    if (this.player.armor > 0) {
                        damage *= 0.5;
                        this.player.armor -= damage;
                        if (this.player.armor < 0) this.player.armor = 0;
                    }
                    
                    this.player.health -= damage;
                    this.bullets.splice(index, 1);
                    this.updateUI();
                    
                    if (this.player.health <= 0) {
                        this.player.deaths++;
                        this.showNotification('Вы убиты!');
                        setTimeout(() => this.endRound(this.player.team === 'attack' ? 'defense' : 'attack'), 1000);
                    }
                }
            }
        });
    }
    
    drawPlayer() {
        // Отрисовка игрока
        this.ctx.fillStyle = this.player.team === 'attack' ? '#fd4556' : '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Отрисовка направления
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.player.x + 30, this.player.y);
        this.ctx.stroke();
    }
    
    drawBots() {
        this.bots.forEach(bot => {
            this.ctx.fillStyle = bot.team === 'attack' ? '#fd4556' : '#2196F3';
            this.ctx.beginPath();
            this.ctx.arc(bot.x, bot.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Полоска здоровья
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(bot.x - 15, bot.y - 25, 30 * (bot.health / 100), 5);
        });
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.team === 'attack' ? '#ff9800' : '#4CAF50';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawMinimap() {
        const minimap = document.getElementById('minimap');
        const ctx = minimap.getContext('2d');
        
        // Очистка миникарты
        ctx.fillStyle = '#0f1923';
        ctx.fillRect(0, 0, minimap.width, minimap.height);
        
        // Масштаб для миникарты
        const scale = 0.1;
        
        // Отрисовка игрока
        ctx.fillStyle = this.player.team === 'attack' ? '#fd4556' : '#2196F3';
        ctx.beginPath();
        ctx.arc(
            this.player.x * scale, 
            this.player.y * scale, 
            4, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Отрисовка ботов
        this.bots.forEach(bot => {
            ctx.fillStyle = bot.team === 'attack' ? '#fd4556' : '#2196F3';
            ctx.beginPath();
            ctx.arc(
                bot.x * scale, 
                bot.y * scale, 
                3, 0, Math.PI * 2
            );
            ctx.fill();
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    pauseGame() {
        this.isPaused = !this.isPaused;
        this.showNotification(this.isPaused ? 'Игра на паузе' : 'Игра продолжается');
    }
    
    showAgents() {
        this.showScreen('agent-select');
    }
    
    showWeapons() {
        this.showScreen('buy-menu');
    }
    
    showSettings() {
        this.showScreen('settings-screen');
    }
    
    showStats() {
        // Заполнение статистики
        document.getElementById('stat-kills').textContent = this.player.kills;
        document.getElementById('stat-deaths').textContent = this.player.deaths;
        document.getElementById('stat-assists').textContent = this.player.assists;
        document.getElementById('stat-money').textContent = this.player.credits;
        
        this.showScreen('results-screen');
    }
    
    showMainMenu() {
        this.showScreen('main-menu');
    }
    
    openBuyMenu() {
        if (this.round.phase === 'buy') {
            this.showScreen('buy-menu');
        }
    }
    
    showMap() {
        // В будущем можно добавить полноэкранную карту
        this.showNotification('Карта открыта');
    }
}

// Глобальные функции для кнопок
let game;

function startGame() {
    if (!game) game = new ValorantGame();
    game.startGame();
}

function showAgents() {
    if (!game) game = new ValorantGame();
    game.showAgents();
}

function showWeapons() {
    if (!game) game = new ValorantGame();
    game.showWeapons();
}

function showSettings() {
    if (!game) game = new ValorantGame();
    game.showSettings();
}

function showStats() {
    if (!game) game = new ValorantGame();
    game.showStats();
}

function showMainMenu() {
    if (!game) game = new ValorantGame();
    game.showMainMenu();
}

function startRound() {
    if (!game) game = new ValorantGame();
    game.startRound();
}

function nextRound() {
    if (!game) game = new ValorantGame();
    game.nextRound();
}

function openBuyMenu() {
    if (!game) game = new ValorantGame();
    game.openBuyMenu();
}

function pauseGame() {
    if (!game) game = new ValorantGame();
    game.pauseGame();
}

function showMap() {
    if (!game) game = new ValorantGame();
    game.showMap();
}

function filterWeapons(category) {
    // Реализация фильтрации оружия
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    game = new ValorantGame();
});