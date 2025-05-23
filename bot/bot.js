require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Инициализация Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Обработка команды /start
bot.start((ctx) => {
  ctx.reply('Привет! Я бот Starship.');
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log('Bot started successfully');
  })
  .catch((err) => {
    console.error('Error starting bot:', err);
  });

// Включаем graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 