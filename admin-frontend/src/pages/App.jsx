import React, { useState } from 'react';
import Users from './Users';
import Keys from './Keys';
import PromoCodes from './PromoCodes';
import Broadcast from './Broadcast';
import Support from './Support';
import Servers from './Servers';
import Sidebar from '../components/Sidebar';
import Referrals from './Referrals';
const LOCAL_TOKEN_KEY = 'admin_token';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(LOCAL_TOKEN_KEY) || '');
  const [view, setView] = useState('users');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    try {
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      localStorage.setItem(LOCAL_TOKEN_KEY, data.token);
      setToken(data.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    setToken('');
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-xs">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Вход в админку</h2>
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full p-2 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
            autoFocus
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
          />
          {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
          <button 
            onClick={handleLogin} 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 text-sm sm:text-base"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
      <Sidebar view={view} setView={setView} handleLogout={handleLogout} />
      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto">
        <div className="w-full overflow-x-auto">
          {view === 'users' && <Users token={token} />}
          {view === 'keys' && <Keys token={token} />}
          {view === 'servers' && <Servers token={token} />}
          {view === 'promos' && <PromoCodes token={token} />}
          {view === 'broadcast' && <Broadcast token={token} />}
          {view === 'support' && <Support token={token} />}
          {view === 'referrals' && <Referrals token={token} />}
        </div>
      </main>
    </div>
  );
} 