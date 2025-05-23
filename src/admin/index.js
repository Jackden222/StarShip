const express = require('express');
const cors = require('cors');
const supabase = require('../shared/supabase');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Проверка работоспособности
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Статистика
app.get('/api/stats', async (req, res) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id');
    
    const { data: activeSubs } = await supabase
      .from('users')
      .select('id')
      .gt('subscription_end', new Date().toISOString());

    res.json({
      totalUsers: users?.length || 0,
      activeSubscriptions: activeSubs?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Admin panel running on port ${port}`);
}); 