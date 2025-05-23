const supabase = require('../config/supabase');
const outline = require('../outline/api');

async function removeExpiredKeys() {
  const now = new Date().toISOString();
  
  // Получаем все ключи с информацией о пользователях
  const { data: keys } = await supabase
    .from('outline_keys')
    .select(`
      id,
      outline_key_id,
      server_id,
      user_id,
      users (
        subscription_end
      ),
      servers (
        api_url,
        cert_sha256
      )
    `);

  if (!keys || keys.length === 0) return;

  for (const key of keys) {
    try {
      // Проверяем срок действия подписки
      if (!key.users?.subscription_end || new Date(key.users.subscription_end) < new Date()) {
        // Создаем экземпляр Outline API для конкретного сервера
        const outlineInstance = outline.createInstance(
          key.servers.api_url,
          key.servers.cert_sha256
        );

        // Удаляем ключ из Outline
        await outlineInstance.deleteKey(key.outline_key_id);
        
        // Удаляем ключ из базы данных
        await supabase
          .from('outline_keys')
          .delete()
          .eq('id', key.id);

        console.log(`Удален ключ ${key.id} для пользователя ${key.user_id} - истек срок подписки`);
      }
    } catch (e) {
      console.error('Ошибка при удалении ключа:', key.id, e.message);
    }
  }
}

module.exports = removeExpiredKeys; 