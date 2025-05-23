module.exports = {
  apps: [
    {
      name: 'starshipvpn-api',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        CRYPTO_BOT_TOKEN: process.env.CRYPTO_BOT_TOKEN,
        JWT_SECRET: process.env.JWT_SECRET,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      }
    },
    {
      name: 'starshipvpn-bot',
      script: 'bot/index.js',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        CRYPTO_BOT_TOKEN: process.env.CRYPTO_BOT_TOKEN,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      }
    }
  ]
} 