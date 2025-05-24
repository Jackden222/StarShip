require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const bot = require('./bot/index');
const { v4: uuidv4 } = require('uuid');
const { customAlphabet } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET');
  throw new Error('Missing JWT_SECRET');
}

// Middleware
app.use(cors());
app.use(express.json());

// const bot = require('./bot');

// Маршруты API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Запуск cron-задачи раз в час
const removeExpiredKeys = require('./cron/remove_expired_keys');

// Запускаем проверку ключей каждые 5 минут
setInterval(removeExpiredKeys, 5 * 60 * 1000);

// Запускаем первую проверку сразу
removeExpiredKeys();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';
const DO_TOKEN = process.env.DO_TOKEN;

// Инициализируем Supabase клиент здесь
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  // Не выбрасываем ошибку сразу, чтобы сервис starship-admin мог запуститься
  // throw new Error('Missing Supabase credentials'); 
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Новый эндпоинт логина
app.post('/api/admin/login', async (req, res) => {
  console.log('POST /api/admin/login', req.body); // Логируем тело запроса
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      console.warn('Login: username or password missing');
      return res.status(400).json({ error: 'username and password required' });
    }
    const { data: admin, error } = await supabase
      .from('admins_v2')
      .select('*')
      .eq('username', username)
      .single();
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!admin) {
      console.warn('Login: admin not found');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      console.warn('Login: invalid password');
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    try {
      res.status(500).json({ error: 'Internal server error' });
    } catch (e) {
      console.error('Response error:', e);
    }
  }
});

// Новый middleware авторизации
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Список пользователей
app.get('/api/admin/users', adminAuth, async (req, res) => {
  console.log('Received GET /api/admin/users request'); // Лог начала обработки
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, telegram_id, username, subscription_end, created_at, balance, country');

    if (error) {
      console.error('Supabase error /api/admin/users:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Successfully fetched users from Supabase'); // Лог успешного получения данных
    console.log('Number of users fetched:', data ? data.length : 0); // Лог количества пользователей
    console.log('Sample user data:', data && data.length > 0 ? data.slice(0, 5) : 'No data'); // Лог части данных

    res.json(data);
  } catch (e) {
    console.error('Error in /api/admin/users endpoint:', e); // Лог общей ошибки
    res.status(500).json({ error: e.message || 'Internal server error' });
  }
});

// Список ключей
app.get('/api/admin/keys', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('outline_keys')
    .select(`
      id, 
      user_id, 
      outline_key_id, 
      access_url, 
      created_at, 
      expires_at,
      server_id,
      users:user_id (
        telegram_id,
        username,
        subscription_end
      ),
      servers:server_id (
        name,
        country
      )
    `)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Удаление ключа
app.delete('/api/admin/keys/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('outline_keys')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Промокоды: просмотр
app.get('/api/admin/promos', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('id, code, days, is_active, created_at, max_uses, used_count, expires_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Промокоды: создание
app.post('/api/admin/promos', adminAuth, async (req, res) => {
  const { code, days, max_uses, expires_at } = req.body;
  if (!code || !days) return res.status(400).json({ error: 'code and days required' });
  const { data, error } = await supabase
    .from('promo_codes')
    .insert([{ 
      code, 
      days,
      max_uses: max_uses || null,
      used_count: 0,
      expires_at: expires_at || null,
      is_active: true 
    }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// PATCH /api/admin/promos/:id — обновление статуса активности
app.patch('/api/admin/promos/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const { data, error } = await supabase
    .from('promo_codes')
    .update({ is_active })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data && data[0]);
});

// DELETE /api/admin/promos/:id — удаление промокода
app.delete('/api/admin/promos/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('promo_codes')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Рассылка сообщений пользователям
app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
  try {
    const { message, user_ids } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }
    
    let query = supabase
      .from('users')
      .select('telegram_id');
      
    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      query = query.in('id', user_ids);
    }
    
    const { data: users, error } = await query;
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    let count = 0;
    for (const u of users) {
      try {
        await bot.sendMessage(u.telegram_id, message);
        count++;
      } catch (e) {
        console.error('Error sending message to user:', e);
        // Игнорируем ошибки отправки отдельным пользователям
      }
    }
    res.json({ sent: count });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Обновление даты окончания подписки пользователя
app.patch('/api/admin/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { subscription_end } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ subscription_end })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Получение списка тикетов
app.get('/api/admin/tickets', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      id,
      question,
      answer,
      status,
      created_at,
      answered_at,
      users:user_id (
        telegram_id,
        username
      )
    `)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Ответ на тикет в техподдержке
app.post('/api/admin/tickets/:ticketId/answer', adminAuth, async (req, res) => {
  const { ticketId } = req.params;
  const { answer } = req.body;
  
  if (!answer) {
    return res.status(400).json({ error: 'answer required' });
  }

  try {
    // Получаем тикет
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('user_id, question')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'ticket not found' });
    }

    // Получаем telegram_id пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', ticket.user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'user not found' });
    }

    // Отправляем ответ пользователю через бота
    await bot.sendMessage(user.telegram_id, 
      `📬 <b>Ответ на ваш вопрос:</b>\n\n${answer}\n\n<i>Ваш вопрос: ${ticket.question}</i>`, 
      { parse_mode: 'HTML' }
    );

    // Обновляем статус тикета
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({ 
        status: 'answered',
        answer,
        answered_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      throw updateError;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error answering ticket:', error);
    res.status(500).json({ error: 'Failed to answer ticket' });
  }
});

// Получение шаблонов ответов
app.get('/api/admin/templates', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('support_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Создание шаблона
app.post('/api/admin/templates', adminAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const { data, error } = await supabase
    .from('support_templates')
    .insert([{ title, content }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Удаление шаблона
app.delete('/api/admin/templates/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('support_templates')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Удаление тикета
app.delete('/api/admin/tickets/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('support_tickets')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Получить список серверов
app.get('/api/admin/servers', adminAuth, async (req, res) => {
  const { data: servers, error: serversError } = await supabase
    .from('servers')
    .select('*')
    .order('created_at', { ascending: false });

  if (serversError) return res.status(500).json({ error: serversError.message });

  // Получаем количество активных ключей для каждого сервера
  const serversWithActiveKeys = await Promise.all(servers.map(async (server) => {
    const { count, error: countError } = await supabase
      .from('outline_keys')
      .select('*', { count: 'exact', head: true })
      .eq('server_id', server.id)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (countError) {
      console.error(`Error counting keys for server ${server.id}:`, countError);
      return { ...server, active_keys: 0 };
    }

    return { ...server, active_keys: count || 0 };
  }));

  res.json(serversWithActiveKeys);
});

// Добавить новый сервер
app.post('/api/admin/servers', adminAuth, async (req, res) => {
  const { name, country, status, api_url, cert_sha256, max_keys } = req.body;
  if (!name || !country || !status || !api_url || !cert_sha256) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  const { data, error } = await supabase
    .from('servers')
    .insert([{ name, country, status, api_url, cert_sha256, max_keys: max_keys ? Number(max_keys) : 100 }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Редактирование сервера
app.patch('/api/admin/servers/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, country, status, api_url, cert_sha256, max_keys } = req.body;
  if (!name || !country || !status || !api_url || !cert_sha256) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  const { data, error } = await supabase
    .from('servers')
    .update({ name, country, status, api_url, cert_sha256, max_keys: max_keys ? Number(max_keys) : 100 })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Топ рефералов
app.get('/api/admin/referrals/top', adminAuth, async (req, res) => {
  // Получаем все рефералы с username пригласившего и подпиской приглашённых
  const { data, error } = await supabase
    .from('referrals')
    .select('referrer_id, users:referrer_id(username), referred_id, referred:referred_id(subscription_end)');
  if (error) return res.status(500).json({ error: error.message });
  // Группируем по referrer_id
  const map = {};
  const now = new Date();
  data.forEach(r => {
    if (!map[r.referrer_id]) map[r.referrer_id] = { referrer_id: r.referrer_id, username: r.users?.username, count: 0, paid_count: 0 };
    map[r.referrer_id].count++;
    // Проверяем активную подписку
    if (r.referred?.subscription_end && new Date(r.referred.subscription_end) > now) {
      map[r.referrer_id].paid_count++;
    }
  });
  const result = Object.values(map).sort((a, b) => b.count - a.count);
  res.json(result);
});

// Список приглашённых по пользователю
app.get('/api/admin/referrals/:referrer_id', adminAuth, async (req, res) => {
  const referrer_id = req.params.referrer_id;
  const { data, error } = await supabase
    .from('referrals')
    .select('referred_id, users:referred_id(username, telegram_id, created_at, balance, subscription_end)')
    .eq('referrer_id', referrer_id);
  if (error) return res.status(500).json({ error: error.message });
  const result = data.map(r => ({
    id: r.referred_id,
    username: r.users?.username,
    telegram_id: r.users?.telegram_id,
    created_at: r.users?.created_at,
    balance: r.users?.balance,
    subscription_end: r.users?.subscription_end
  }));
  res.json(result);
});

// Безопасный fetch для DigitalOcean метрик
async function safeFetchJson(url, headers) {
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    if (resp.status !== 404) {
      const text = await resp.text();
      console.error('DigitalOcean metrics error:', url, resp.status, text);
    }
    return '-';
  }
  try {
    return await resp.json();
  } catch (e) {
    console.error('JSON parse error:', url, e);
    return '-';
  }
}

// Получить список дроплетов и их метрики
app.get('/api/admin/do-stats', async (req, res) => {
  try {
    // Получаем список дроплетов
    const dropletsResp = await fetch('https://api.digitalocean.com/v2/droplets', {
      headers: { Authorization: `Bearer ${DO_TOKEN}` }
    });
    const dropletsJson = await dropletsResp.json();
    console.log('DigitalOcean droplets response:', dropletsJson);
    const { droplets } = dropletsJson;
    const end = new Date();
    const start = new Date(Date.now() - 30 * 60 * 1000);
    const stats = await Promise.all((droplets || []).map(async (d) => {
      // CPU
      const cpu = await safeFetchJson(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/cpu?host_id=${d.id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=5m`,
        { Authorization: `Bearer ${DO_TOKEN}` }
      );
      // RAM
      const mem = await safeFetchJson(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/memory_utilization?host_id=${d.id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=5m`,
        { Authorization: `Bearer ${DO_TOKEN}` }
      );
      // Disk
      const disk = await safeFetchJson(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/disk_utilization?host_id=${d.id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=5m`,
        { Authorization: `Bearer ${DO_TOKEN}` }
      );
      // Network
      const net = await safeFetchJson(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/network_out?host_id=${d.id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=5m`,
        { Authorization: `Bearer ${DO_TOKEN}` }
      );
      return {
        id: d.id,
        name: d.name,
        region: d.region.slug,
        status: d.status,
        ip: d.networks.v4[0]?.ip_address,
        cpu: typeof cpu === 'object' && cpu.data && cpu.data.values && cpu.data.values.length > 0 ? cpu.data.values.slice(-1)[0] : '-',
        mem: typeof mem === 'object' && mem.data && mem.data.values && mem.data.values.length > 0 ? mem.data.values.slice(-1)[0] : '-',
        disk: typeof disk === 'object' && disk.data && disk.data.values && disk.data.values.length > 0 ? disk.data.values.slice(-1)[0] : '-',
        net: typeof net === 'object' && net.data && net.data.values && net.data.values.length > 0 ? net.data.values.slice(-1)[0] : '-',
      };
    }));
    res.json(stats);
  } catch (e) {
    console.error('DigitalOcean API error:', e);
    res.status(500).json({ error: 'DigitalOcean API error', details: e.message });
  }
});

// Получить подробные метрики по серверу (графики за 24ч)
app.get('/api/admin/do-metrics/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const end = new Date();
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
  async function getMetric(url) {
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${DO_TOKEN}` } });
    if (!resp.ok) return [];
    try {
      const json = await resp.json();
      if (json && json.data && Array.isArray(json.data.values)) {
        return json.data.values.map(v => (typeof v === 'number' ? v : null));
      }
      return [];
    } catch {
      return [];
    }
  }
  const [cpu, mem, disk, net] = await Promise.all([
    getMetric(`https://api.digitalocean.com/v2/monitoring/metrics/droplet/cpu?host_id=${id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=30m`),
    getMetric(`https://api.digitalocean.com/v2/monitoring/metrics/droplet/memory_utilization?host_id=${id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=30m`),
    getMetric(`https://api.digitalocean.com/v2/monitoring/metrics/droplet/disk_utilization?host_id=${id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=30m`),
    getMetric(`https://api.digitalocean.com/v2/monitoring/metrics/droplet/network_out?host_id=${id}&start=${start.toISOString()}&end=${end.toISOString()}&interval=30m`),
  ]);
  res.json({ cpu, mem, disk, net });
});

// Получение шаблонов рассылки
app.get('/api/admin/broadcast-templates', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('broadcast_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Создание шаблона рассылки
app.post('/api/admin/broadcast-templates', adminAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });
  const { data, error } = await supabase
    .from('broadcast_templates')
    .insert([{ title, content }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Удаление шаблона рассылки
app.delete('/api/admin/broadcast-templates/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('broadcast_templates')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Получение рекламных реферальных ссылок
app.get('/api/admin/ad-ref-links', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('ad_ref_links')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Генерация новой рекламной реферальной ссылки с именем
app.post('/api/admin/ad-ref-links', adminAuth, async (req, res) => {
  const { v4: uuidv4 } = require('uuid');
  const { customAlphabet } = require('nanoid');
  const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const referrer_id = `ad-${uuidv4()}`;
  const short_id = nanoid();
  const { data, error } = await supabase
    .from('ad_ref_links')
    .insert([{ referrer_id, name, short_id }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Удаление рекламной реферальной ссылки
app.delete('/api/admin/ad-ref-links/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('ad_ref_links')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Увеличить счетчик переходов по рекламной ссылке
app.post('/api/ad-ref-click', async (req, res) => {
  const { referrer_id } = req.body;
  if (!referrer_id) return res.status(400).json({ error: 'referrer_id required' });
  // Получаем текущее значение
  const { data, error: selectError } = await supabase
    .from('ad_ref_links')
    .select('clicks')
    .eq('short_id', referrer_id)
    .single();
  if (selectError || !data) return res.status(404).json({ error: 'not found' });
  // Инкрементируем
  const { error } = await supabase
    .from('ad_ref_links')
    .update({ clicks: (data.clicks || 0) + 1 })
    .eq('short_id', referrer_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Создание отложенной рассылки
app.post('/api/admin/scheduled-broadcasts', adminAuth, async (req, res) => {
  const { message, scheduled_at, user_ids } = req.body;
  if (!message || !scheduled_at) return res.status(400).json({ error: 'message and scheduled_at required' });
  
  const { data, error } = await supabase
    .from('scheduled_broadcasts')
    .insert([{ 
      message, 
      scheduled_at,
      user_ids: user_ids || null,
      status: 'pending'
    }])
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Получение списка отложенных рассылок
app.get('/api/admin/scheduled-broadcasts', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('scheduled_broadcasts')
    .select('*')
    .order('scheduled_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Удаление отложенной рассылки
app.delete('/api/admin/scheduled-broadcasts/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('scheduled_broadcasts')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Удаляем запуск бота из API сервиса, если он запускается где-то еще
// bot.launch().then(() => {
//   console.log('Bot started');
// }).catch((err) => {
//   console.error('Error starting bot:', err);
// });

// Включаем graceful shutdown (оставляем для API сервера)
process.once('SIGINT', () => app.close()); // Используем app.close для Express
process.once('SIGTERM', () => app.close());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}); 