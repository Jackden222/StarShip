#!/bin/bash

# Остановка процессов
pm2 stop all

# Получение последних изменений
git pull origin main

# Установка зависимостей API
cd /var/www/starship
npm install --production

# Сборка админки
cd admin-frontend
npm install
npm run build
cd ..

# Установка зависимостей бота
cd bot
npm install --production
cd ..

# Запуск процессов
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Перезапуск nginx
systemctl restart nginx