const axios = require('axios');
require('dotenv').config();

const OUTLINE_API_URL = process.env.OUTLINE_API_URL;
const OUTLINE_CERT_SHA256 = process.env.OUTLINE_CERT_SHA256;

const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false
});

const api = axios.create({
  baseURL: OUTLINE_API_URL,
  httpsAgent: agent,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function listKeys() {
  const res = await api.get('/access-keys');
  return res.data.accessKeys;
}

async function createKey() {
  const res = await api.post('/access-keys');
  return res.data;
}

async function deleteKey(keyId) {
  await api.delete(`/access-keys/${keyId}`);
}

async function getKeyDataUsage(keyId) {
  const res = await api.get(`/access-keys/${keyId}/data-usage`);
  return res.data;
}

function createInstance(apiUrl, certSha256) {
  const https = require('https');
  const agent = new https.Agent({ rejectUnauthorized: false });
  const api = require('axios').create({
    baseURL: apiUrl,
    httpsAgent: agent,
    headers: { 'Content-Type': 'application/json' }
  });
  return {
    async listKeys() {
      const res = await api.get('/access-keys');
      return res.data.accessKeys;
    },
    async createKey() {
      const res = await api.post('/access-keys');
      return res.data;
    },
    async deleteKey(keyId) {
      await api.delete(`/access-keys/${keyId}`);
    },
    async getKeyDataUsage(keyId) {
      const res = await api.get(`/access-keys/${keyId}/data-usage`);
      return res.data;
    }
  };
}

module.exports = {
  listKeys,
  createKey,
  deleteKey,
  getKeyDataUsage,
  createInstance
}; 