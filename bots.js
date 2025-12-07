class BotAI {
    constructor(game) {
        this.game = game;
        this.bots = [];
        this.difficulty = 'medium'; // easy, medium, hard
    }
    
    createBot(team, difficulty = 'medium') {
        const bot = {
            id: this.bots.length,
            x: Math.random() * this.game.canvas.width,
            y: Math.random() * this.game.canvas.height,
            health: 100,
            armor: 50,
            team: team,
            state: 'patrol',
            target: null,
            lastShot: 0,
            reloadTime: 0,
            path: [],
            currentPathIndex: 0,
            difficulty: difficulty,
            
            // Характеристики в зависимости от сложности
            accuracy: difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.8,
            reactionTime: difficulty === 'easy' ? 1000 : difficulty === 'medium' ? 500 : 200,
            aggression: difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.9
        };
        
        this.bots.push(bot);
        return bot;
    }
    
    update() {
        this.bots.forEach(bot => {
            if (bot.health <= 0) return;
            
            switch (bot.state) {
                case 'patrol':
                    this.patrol(bot);
                    break;
                case 'attack':
                    this.attack(bot);
                    break;
                case 'retreat':
                    this.retreat(bot);
                    break;
                case 'reload':
                    this.reload(bot);
                    break;
            }
            
            this.checkVisibility(bot);
            this.checkHealth(bot);
        });
    }
    
    patrol(bot) {
        // Если нет пути, создаем новый
        if (bot.path.length === 0 || bot.currentPathIndex >= bot.path.length) {
            this.generatePath(bot);
        }
        
        // Движение по пути
        const target = bot.path[bot.currentPathIndex];
        const dx = target.x - bot.x;
        const dy = target.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 2;
        if (distance > 5) {
            bot.x += (dx / distance) * speed;
            bot.y += (dy / distance) * speed;
        } else {
            bot.currentPathIndex++;
        }
        
        // Случайный поиск врагов
        if (Math.random() < 0.01) {
            const enemy = this.findNearestEnemy(bot);
            if (enemy) {
                bot.target = enemy;
                bot.state = 'attack';
            }
        }
    }
    
    attack(bot) {
        if (!bot.target || bot.target.health <= 0) {
            bot.target = this.findNearestEnemy(bot);
            if (!bot.target) {
                bot.state = 'patrol';
                return;
            }
        }
        
        const dx = bot.target.x - bot.x;
        const dy = bot.target.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Движение к цели
        if (distance > 100) {
            const speed = 3;
            bot.x += (dx / distance) * speed;
            bot.y += (dy / distance) * speed;
        }
        
        // Стрельба
        if (distance < 300 && Date.now() - bot.lastShot > 1000 / bot.aggression) {
            this.shoot(bot);
            bot.lastShot = Date.now();
            
            // Шанс на перезарядку
            if (Math.random() < 0.1) {
                bot.state = 'reload';
                bot.reloadTime = 2000;
            }
        }
        
        // Отступление при низком здоровье
        if (bot.health < 30 && Math.random() < 0.05) {
            bot.state = 'retreat';
        }
    }
    
    retreat(bot) {
        // Движение от ближайшего врага
        const enemy = this.findNearestEnemy(bot);
        if (enemy) {
            const dx = bot.x - enemy.x;
            const dy = bot.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                const speed = 4;
                bot.x += (dx / distance) * speed;
                bot.y += (dy / distance) * speed;
            }
        }
        
        // Возврат к патрулированию после отступления
        if (bot.health > 50 || !enemy) {
            bot.state = 'patrol';
        }
    }
    
    reload(bot) {
        bot.reloadTime -= 16; // Примерно 60 FPS
        
        if (bot.reloadTime <= 0) {
            bot.state = 'attack';
        }
    }
    
    shoot(bot) {
        if (!bot.target) return;
        
        // Расчет точности
        const accuracyOffset = (1 - bot.accuracy) * 50;
        const offsetX = (Math.random() - 0.5) * accuracyOffset;
        const offsetY = (Math.random() - 0.5) * accuracyOffset;
        
        // Создание пули
        this.game.bullets.push({
            x: bot.x,
            y: bot.y,
            dx: (bot.target.x + offsetX - bot.x) / 10,
            dy: (bot.target.y + offsetY - bot.y) / 10,
            damage: 20 + Math.random() * 10,
            team: bot.team
        });
    }
    
    findNearestEnemy(bot) {
        let nearest = null;
        let minDistance = Infinity;
        
        // Поиск вражеских игроков
        if (this.game.player.team !== bot.team && this.game.player.health > 0) {
            const dist = this.distance(bot, this.game.player);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = this.game.player;
            }
        }
        
        // Поиск вражеских ботов
        this.bots.forEach(otherBot => {
            if (otherBot.team !== bot.team && otherBot.health > 0) {
                const dist = this.distance(bot, otherBot);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = otherBot;
                }
            }
        });
        
        return nearest;
    }
    
    checkVisibility(bot) {
        // Простая проверка видимости (в реальной игре нужен raycasting)
        const enemy = this.findNearestEnemy(bot);
        if (enemy && this.distance(bot, enemy) < 400) {
            if (Math.random() < 0.8) { // 80% шанс обнаружения
                bot.target = enemy;
                bot.state = 'attack';
            }
        }
    }
    
    checkHealth(bot) {
        // Поиск здоровья
        if (bot.health < 50) {
            // В реальной игре тут был бы поиск аптечек
            if (Math.random() < 0.01) {
                // Бот "находит" здоровье
                bot.health = Math.min(100, bot.health + 50);
            }
        }
    }
    
    generatePath(bot) {
        bot.path = [];
        bot.currentPathIndex = 0;
        
        // Создание случайного пути
        const points = 5;
        for (let i = 0; i < points; i++) {
            bot.path.push({
                x: Math.random() * this.game.canvas.width,
                y: Math.random() * this.game.canvas.height
            });
        }
    }
    
    distance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Методы для сложности игры
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.bots.forEach(bot => {
            bot.difficulty = difficulty;
            bot.accuracy = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.8;
            bot.reactionTime = difficulty === 'easy' ? 1000 : difficulty === 'medium' ? 500 : 200;
            bot.aggression = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.6 : 0.9;
        });
    }
    
    // Умные действия ботов
    performSmartAction(bot) {
        const actions = ['flank', 'camp', 'rush', 'defend'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        switch (action) {
            case 'flank':
                this.flank(bot);
                break;
            case 'camp':
                this.camp(bot);
                break;
            case 'rush':
                this.rush(bot);
                break;
            case 'defend':
                this.defend(bot);
                break;
        }
    }
    
    flank(bot) {
        // Обход с фланга
        const enemy = this.findNearestEnemy(bot);
        if (enemy) {
            const angle = Math.atan2(enemy.y - bot.y, enemy.x - bot.x);
            const flankAngle = angle + Math.PI / 2; // 90 градусов в сторону
            
            bot.path = [{
                x: enemy.x + Math.cos(flankAngle) * 200,
                y: enemy.y + Math.sin(flankAngle) * 200
            }];
            bot.currentPathIndex = 0;
            bot.state = 'patrol';
        }
    }
    
    camp(bot) {
        // Засада
        bot.state = 'attack';
        // Бот останется на месте и будет ждать
    }
    
    rush(bot) {
        // Быстрая атака
        const enemy = this.findNearestEnemy(bot);
        if (enemy) {
            bot.target = enemy;
            bot.state = 'attack';
            // Увеличение скорости для рывка
            // В реальной игре тут была бы временная модификация
        }
    }
    
    defend(bot) {
        // Защита позиции
        if (bot.team === 'defense') {
            // Выбор случайной точки для защиты
            const defensePoints = [
                { x: 100, y: 100 },
                { x: this.game.canvas.width - 100, y: 100 },
                { x: this.game.canvas.width / 2, y: this.game.canvas.height - 100 }
            ];
            
            const point = defensePoints[Math.floor(Math.random() * defensePoints.length)];
            bot.path = [point];
            bot.currentPathIndex = 0;
            bot.state = 'patrol';
        }
    }
}

// Экспорт для использования в основном game.js
if (typeof module !== 'undefined') {
    module.exports = BotAI;
}