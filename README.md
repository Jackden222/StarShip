# StarShip VPN Bot

Telegram бот для управления VPN сервисом с админ-панелью.

## Функционал

- Telegram бот для управления VPN
- Админ-панель для мониторинга
- Интеграция с Supabase
- Платежи через CryptoBot и Telegram Stars

## Установка

```bash
# Установка зависимостей
npm install

# Запуск бота
npm run start:bot

# Запуск админ-панели
npm run start:admin

# Разработка
npm run dev
```

## Переменные окружения

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# CryptoBot
CRYPTO_BOT_TOKEN=your_cryptobot_token

# JWT
JWT_SECRET=your_jwt_secret
```

## Деплой

Проект настроен для деплоя на Render.com:

- Web Service: Админ-панель
- Worker: Telegram бот 