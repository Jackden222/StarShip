const TelegramBot = require('node-telegram-bot-api');
const supabase = require('../config/supabase');
const outline = require('../outline/api');
const path = require('path');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Курс: 1 звезда = 2 рубля
// const STAR_RATE = 2;

// CryptoBot константы
const CRYPTO_BOT_TOKEN = process.env.CRYPTO_BOT_TOKEN;
const CRYPTO_BOT_ASSET = 'USDT';
const CRYPTO_BOT_NETWORK = 'TRC20';
const CRYPTO_BOT_AMOUNTS = [
  { rub: 180, usdt: 2.4, bonus: 7 },
  { rub: 450, usdt: 5.7, bonus: 15 },
  { rub: 850, usdt: 11, bonus: 30 }
];

// Маппинг: код страны -> эмодзи (можно менять вручную)
const countryEmojis = {
  RU: '🇷🇺',
  UA: '🇺🇦',
  US: '🇺🇸',
  DE: '🇩🇪',
  NL: '🇳🇱',
  FR: '🇫🇷',
  // Добавь свои страны и эмодзи ниже
  // 'CN': '🇨🇳',
  // 'KZ': '🇰🇿',
};

let botUsername = '';
bot.getMe().then(me => { botUsername = me.username; });

// Обработка команды /start
bot.onText(/\/start(?:\s+ref[_-]?([\w-]+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const refId = match[1] ? (match[1].startsWith('ad-') ? match[1] : match[1]) : null;

  // Если это рекламная ссылка
  if (refId && refId.startsWith('ad-')) {
    try {
      await fetch('http://localhost:3000/api/ad-ref-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrer_id: refId })
      });
    } catch (e) {
      // Не критично, если не удалось отправить
    }
  }

  // Проверяем существование пользователя
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', userId)
    .single();
  if (!user) {
    let referred_by = null;
    if (refId && !refId.startsWith('ad-')) {
      // Получаем пригласившего
      const { data: refUser } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', refId)
        .single();
      if (refUser) referred_by = refUser.id;
    }
    // Создаём пользователя
    const { data: newUser } = await supabase
      .from('users')
      .insert([
        {
          telegram_id: userId,
          username: msg.from.username,
          subscription_end: null,
          referred_by,
          ad_ref_id: refId && refId.startsWith('ad-') ? refId : null,
          country: msg.from.language_code || null
        }
      ])
      .select()
      .single();
    user = newUser;
    // Записываем в referrals
    if (referred_by) {
      await supabase.from('referrals').insert([
        { referrer_id: referred_by, referred_id: user.id }
      ]);
    }
    // Если это рекламная ссылка, увеличиваем registrations
    if (refId && refId.startsWith('ad-')) {
      const { data: adData, error: adErr } = await supabase
        .from('ad_ref_links')
        .select('registrations')
        .eq('referrer_id', refId)
        .single();
      if (!adErr && adData) {
        await supabase
          .from('ad_ref_links')
          .update({ registrations: (adData.registrations || 0) + 1 })
          .eq('referrer_id', refId);
      }
    }
  } else if (!user.country && msg.from.language_code) {
    // Если пользователь уже есть, но страна не указана — обновляем
    await supabase
      .from('users')
      .update({ country: msg.from.language_code })
      .eq('id', user.id);
  }

  const welcomeText = `<b>Привет,</b> 👋\n\n` +
    '💻 Добро пожаловать в StarShip VPN!:\n\n' +
    '🎁 <b>Твой промокод на 3 дня бесплатного тестирования: <code>Star</code></b>\n\n' +
    '✅ До 3 устройств на 1 подписку\n' +
    '📺 YouTube без рекламы — смотри ролики без прерываний и блокировок\n' +
    '🌍 Доступ ко всем сайтам — никаких блокировок, где бы вы ни находились.\n' +
    '🚫 Никаких ограничений скорости — полная свобода в интернете на максимальной скорости.\n' +
    '⚙️ Быстрое подключение — легко настроить за 1 минуту на iPhone, Android, ПК, и macOS.\n' +
    '🔒 Конфиденциальность и безопасность.\n' +
    '💵 Всего 180₽ в месяц — без скрытых платежей и рекламы.\n' +
    '💳 Не принимаем платежи напрямую по карте для безопасности ваших данных.\n\n' +
    '🔌Наш VPN доступен на Iphone, Android, ПК, macOS в виде приложения.';

  // Отправляем фото с подписью
  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: welcomeText,
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        ['💳 Купить/Продлить'],
        ['💸 Пополнить баланс', '🎁 Промокод', '📅 Действие подписки'],
        ['🌐 Выбрать сервер', '📖 Инструкция', '💬 Помощь'],
        ['🔑 Мои ключи', '👥 Пригласить друга']
      ],
      resize_keyboard: true
    }
  }, {
    contentType: 'image/png'
  });
});

// Обработка кнопки "Выбрать сервер"
bot.onText(/Выбрать сервер/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // Получаем пользователя
  const { data: user } = await supabase
    .from('users')
    .select('id, subscription_end')
    .eq('telegram_id', userId)
    .single();
  if (!user) {
    bot.sendMessage(chatId, 'Ошибка: пользователь не найден.');
    return;
  }
  // Проверяем активность подписки
  const now = new Date();
  if (!user.subscription_end || new Date(user.subscription_end) < now) {
    bot.sendMessage(chatId, 'У вас нет активной подписки. Продлите подписку для выбора сервера.');
    return;
  }
  // Получаем список серверов
  const { data: servers } = await supabase
    .from('servers')
    .select('id, country, status')
    .eq('status', 'online');
  if (!servers || servers.length === 0) {
    bot.sendMessage(chatId, 'Нет доступных серверов. Попробуйте позже.');
    return;
  }
  bot.sendMessage(chatId, 'Выберите сервер:', {
    reply_markup: {
      inline_keyboard: servers.map(s => [{
        text: `${countryEmojis[s.country] || ''} ${s.country}`.trim(),
        callback_data: `server_${s.id}`
      }])
    }
  });
});

// Выбор сервера после тарифа
const userSubChoice = {};
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const userId = query.from.id;

  // Если выбран тариф — показываем список серверов
  if (data.startsWith('sub_')) {
    const months = parseInt(data.split('_')[1]);
    userSubChoice[userId] = { months };
    // Получаем список серверов
    const { data: servers } = await supabase
      .from('servers')
      .select('id, country, status')
      .eq('status', 'online');
    if (!servers || servers.length === 0) {
      bot.sendMessage(chatId, 'Нет доступных серверов. Попробуйте позже.');
      return;
    }
    bot.sendMessage(chatId, 'Выберите сервер:', {
      reply_markup: {
        inline_keyboard: servers.map(s => [{
          text: `${countryEmojis[s.country] || ''} ${s.country}`.trim(),
          callback_data: `server_${s.id}`
        }])
      }
    });
    return;
  }

  // Если выбран сервер — выдаём ключ
  if (data.startsWith('server_')) {
    const serverId = data.replace('server_', '');
    // Получаем пользователя
    const { data: user } = await supabase
      .from('users')
      .select('id, subscription_end')
      .eq('telegram_id', userId)
      .single();
    if (!user) {
      bot.sendMessage(chatId, 'Ошибка: пользователь не найден.');
      return;
    }
    // Проверяем активность подписки
    const now = new Date();
    if (!user.subscription_end || new Date(user.subscription_end) < now) {
      bot.sendMessage(chatId, 'У вас нет активной подписки. Продлите подписку для получения ключа.');
      return;
    }
    // Удаляем все старые ключи пользователя
    await supabase.from('outline_keys').delete().eq('user_id', user.id);
    // Получаем сервер
    const { data: server } = await supabase
      .from('servers')
      .select('*')
      .eq('id', serverId)
      .single();
    if (!server) {
      bot.sendMessage(chatId, 'Сервер не найден.');
      return;
    }
    // Проверяем лимит ключей
    const { count: keysCount, error: keysCountError } = await supabase
      .from('outline_keys')
      .select('id', { count: 'exact', head: true })
      .eq('server_id', server.id);
    if (keysCountError) {
      bot.sendMessage(chatId, 'Ошибка проверки лимита ключей. Попробуйте позже.');
      return;
    }
    if (server.max_keys && keysCount >= server.max_keys) {
      bot.sendMessage(chatId, `⚠️ Сервер ${server.name} (${server.country}) перегружен.\n\n ⚙️ Наша команда уже работает над расширением сервера\n\n 🌍 Пожалуйста, выберите другой сервер.`);
      return;
    }
    // Динамически создаём Outline API клиент
    const OutlineApi = require('../outline/api');
    const outline = OutlineApi.createInstance(server.api_url, server.cert_sha256);
    try {
      const key = await outline.createKey();
      // Сохраняем ключ в outline_keys
      const { error } = await supabase.from('outline_keys').insert([
        {
          user_id: user.id,
          outline_key_id: key.id,
          access_url: key.accessUrl,
          server_id: server.id
        }
      ]);
      if (error) {
        console.error('Ошибка при добавлении ключа:', error.message);
        bot.sendMessage(chatId, 'Ошибка при сохранении ключа. Обратитесь в поддержку.');
        return;
      }
      bot.sendMessage(chatId, `Ваш VPN ключ для сервера ${server.name} ${server.country}:\n\n<code>${key.accessUrl}</code>`, {
        parse_mode: 'HTML'
      });
    } catch (e) {
      bot.sendMessage(chatId, 'Ошибка при выдаче ключа. Попробуйте позже.');
    }
    return;
  }

  // Инструкция по отправке звёзд
  if (data.startsWith('manual_star_topup_')) {
    const stars = Number(data.replace('manual_star_topup_', ''));
    bot.sendMessage(chatId, `Для пополнения баланса отправьте боту ${stars} звёзд через Telegram Stars (кнопка 💫 внизу чата). После получения звёзд баланс будет пополнен на ${stars * STAR_RATE}₽.`);
    bot.answerCallbackQuery(query.id);
    return;
  }

  // Обработка выбора сервера через inline_keyboard
  if (data === 'choose_server_list') {
    // Получаем пользователя
    const { data: user } = await supabase
      .from('users')
      .select('id, subscription_end')
      .eq('telegram_id', userId)
      .single();
    if (!user) {
      bot.sendMessage(chatId, 'Ошибка: пользователь не найден.');
      return;
    }
    // Проверяем активность подписки
    const now = new Date();
    if (!user.subscription_end || new Date(user.subscription_end) < now) {
      bot.sendMessage(chatId, 'У вас нет активной подписки. Продлите подписку для выбора сервера.');
      return;
    }
    // Получаем список серверов
    const { data: servers } = await supabase
      .from('servers')
      .select('id, name, country, status')
      .eq('status', 'online');
    if (!servers || servers.length === 0) {
      bot.sendMessage(chatId, 'Нет доступных серверов. Попробуйте позже.');
      return;
    }
    bot.sendMessage(chatId, 'Выберите сервер:', {
      reply_markup: {
        inline_keyboard: servers.map(s => [{
          text: `${countryEmojis[s.country] || ''} ${s.country}`.trim(),
          callback_data: `server_${s.id}`
        }])
      }
    });
    return;
  }
});

// Обработка получения звёзд и других сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Обработка звёзд
  if (msg.star_count) {
    console.log('Получены звёзды:', {
      star_count: msg.star_count,
      raw_message: msg
    });

    const stars = Number(msg.star_count);
    const rub = Number(stars) * Number(STAR_RATE);

    console.log('Расчёт суммы:', {
      stars,
      STAR_RATE,
      rub,
      isNaN_stars: isNaN(stars),
      isNaN_rub: isNaN(rub)
    });

    if (isNaN(stars) || isNaN(rub)) {
      console.error('Ошибка расчёта:', { stars, rub });
      bot.sendMessage(chatId, 'Ошибка: не удалось определить сумму пополнения. Обратитесь в поддержку.');
      return;
    }

    try {
      // Обновляем баланс пользователя
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('telegram_id', userId)
        .single();

      if (userError) {
        console.error('Ошибка получения пользователя:', userError);
        throw userError;
      }

      console.log('Текущий баланс:', user?.balance);

      const newBalance = Number(user?.balance || 0) + rub;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('telegram_id', userId);

      if (updateError) {
        console.error('Ошибка обновления баланса:', updateError);
        throw updateError;
      }

      console.log('Баланс обновлён:', { newBalance });

      bot.sendMessage(chatId, `✅ Баланс пополнен на ${rub}₽ через Telegram Stars (получено ${stars} звёзд).\nТекущий баланс: ${newBalance}₽`);
    } catch (error) {
      console.error('Ошибка при пополнении баланса:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при пополнении баланса. Обратитесь в поддержку.');
    }
    return;
  }

  // Обработка вопроса в техподдержку
  if (supportInputState[chatId] && msg.text && !msg.text.startsWith('/')) {
    const question = msg.text.trim();
    supportInputState[chatId] = false;
    
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', userId)
        .single();
        
      if (!user) {
        bot.sendMessage(chatId, 'Пользователь не найден.');
        return;
      }
      
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          question,
          status: 'open'
        }]);
        
      if (error) {
        console.error('Ошибка создания тикета:', error);
        bot.sendMessage(chatId, 'Произошла ошибка при отправке вопроса. Попробуйте позже.');
        return;
      }
      
      bot.sendMessage(chatId, 'Ваш вопрос отправлен в техподдержку. Мы ответим вам в ближайшее время.');
    } catch (error) {
      console.error('Ошибка в техподдержке:', error);
      bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
    }
    return;
  }

  // Обработка промокодов
  if (promoInputState[chatId] && msg.text && !msg.text.startsWith('/')) {
    const code = msg.text.trim();
    promoInputState[chatId] = false;
    // Получаем пользователя
    const { data: user } = await supabase
      .from('users')
      .select('id, subscription_end')
      .eq('telegram_id', userId)
      .single();
    if (!user) {
      bot.sendMessage(chatId, 'Пользователь не найден.');
      return;
    }
    // Проверяем промокод
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();
    if (!promo) {
      bot.sendMessage(chatId, 'Промокод не найден или неактивен.');
      return;
    }
    // Проверяем ограничения
    const now = new Date();
    if (promo.expires_at && new Date(promo.expires_at) < now) {
      bot.sendMessage(chatId, 'Срок действия промокода истек.');
      return;
    }
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      bot.sendMessage(chatId, 'Промокод больше не действителен - достигнут лимит использований.');
      return;
    }
    // Проверяем, использовал ли уже этот пользователь этот промокод
    const { data: used } = await supabase
      .from('used_promo_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('promo_id', promo.id)
      .single();
    if (used) {
      bot.sendMessage(chatId, 'Вы уже использовали этот промокод.');
      return;
    }
    // Начисляем дни
    let newDate = new Date();
    if (user.subscription_end && new Date(user.subscription_end) > newDate) {
      newDate = new Date(user.subscription_end);
    }
    newDate.setDate(newDate.getDate() + promo.days);
    await supabase.from('users').update({ subscription_end: newDate.toISOString() }).eq('id', user.id);
    await supabase.from('used_promo_codes').insert([{ user_id: user.id, promo_id: promo.id }]);
    // Увеличиваем счетчик использований
    await supabase
      .from('promo_codes')
      .update({ 
        used_count: promo.used_count + 1,
        is_active: !promo.max_uses || promo.used_count + 1 < promo.max_uses
      })
      .eq('id', promo.id);
    bot.sendMessage(chatId, `Промокод успешно активирован! Подписка продлена до ${newDate.toLocaleString()}`);
  }
});

const promoInputState = {};

bot.onText(/Промокод/, async (msg) => {
  const chatId = msg.chat.id;
  promoInputState[chatId] = true;
  bot.sendMessage(chatId, 'Введите промокод:');
});

const supportInputState = {};

bot.onText(/Помощь/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Проверяем существование пользователя
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', userId)
    .single();
    
  if (!user) {
    bot.sendMessage(chatId, 'Пожалуйста, сначала нажмите /start');
    return;
  }
  
  supportInputState[chatId] = true;
  bot.sendMessage(chatId, 'Опишите ваш вопрос, и мы ответим вам в ближайшее время:');
});

// Покупка подписки за рубли и звёзды
bot.onText(/Купить\/Продлить/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('telegram_id', userId)
    .single();
  const tariffs = [
    { months: 1, price: 180, stars: 100 },
    { months: 3, price: 450, stars: 250 },
    { months: 6, price: 850, stars: 750 }
  ];
  const text = `
  💳 <b>🚀 Тарифы:</b>\n
  <b>✨ 1 месяц</b> - 180₽
  <b>✨ 3 месяца</b> - 450₽ (экономия 90₽)
  <b>✨ 6 месяцев</b> - 850₽ (экономия 250₽)\n
  <b>🔒 В подписку включено:</b>\n
  <b>• YouTube без рекламы</b>
  <b>• Высокая скорость</b>
  <b>• Локации: 🇳🇱 🇫🇷 🇸🇬 🇩🇪 </b>
  <b>• Поддержка 24/7</b>\n
  <b>🔹 Как пополнить баланс:</b>\n
  1️⃣ Пополните баланс через Stars или USDT
  2️⃣ Откройте раздел <b>«Пополнить баланс»</b>, выберите сумму пополнения и оплатите баланс поступит автоматически\n\n
  <b>🎯 Выберите тариф:</b>`;
  
  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [tariffs.map(t => ({ text: `${t.months} мес. - ${t.price}₽`, callback_data: `buy_sub_rub_${t.months}` }))]
    }
  }, {
    contentType: 'image/png'
  });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  if (query.data.startsWith('buy_sub_rub_')) {
    const months = Number(query.data.replace('buy_sub_rub_', ''));
    const prices = { 1: 180, 3: 450, 6: 850 };
    const price = prices[months];
    const { data: user } = await supabase
      .from('users')
      .select('balance, subscription_end')
      .eq('telegram_id', userId)
      .single();
    if (!user || (user.balance || 0) < price) {
      bot.sendMessage(chatId, `❌ Недостаточно средств. Необходимо ${price}₽, у вас ${user?.balance || 0}₽.`);
      bot.answerCallbackQuery(query.id);
      return;
    }
    // Списываем средства и продлеваем подписку
    let newDate = new Date();
    if (user.subscription_end && new Date(user.subscription_end) > newDate) {
      newDate = new Date(user.subscription_end);
    }
    newDate.setMonth(newDate.getMonth() + months);
    await supabase
      .from('users')
      .update({
        balance: user.balance - price,
        subscription_end: newDate.toISOString()
      })
      .eq('telegram_id', userId);
    // Если пользователь зарегистрирован по рекламной ссылке, увеличиваем paid
    const { data: regUser } = await supabase
      .from('users')
      .select('referred_by, ad_ref_id')
      .eq('telegram_id', userId)
      .single();
    if (regUser && regUser.referred_by === null && regUser.ad_ref_id) {
      const { data: adRef } = await supabase
        .from('ad_ref_links')
        .select('referrer_id, paid')
        .eq('referrer_id', regUser.ad_ref_id)
        .single();
      if (adRef) {
        await supabase
          .from('ad_ref_links')
          .update({ paid: (adRef.paid || 0) + 1 })
          .eq('referrer_id', adRef.referrer_id);
      }
    }
    bot.sendMessage(chatId, `✅ Подписка оформлена на ${months} мес.\nСписано: ${price}₽\nОстаток: ${user.balance - price}₽\nДействует до: ${newDate.toLocaleDateString()}`);
    bot.answerCallbackQuery(query.id);
    return;
  }
  if (query.data.startsWith('copy_key_')) {
    const keyIndex = Number(query.data.replace('copy_key_', ''));
    // Получаем пользователя
    const { data: user } = await supabase
      .from('users')
      .select('id, subscription_end')
      .eq('telegram_id', userId)
      .single();
    if (!user) {
      bot.answerCallbackQuery(query.id, { text: 'Пользователь не найден', show_alert: true });
      return;
    }

    // Проверяем активность подписки
    const now = new Date();
    if (!user.subscription_end || new Date(user.subscription_end) < now) {
      bot.answerCallbackQuery(query.id, { text: '⚠️ У вас нет активной подписки', show_alert: true });
      return;
    }

    // Получаем ключи пользователя
    const { data: keys } = await supabase
      .from('outline_keys')
      .select('access_url')
      .eq('user_id', user.id);
    if (!keys || !keys[keyIndex]) {
      bot.answerCallbackQuery(query.id, { text: 'Ключ не найден', show_alert: true });
      return;
    }
    bot.answerCallbackQuery(query.id, { text: 'Ключ скопирован!', show_alert: false });
    bot.sendMessage(chatId, `🔑 <b>Ваш VPN ключ:</b>\n<code>${keys[keyIndex].access_url}</code>`, { parse_mode: 'HTML' });
    return;
  }
  // ... остальные обработчики ...
});

// Обработка кнопки 'Действие подписки' (и убираю Баланс)
bot.onText(/^📅 Действие подписки$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // Получаем пользователя
  const { data: user } = await supabase
    .from('users')
    .select('balance, subscription_end')
    .eq('telegram_id', userId)
    .single();
  let text = `💰 Ваш баланс: <b>${user?.balance || 0}₽</b>\n`;
  if (!user || !user.subscription_end) {
    text += '\n⏳ У вас нет активной подписки.';
  } else {
    const end = new Date(user.subscription_end);
    const now = new Date();
    if (end < now) {
      text += `\n⏳ Ваша подписка истекла.`;
    } else {
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      text += `\n⏳ Подписка до: <b>${end.toLocaleString()}</b>\nОсталось дней: <b>${daysLeft}</b>`;
    }
  }

  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: text,
    parse_mode: 'HTML'
  }, {
    contentType: 'image/png'
  });
});

// Пригласить друга (реферальная ссылка)
bot.onText(/Пригласить друга/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Получаем статистику рефералов
  const { data: user } = await supabase
    .from('users')
    .select('referral_count, referral_earnings, balance')
    .eq('telegram_id', userId)
    .single();
    
  const refLink = `https://t.me/${botUsername}?start=ref_${userId}`;
  
  const message = `🎯 <b>Реферальная программа</b>\n\n` +
    `💰 За каждого приглашенного пользователя который оформил подписку начисляется <b>10 рублей</b> на баланс.\n` +
    `⚡️ Начисление происходит автоматически\n\n` +
    `📊 <b>Ваша статистика:</b>\n` +
    `👥 Рефералов: <b>${user?.referral_count || 0}</b>\n` +
    `💎 Суммарный доход: <b>${user?.referral_earnings || 0} рублей</b>\n\n` +
    `🔗 <b>Ваша реферальная ссылка:</b>\n` +
    `<code>${refLink}</code>`;
  
  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: message,
    parse_mode: 'HTML'
  }, {
    contentType: 'image/png'
  });
});

// Пополнить баланс — выбор способа
bot.onText(/Пополнить баланс/, async (msg) => {
  const chatId = msg.chat.id;
  const text = 
    '💫 <b>Пополнение баланса</b>\n\n' +
    '🎁 <b>Бонусы за пополнение USDT:</b>\n' +
    '└ 180 рублей + 7 дней бесплатно\n' +
    '└ 260 рублей + 15 дней бесплатно\n' +
    '└ 430 рублей + 30 дней бесплатно\n\n' +
    '💳 <b>Способ 1: USDT (CryptoBot)</b>\n' +
    '1️⃣ Нажмите "CryptoBot (USDT)"\n' +
    '2️⃣ Выберите сумму пополнения\n' +
    '3️⃣ Нажмите "Оплатить"\n' +
    '4️⃣ После оплаты баланс пополнится автоматически\n\n' +
    '⭐ <b>Способ 2: Telegram Stars (Карта)</b>\n' +
    '1️⃣ Откройте официального бота Telegram @PremiumBot\n' +
    '2️⃣ Через меню выберите /stars\n' +
    '3️⃣ Нажмите "Купить звезды"\n' +
    '4️⃣ Выберите количество и оплатите\n' +
    '5️⃣ Вернитесь в бота и нажмите способ пополнения "Telegram Stars"';

  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'CryptoBot (USDT)', callback_data: 'topup_cryptobot' },
          { text: '⭐ Telegram Stars', callback_data: 'topup_stars' }
        ]
      ]
    }
  }, {
    contentType: 'image/png'
  });
});

const STARS_PACKS = [
  { rub: 180, stars: 100, label: '⭐ 100 Stars - 180₽' },
  { rub: 450, stars: 250, label: '⭐ 250 Stars - 450₽' },
  { rub: 850, stars: 750, label: '⭐ 750 Stars - 850₽' }
];

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  
  if (query.data === 'topup_cryptobot') {
    bot.sendMessage(chatId, 'Выберите сумму пополнения:', {
      reply_markup: {
        inline_keyboard: CRYPTO_BOT_AMOUNTS.map(p => [{
          text: `${p.rub}₽ (${p.usdt} USDT) + ${p.bonus} дней бонус`,
          callback_data: `cryptobot_amount_${p.rub}`
        }])
      }
    });
    return;
  }

  if (query.data.startsWith('cryptobot_amount_')) {
    const rub = Number(query.data.replace('cryptobot_amount_', ''));
    const amount = CRYPTO_BOT_AMOUNTS.find(p => p.rub === rub);
    
    if (!amount) {
      bot.sendMessage(chatId, 'Ошибка: сумма не найдена');
      return;
    }

    try {
      // Создаем инвойс через CryptoBot API
      const response = await fetch('https://pay.crypt.bot/api/createInvoice', {
        method: 'POST',
        headers: {
          'Crypto-Pay-API-Token': CRYPTO_BOT_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: CRYPTO_BOT_ASSET,
          amount: amount.usdt,
          network: CRYPTO_BOT_NETWORK,
          description: `Пополнение баланса на ${rub}₽`,
          paid_btn_name: 'callback',
          paid_btn_url: `https://t.me/${botUsername}?start=paid_${rub}_${userId}`,
          allow_comments: false,
          allow_anonymous: false,
          payload: `cryptobot_topup_${rub}_${userId}_${Date.now()}`
        })
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error);
      }

      // Отправляем пользователю ссылку на оплату
      bot.sendMessage(chatId, 
        `💳 Оплата ${amount.usdt} USDT (${rub}₽)\n\n` +
        `1️⃣ Перейдите по ссылке для оплаты:\n` +
        `<a href="${data.result.pay_url}">Оплатить ${amount.usdt} USDT</a>\n\n` +
        `2️⃣ После оплаты баланс будет пополнен автоматически.\n\n` +
        `⚠️ Внимание: оплата принимается только в сети ${CRYPTO_BOT_NETWORK}`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

    } catch (error) {
      console.error('CryptoBot error:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при создании платежа. Попробуйте позже.');
    }
    return;
  }

  if (query.data === 'topup_stars') {
    bot.sendMessage(chatId, 'Выберите сумму пополнения:', {
      reply_markup: {
        inline_keyboard: STARS_PACKS.map(p => [{
          text: p.label,
          callback_data: `stars_amount_${p.rub}`
        }])
      }
    });
    return;
  }
  if (query.data.startsWith('stars_amount_')) {
    const rub = Number(query.data.replace('stars_amount_', ''));
    const pack = STARS_PACKS.find(p => p.rub === rub);
    if (!pack) {
      bot.sendMessage(chatId, 'Ошибка: сумма не найдена');
      return;
    }
    const payload = `stars_topup_${pack.stars}_${userId}_${Date.now()}`;
    bot.sendInvoice(
      chatId,
      'Пополнение баланса',
      `Пополнение баланса на ${pack.stars} звёзд через Telegram Stars.`,
      payload,
      '', // provider_token пустой для digital goods
      'XTR',
      [{ label: `Пополнение на ${pack.stars} звёзд`, amount: pack.stars }],
      {
        need_name: false,
        need_phone_number: false,
        need_email: false,
        is_flexible: false
      }
    );
    return;
  }
  // ... остальные обработчики ...
});

// Обработка успешной оплаты Stars
bot.on('successful_payment', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const payload = msg.successful_payment.invoice_payload;

  try {
    // payload: stars_topup_<stars>_<userId>_<timestamp>
    if (payload && payload.startsWith('stars_topup_')) {
      const parts = payload.split('_');
      const stars = Number(parts[2]);
      
      // Находим соответствующий пакет
      const pack = STARS_PACKS.find(p => p.stars === stars);
      if (!pack) {
        throw new Error(`Неизвестный пакет звезд: ${stars}`);
      }

      // Проверяем, не был ли уже обработан этот платеж
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('invoice_payload', payload)
        .single();

      if (existingPayment) {
        bot.sendMessage(chatId, 'Этот платеж уже был обработан ранее.');
        return;
      }

      // Обновляем баланс
      const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('telegram_id', userId)
        .single();

      const newBalance = (user?.balance || 0) + pack.rub;

      // Сохраняем информацию о платеже
      await supabase.from('payments').insert([{
        user_id: userId,
        amount: pack.rub,
        stars: stars,
        invoice_payload: payload,
        status: 'completed',
        created_at: new Date().toISOString()
      }]);

      // Обновляем баланс пользователя
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('telegram_id', userId);

      bot.sendMessage(chatId, `✅ Баланс пополнен на ${pack.rub}₽ через Telegram Stars (получено ${stars} звёзд).\nТекущий баланс: ${newBalance}₽`);
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Сохраняем информацию об ошибке
    await supabase.from('payment_errors').insert([{
      user_id: userId,
      invoice_payload: payload,
      error_message: error.message,
      created_at: new Date().toISOString()
    }]);

    // Отправляем сообщение пользователю
    bot.sendMessage(chatId, 
      '⚠️ Произошла ошибка при обработке платежа.\n\n' +
      'Не волнуйтесь, ваши средства в безопасности. Мы автоматически обработаем платеж в ближайшее время.\n\n' +
      'Если баланс не пополнится в течение 5 минут, обратитесь в поддержку.'
    );
  }
});

// Добавляем обработчик ошибок платежа
bot.on('pre_checkout_query', async (query) => {
  try {
    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (error) {
    console.error('Pre-checkout error:', error);
    await bot.answerPreCheckoutQuery(query.id, false, 'Произошла ошибка при проверке платежа. Попробуйте позже.');
  }
});

// Обработка кнопки "Инструкция"
bot.onText(/^📖 Инструкция$/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: 'Выберите ваше устройство:',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Android', callback_data: 'howto_android' },
          { text: 'PC', callback_data: 'howto_pc' },
          { text: 'iOS', callback_data: 'howto_ios' }
        ]
      ]
    }
  });
});

// Инструкции для устройств
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  if (query.data === 'howto_android') {
    bot.sendMessage(chatId,
      '<b>Инструкция для Android:</b>\n\n' +
      '1. Скачайте приложение Outline из Google Play\n' +
      '2. Запустите приложение и нажмите «Добавить ключ» или «+»\n' +
      '3. Вставьте ваш VPN-ключ, который вы получили в боте\n' +
      '4. Подключитесь к серверу — готово!',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Скачать в Google Play', url: 'https://play.google.com/store/apps/details?id=org.outline.android.client' }
            ]
          ]
        }
      }
    );
    return;
  }
  if (query.data === 'howto_pc') {
    bot.sendMessage(chatId,
      '<b>Инструкция для ПК (Windows/Mac/Linux):</b>\n\n' +
      '1. Скачайте Outline Client\n' +
      '2. Установите и запустите программу\n' +
      '3. Нажмите «Добавить сервер» или «+»\n' +
      '4. Вставьте ваш VPN-ключ из бота\n' +
      '5. Подключитесь к серверу — готово!',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Скачать Outline', url: 'https://getoutline.org/ru/get-started/' }
            ]
          ]
        }
      }
    );
    return;
  }
  if (query.data === 'howto_ios') {
    bot.sendMessage(chatId,
      '<b>Инструкция для iOS:</b>\n\n' +
      '1. Скачайте Outline из App Store\n' +
      '2. Откройте приложение и нажмите «Добавить ключ» или «+»\n' +
      '3. Вставьте ваш VPN-ключ из бота\n' +
      '4. Подключитесь к серверу — готово!',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Скачать в App Store', url: 'https://apps.apple.com/app/outline-app/id1356177741' }
            ]
          ]
        }
      }
    );
    return;
  }
  // ... остальные обработчики ...
});

// Обработка кнопки "Мои ключи"
bot.onText(/^🔑 Мои ключи$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Получаем пользователя
  const { data: user } = await supabase
    .from('users')
    .select('id, subscription_end')
    .eq('telegram_id', userId)
    .single();

  if (!user) {
    bot.sendMessage(chatId, 'Пользователь не найден. Нажмите /start');
    return;
  }

  // Проверяем активность подписки
  const now = new Date();
  if (!user.subscription_end || new Date(user.subscription_end) < now) {
    bot.sendMessage(chatId, '⚠️ У вас нет активной подписки. Продлите подписку для использования VPN.');
    return;
  }

  // Получаем ключи пользователя с информацией о серверах
  const { data: keys } = await supabase
    .from('outline_keys')
    .select(`
      id,
      access_url,
      server:servers (
        name,
        country
      )
    `)
    .eq('user_id', user.id);

  if (!keys || keys.length === 0) {
    bot.sendMessage(chatId, 'У вас пока нет активных ключей. Купите подписку и выберите сервер.');
    return;
  }

  // Формируем сообщение с ключами
  let message = '🔑 <b>Ваши VPN ключи:</b>\n\n';
  keys.forEach((key, index) => {
    message += `${index + 1}. ${key.server.country}\n\n`;
    message += `<code>${key.access_url}</code>\n\n`;
  });

  bot.sendPhoto(chatId, path.join(__dirname, 'assets', 'photo.png'), {
    caption: message,
    parse_mode: 'HTML'
  }, {
    contentType: 'image/png'
  });
});

// Обработка успешной оплаты через CryptoBot (USDT)
bot.onText(/\/start paid_(\d+)_(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const rub = Number(match[1]);
  // Находим бонус по сумме
  const amount = CRYPTO_BOT_AMOUNTS.find(p => p.rub === rub);
  if (!amount) return;
  // Генерируем уникальный промокод
  const code = `BONUS-${userId}-${Date.now().toString(36).toUpperCase()}`;
  // Сохраняем промокод
  await supabase.from('promo_codes').insert([{
    code,
    days: amount.bonus,
    is_active: true,
    is_auto_generated: true,
    created_at: new Date().toISOString(),
    max_uses: 1,
    used_count: 0,
    user_id: userId
  }]);
  // Отправляем пользователю
  bot.sendMessage(chatId, `🎁 Ваш бонусный промокод на ${amount.bonus} дней:\n<code>${code}</code>\n\nАктивируйте его в разделе "Промокод"!`, { parse_mode: 'HTML' });
});

// Функция проверки и отправки уведомлений об окончании подписки
async function checkSubscriptionExpiration() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Получаем пользователей с истекающей подпиской
    const { data: expiringUsers } = await supabase
      .from('users')
      .select('telegram_id, subscription_end')
      .lt('subscription_end', tomorrow)
      .gt('subscription_end', now);

    if (expiringUsers) {
      for (const user of expiringUsers) {
        const endDate = new Date(user.subscription_end);
        const hoursLeft = Math.ceil((endDate - now) / (1000 * 60 * 60));
        
        if (hoursLeft <= 24) {
          bot.sendMessage(user.telegram_id, 
            '⚠️ <b>Внимание! Ваша подписка истекает через 24 часа!</b>\n\n' +
            'Для продолжения использования VPN, пожалуйста, продлите подписку.\n\n' +
            'Нажмите "💳 Купить/Продлить" для продления.',
            { parse_mode: 'HTML' }
          );
        }
      }
    }

    // Получаем пользователей с истекшей подпиской
    const { data: expiredUsers } = await supabase
      .from('users')
      .select('telegram_id, subscription_end')
      .lt('subscription_end', now);

    if (expiredUsers) {
      for (const user of expiredUsers) {
        bot.sendMessage(user.telegram_id,
          '❌ <b>Ваша подписка истекла!</b>\n\n' +
          'Для возобновления работы VPN, пожалуйста, продлите подписку.\n\n' +
          'Нажмите "💳 Купить/Продлить" для продления.',
          { parse_mode: 'HTML' }
        );
      }
    }
  } catch (error) {
    console.error('Error checking subscription expiration:', error);
  }
}

// Запускаем проверку каждые 6 часов
setInterval(checkSubscriptionExpiration, 6 * 60 * 60 * 1000);

// Запускаем первую проверку при старте бота
checkSubscriptionExpiration();

// Экспортируем бота
module.exports = bot;