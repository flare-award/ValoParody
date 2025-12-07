import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Telegram Bot
    BOT_TOKEN = os.getenv("BOT_TOKEN", "8559181852:AAGgEo9Igy4EX9x9ANWLZVfBC3bSkL4vWnE")
    
    # Web App
    WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5000")
    
    # Игровые настройки
    MAX_PLAYERS = 10
    MAX_BOTS = 5
    ROUND_TIME = 105  # секунд
    BUY_TIME = 30    # секунд
    
    # Экономика
    WIN_REWARD = 3000
    LOSE_REWARD = 1900
    KILL_REWARD = 300
    ASSIST_REWARD = 150
    
    # Сложность
    BOT_DIFFICULTY = "medium"  # easy, medium, hard
    
    # База данных (если будет использоваться)
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///game.db")