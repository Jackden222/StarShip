import React, { useEffect, useState } from 'react';
import { formatOmskDate } from '../utils/formatDate';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromoCodes({ token }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [code, setCode] = useState('');
  const [days, setDays] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/promos', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setCodes(data);
        setLoading(false);
      })
      .catch(e => {
        setError('Ошибка загрузки промокодов');
        setLoading(false);
      });
  }, [token, success]);

  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await fetch('/api/admin/promos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code, days: +days, max_uses: maxUses ? +maxUses : null, expires_at: expiresAt || null })
    });
    if (res.ok) {
      setSuccess('Промокод создан');
      setCode('');
      setDays('');
      setMaxUses('');
      setExpiresAt('');
    } else {
      setError('Ошибка создания промокода');
    }
  };

  const handleStatus = async (id, is_active) => {
    await fetch(`/api/admin/promos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ is_active })
    });
    setSuccess('Статус изменён');
    setTimeout(() => setSuccess(''), 1000);
  };

  const handleDelete = async id => {
    await fetch(`/api/admin/promos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setSuccess('Промокод удалён');
    setTimeout(() => setSuccess(''), 1000);
  };

  return (
    <motion.div className="py-8 px-0 sm:px-8 w-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5 }}>
      <motion.h3 className="text-3xl font-bold mb-8 text-blue-700 animate-fade-in tracking-tight" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>Промокоды</motion.h3>
      <motion.form onSubmit={handleCreate} className="flex gap-4 mb-8 flex-wrap items-end bg-white rounded-2xl shadow-lg p-6 border border-gray-100" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <div>
          <label className="block text-sm mb-1 font-semibold text-blue-800">Код</label>
          <input value={code} onChange={e => setCode(e.target.value)} required className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 bg-blue-50" />
        </div>
        <div>
          <label className="block text-sm mb-1 font-semibold text-blue-800">Дней</label>
          <input type="number" value={days} min={1} max={365} onChange={e => setDays(e.target.value)} required className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 w-24 outline-none transition-all duration-200 bg-blue-50" />
        </div>
        <div>
          <label className="block text-sm mb-1 font-semibold text-blue-800">Макс. использований</label>
          <input type="number" value={maxUses} min={1} onChange={e => setMaxUses(e.target.value)} className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 w-24 outline-none transition-all duration-200 bg-blue-50" placeholder="∞" />
        </div>
        <div>
          <label className="block text-sm mb-1 font-semibold text-blue-800">Действует до</label>
          <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 bg-blue-50" />
        </div>
        <motion.button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Создать</motion.button>
        {success && <span className="text-green-600 ml-4 font-semibold">{success}</span>}
        {error && <span className="text-red-600 ml-4 font-semibold">{error}</span>}
      </motion.form>
      <motion.div className="overflow-x-auto rounded-3xl shadow-2xl border border-gray-100 bg-white animate-fade-in" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <table className="min-w-full text-base">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Код</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Дней</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Использовано</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Действует до</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Активен</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Создан</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Действия</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}><td colSpan={7} className="text-center py-4">Загрузка...</td></motion.tr>
              ) : codes.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  className="group transition-all duration-200 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.03 * idx }}
                  layout
                >
                  <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{p.code}</td>
                  <td className="py-3 px-4">{p.days}</td>
                  <td className="py-3 px-4">{p.max_uses ? `${p.used_count}/{p.max_uses}` : '∞'}</td>
                  <td className="py-3 px-4">{p.expires_at ? formatOmskDate(p.expires_at) : '∞'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{p.created_at ? formatOmskDate(p.created_at) : '-'}</td>
                  <td className="py-3 px-4 flex gap-2">
                    {p.is_active ? (
                      <motion.button
                        onClick={() => handleStatus(p.id, false)}
                        className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-all text-xs font-semibold shadow-sm border border-yellow-200 cursor-pointer"
                        title="Деактивировать"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Деактивировать
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleStatus(p.id, true)}
                        className="px-3 py-1 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-all text-xs font-semibold shadow-sm border border-green-200 cursor-pointer"
                        title="Активировать"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Активировать
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all text-xs font-semibold shadow-sm border border-red-200 cursor-pointer"
                      title="Удалить"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Удалить
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>
      {success && <motion.div className="text-green-600 mt-4 font-semibold animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{success}</motion.div>}
      {error && <motion.div className="text-red-600 mt-4 font-semibold animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
    </motion.div>
  );
} 