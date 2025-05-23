module.exports = {
  apps: [
    {
      name: 'starshipvpn-api',
      script: 'src/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'starshipvpn-bot',
      script: 'bot/index.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
} 