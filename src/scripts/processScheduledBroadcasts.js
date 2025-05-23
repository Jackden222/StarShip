const { createClient } = require('@supabase/supabase-js');
const config = require('../config/config');
const { sendTelegramMessage } = require('../utils/telegram');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

async function processScheduledBroadcasts() {
  try {
    // Получаем все pending рассылки, время которых наступило
    const { data: broadcasts, error } = await supabase
      .from('scheduled_broadcasts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;

    for (const broadcast of broadcasts) {
      try {
        // Получаем пользователей для рассылки
        let query = supabase.from('users').select('telegram_id');
        
        if (broadcast.user_ids) {
          query = query.in('id', broadcast.user_ids);
        }

        const { data: users, error: usersError } = await query;
        if (usersError) throw usersError;

        // Отправляем сообщения
        for (const user of users) {
          if (user.telegram_id) {
            await sendTelegramMessage(user.telegram_id, broadcast.message);
          }
        }

        // Обновляем статус рассылки
        await supabase
          .from('scheduled_broadcasts')
          .update({ status: 'completed' })
          .eq('id', broadcast.id);

      } catch (err) {
        console.error(`Error processing broadcast ${broadcast.id}:`, err);
        
        // Обновляем статус на failed
        await supabase
          .from('scheduled_broadcasts')
          .update({ status: 'failed', error: err.message })
          .eq('id', broadcast.id);
      }
    }
  } catch (err) {
    console.error('Error in processScheduledBroadcasts:', err);
  }
}

// Запускаем обработку каждую минуту
setInterval(processScheduledBroadcasts, 60000);

// Запускаем сразу при старте
processScheduledBroadcasts(); 