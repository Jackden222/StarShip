#!/bin/bash

# Создаем структуру на сервере
mkdir -p /var/www/starshipvpn/{api,admin,bot}

# Копируем файлы
cp -r src/* /var/www/starshipvpn/api/
cp -r admin-frontend/* /var/www/starshipvpn/admin/
cp -r bot/* /var/www/starshipvpn/bot/

# Устанавливаем зависимости
cd /var/www/starshipvpn/api
npm install --production

cd /var/www/starshipvpn/admin
npm install
npm run build

cd /var/www/starshipvpn/bot
npm install --production

# Запускаем через PM2
pm2 start /var/www/starshipvpn/api/src/index.js --name "starshipvpn-api"
pm2 start /var/www/starshipvpn/bot/index.js --name "starshipvpn-bot"