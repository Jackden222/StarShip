const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const apiUrl = process.env.API_URL || 'http://localhost:3000'; // Используем переменную окружения API_URL

// Обработка пополнения баланса
bot.on('pre_checkout_query', async (query) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', query.from.id)
      .single();

    if (!user) {
      await bot.answerPreCheckoutQuery(query.id, false, 'Пользователь не найден');
      return;
    }

    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (error) {
    console.error('Error in pre_checkout_query:', error);
    await bot.answerPreCheckoutQuery(query.id, false, 'Произошла ошибка');
  }
});

bot.on('successful_payment', async (msg) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', msg.from.id)
      .single();

    if (!user) {
      await bot.sendMessage(msg.chat.id, 'Пользователь не найден');
      return;
    }

    const stars = msg.successful_payment.total_amount / 100; // Конвертируем копейки в рубли
    const amount = stars * 10; // 1 звезда = 10 рублей

    const response = await axios.post(`${apiUrl}/api/balance/transaction`, {
      userId: user.id,
      stars,
      amount
    });

    if (response.data) {
      await bot.sendMessage(
        msg.chat.id,
        `✅ Баланс успешно пополнен!\n\n` +
        `Звезды: ${stars}\n` +
        `Сумма: ${amount} ₽\n\n` +
        `Текущий баланс: ${user.balance + amount} ₽`
      );
    }
  } catch (error) {
    console.error('Error in successful_payment:', error);
    await bot.sendMessage(msg.chat.id, 'Произошла ошибка при пополнении баланса');
  }
});

// Создаем основное меню
const mainMenu = {
  keyboard: [
    ['💫 Пополнить баланс', '📱 Купить подписку'],
    ['❓ Помощь', '👤 Профиль']
  ],
  resize_keyboard: true
};

// Обработка команды start
bot.command('start', async (ctx) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', ctx.from.id)
      .single();

    if (!user) {
      await ctx.reply('Пользователь не найден');
      return;
    }

    await ctx.reply(
      `Добро пожаловать!\n\n` +
      `Ваш баланс: ${user.balance} ₽\n\n` +
      `Выберите действие:`,
      { reply_markup: mainMenu }
    );
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Произошла ошибка');
  }
});

// Обработка нажатия на кнопку Пополнить баланс
bot.hears('💫 Пополнить баланс', async (ctx) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', ctx.from.id)
      .single();

    if (!user) {
      await ctx.reply('Пользователь не найден');
      return;
    }

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '💫 10 звезд', callback_data: 'buy_stars_10' },
          { text: '💫 50 звезд', callback_data: 'buy_stars_50' }
        ],
        [
          { text: '💫 100 звезд', callback_data: 'buy_stars_100' }
        ]
      ]
    };

    await ctx.reply(
      `💰 Ваш текущий баланс: ${user.balance} ₽\n\n` +
      `Выберите количество звезд для пополнения:`,
      { reply_markup: inlineKeyboard }
    );
  } catch (error) {
    console.error('Error in balance button:', error);
    await ctx.reply('Произошла ошибка');
  }
});

// Обработка нажатия на кнопку Купить подписку
bot.hears('📱 Купить подписку', async (ctx) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', ctx.from.id)
      .single();

    if (!user) {
      await ctx.reply('Пользователь не найден');
      return;
    }

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '1 месяц - 299 ₽', callback_data: 'buy_sub_1' },
          { text: '3 месяца - 799 ₽', callback_data: 'buy_sub_3' }
        ],
        [
          { text: '6 месяцев - 1499 ₽', callback_data: 'buy_sub_6' }
        ]
      ]
    };

    await ctx.reply(
      `💰 Ваш текущий баланс: ${user.balance} ₽\n\n` +
      `Выберите тариф:`,
      { reply_markup: inlineKeyboard }
    );
  } catch (error) {
    console.error('Error in subscription button:', error);
    await ctx.reply('Произошла ошибка');
  }
});

// Обработка получения звезд
bot.on('message', async (ctx) => {
  if (ctx.message.star_count) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', ctx.from.id)
        .single();

      if (!user) {
        await ctx.reply('Пользователь не найден');
        return;
      }

      const stars = ctx.message.star_count;
      const amount = stars * 10; // 1 звезда = 10 рублей

      const response = await axios.post(`${apiUrl}/api/balance/transaction`, {
        userId: user.id,
        stars,
        amount
      });

      if (response.data) {
        await ctx.reply(
          `✅ Баланс успешно пополнен!\n\n` +
          `Звезды: ${stars}\n` +
          `Сумма: ${amount} ₽\n\n` +
          `Текущий баланс: ${user.balance + amount} ₽`
        );
      }
    } catch (error) {
      console.error('Error processing stars:', error);
      await ctx.reply('Произошла ошибка при пополнении баланса');
    }
  }
});

// Обработка покупки подписки
bot.action(/^buy_sub_(\d+)$/, async (ctx) => {
  try {
    const months = parseInt(ctx.match[1]);
    const prices = {
      1: 299,
      3: 799,
      6: 1499
    };
    const price = prices[months];

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', ctx.from.id)
      .single();

    if (!user) {
      await ctx.answerCbQuery('Пользователь не найден');
      return;
    }

    if (user.balance < price) {
      await ctx.answerCbQuery('Недостаточно средств');
      await ctx.reply(
        `❌ Недостаточно средств!\n\n` +
        `Ваш баланс: ${user.balance} ₽\n` +
        `Стоимость подписки: ${price} ₽\n\n` +
        `Пополните баланс для покупки подписки.`
      );
      return;
    }

    // Списываем средства
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: user.balance - price,
        subscription_end: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    await ctx.answerCbQuery('Подписка успешно оформлена');
    await ctx.reply(
      `✅ Подписка успешно оформлена!\n\n` +
      `Тариф: ${months} ${months === 1 ? 'месяц' : 'месяца'}\n` +
      `Сумма: ${price} ₽\n` +
      `Остаток баланса: ${user.balance - price} ₽\n\n` +
      `Подписка активна до: ${new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
    );
  } catch (error) {
    console.error('Error in subscription purchase:', error);
    await ctx.answerCbQuery('Произошла ошибка');
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('Bot started');
}).catch((err) => {
  console.error('Error starting bot:', err);
});

// Включаем graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 