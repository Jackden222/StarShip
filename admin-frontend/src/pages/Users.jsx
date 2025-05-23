import React, { useEffect, useState, useRef } from 'react';
import { formatOmskDate } from '../utils/formatDate';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

function daysLeft(date) {
  if (!date) return '-';
  const now = new Date();
  const end = new Date(date);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getDaysLeftColor(days) {
  if (days === '-') return 'bg-gray-100';
  if (days <= 3) return 'bg-red-400 text-white font-bold text-center';
  if (days <= 15) return 'bg-orange-400 text-white font-bold text-center';
  if (days <= 30) return 'bg-green-400 text-white font-bold text-center';
  return 'bg-gray-300';
}

function PieChart({ value, total, color, label, sublabel }) {
  const r = 28, c = 2 * Math.PI * r;
  const percent = total > 0 ? value / total : 0;
  return (
    <motion.div
      whileHover={{ scale: 1.08, boxShadow: '0 4px 24px 0 rgba(30,64,175,0.10)' }}
      className="flex flex-col items-center bg-white rounded-2xl shadow p-2 transition-all"
      style={{ width: 110 }}
    >
      <svg width={110} height={110}>
        <circle cx={55} cy={50} r={r} fill="#f3f4f6" />
        <circle
          cx={55} cy={50} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s' }}
        />
        <text x={55} y={58} textAnchor="middle" fontSize={24} fontWeight={700} fill={color}>{value}</text>
      </svg>
      <div className="text-center mt-1">
        <div className="text-sm font-semibold text-gray-700 leading-tight">{label}</div>
        {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
    </motion.div>
  );
}

export default function Users({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // breakpoint for sm
  const [showIdColumn, setShowIdColumn] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
          setError('');
        } else {
          setUsers([]);
          setError(data.error || 'Неизвестная ошибка');
        }
        setLoading(false);
      })
      .catch(e => {
        setError('Ошибка загрузки пользователей');
        setLoading(false);
      });
  }, [token, apiUrl]);

  const handleEdit = (id, date, balance) => {
    setEditId(id);
    setEditDate(date ? date.slice(0, 16) : '');
    setEditBalance(balance || '0');
  };

  const handleSave = async (id) => {
    const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        subscription_end: editDate ? new Date(editDate).toISOString() : null,
        balance: parseFloat(editBalance) || 0
      })
    });
    if (res.ok) {
      setEditId(null);
      setEditDate('');
      setEditBalance('');
      // обновить список
      setLoading(true);
      fetch(`${apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          setUsers(data);
          setLoading(false);
        });
    } else {
      // Handle error saving
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        const res = await fetch(`${apiUrl}/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setUsers(users.filter(user => user.id !== id));
        } else {
          const data = await res.json();
          setError(data.error || 'Ошибка удаления пользователя');
        }
      } catch (e) {
        setError('Ошибка удаления пользователя');
      }
    }
  };

  // Метрики для диаграмм
  const now = new Date();
  const withSub = users.filter(u => u.subscription_end && new Date(u.subscription_end) > now).length;
  const withoutSub = users.length - withSub;
  const withBalance = users.filter(u => (u.balance || 0) > 0).length;
  const new7d = users.filter(u => u.created_at && (now - new Date(u.created_at)) < 7*24*60*60*1000).length;

  // Распределение по странам
  const countryMap = {};
  users.forEach(u => {
    const c = (u.country || 'Не указано').toUpperCase();
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const countryArr = Object.entries(countryMap).sort((a, b) => b[1] - a[1]);
  const topCountries = countryArr.slice(0, 3);
  const otherCount = countryArr.slice(3).reduce((acc, [, v]) => acc + v, 0);
  const pieData = [...topCountries, ...(otherCount > 0 ? [['Другие', otherCount]] : [])];

  // Цвета для стран
  const pieColors = ['#2563eb', '#f59e42', '#10b981', '#6366f1'];

  if (loading) return (
    <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-lg text-gray-400">Загрузка...</div>
    </motion.div>
  );
  if (error) return <motion.div className="text-center py-8 text-red-500 animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Ошибка: {error}</motion.div>;

  return (
    <motion.div className="py-4 sm:py-6 lg:py-8 px-0 sm:px-4 lg:px-8 w-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5 }}>
      <motion.h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-blue-700 animate-fade-in tracking-tight" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>Пользователи</motion.h3>
      {/* Диаграммы */}
      <motion.div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <PieChart value={withSub} total={users.length} color="#2563eb" label="С подпиской" sublabel={`Всего: ${users.length}`}/>
        <PieChart value={withoutSub} total={users.length} color="#f59e42" label="Без подписки" />
        <PieChart value={withBalance} total={users.length} color="#10b981" label=">0₽ баланс" />
        <PieChart value={new7d} total={users.length} color="#6366f1" label="Новых за 7д" />
        {/* Диаграмма по странам */}
        <motion.div className="flex flex-col items-center bg-white rounded-2xl shadow p-2 transition-all" style={{ width: '100%', maxWidth: '160px' }} whileHover={{ scale: 1.08, boxShadow: '0 4px 24px 0 rgba(30,64,175,0.10)' }}>
          <svg width={120} height={120} viewBox="0 0 120 120">
            {pieData.reduce((acc, [country, count], i) => {
              const total = users.length;
              const percent = total > 0 ? count / total : 0;
              const r = 48, c = 2 * Math.PI * r;
              const prevOffset = acc.offset;
              const len = c * percent;
              acc.slices.push(
                <circle
                  key={country}
                  cx={60} cy={60} r={r}
                  fill="none"
                  stroke={pieColors[i % pieColors.length]}
                  strokeWidth={18}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-prevOffset}
                  strokeLinecap="butt"
                />
              );
              acc.offset += len;
              return acc;
            }, { slices: [], offset: 0 }).slices}
          </svg>
          <div className="text-center mt-1">
            <div className="text-sm font-semibold text-gray-700 leading-tight">По странам</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {pieData.map(([country, count], i) => (
                <div key={country} className="flex items-center gap-1 justify-center">
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: pieColors[i % pieColors.length], borderRadius: 2 }}></span>
                  <span>{country}: {Math.round((count / users.length) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Таблица */}
      <motion.div className="overflow-x-auto rounded-3xl shadow-2xl border border-gray-100 bg-white animate-fade-in" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <table className="min-w-full text-sm sm:text-base">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">
                <div className="flex items-center">
                  ID
                  {isMobile && (
                    <button onClick={() => setShowIdColumn(!showIdColumn)} className="ml-1 text-gray-500 hover:text-blue-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showIdColumn ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.958 9.958 0 011.563-2.665m10.131-4.7C16.111 4.083 14.073 4 12 4c-4.478 0-8.268 2.943-9.543 7a10.025 10.025 0 014.134 4.645zm1.963 4.698A10.035 10.035 0 0112 20c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.134-4.645zm-1.963 4.698z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Пользователь</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Баланс</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Подписка</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Страна</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Регистрация</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Действия</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {users.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  className="group transition-all duration-200 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.03 * idx }}
                  layout
                >
                  <td className={`py-2 sm:py-3 px-3 sm:px-4 text-xs text-gray-500 break-all font-mono ${isMobile && !showIdColumn ? 'hidden' : 'table-cell'}`}>{u.id}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">@{u.username}</span>
                      <span className="text-xs text-gray-500">{u.email || 'Нет email'}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${u.balance > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.balance}₽
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <div className="flex flex-col">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${getDaysLeftColor(daysLeft(u.subscription_end))}`}>
                        {daysLeft(u.subscription_end)} дн.
                      </span>
                      <span className="text-xs text-gray-500">{u.subscription_end ? formatOmskDate(u.subscription_end) : 'Нет'}</span>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{u.country || 'Не указано'}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{formatOmskDate(u.created_at)}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
} 