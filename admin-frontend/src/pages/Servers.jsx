import React, { useEffect, useState } from 'react';
import { formatOmskDate } from '../utils/formatDate';
import { motion, AnimatePresence } from 'framer-motion';

export default function Servers({ token }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    country: '',
    status: 'online',
    api_url: '',
    cert_sha256: '',
    max_keys: 100
  });
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // breakpoint for sm
  const [showLongColumns, setShowLongColumns] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/api/admin/servers', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setServers(data);
        setLoading(false);
      })
      .catch(e => {
        setError('Ошибка загрузки серверов');
        setLoading(false);
      });
  }, [token, success]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const url = editingServer 
      ? `/api/admin/servers/${editingServer.id}`
      : '/api/admin/servers';
      
    const method = editingServer ? 'PATCH' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    
    if (res.ok) {
      setSuccess(editingServer ? 'Сервер обновлен' : 'Сервер добавлен');
      setForm({ name: '', country: '', status: 'online', api_url: '', cert_sha256: '', max_keys: 100 });
      setShowModal(false);
      setEditingServer(null);
    } else {
      setError(editingServer ? 'Ошибка обновления сервера' : 'Ошибка добавления сервера');
    }
  };

  const handleEdit = (server) => {
    setEditingServer(server);
    setForm({
      name: server.name,
      country: server.country,
      status: server.status,
      api_url: server.api_url,
      cert_sha256: server.cert_sha256,
      max_keys: server.max_keys || 100
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить сервер?')) {
      try {
        const res = await fetch(`/api/admin/servers/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setServers(servers.filter(server => server.id !== id));
        } else {
          const data = await res.json();
          setError(data.error || 'Ошибка удаления сервера');
        }
      } catch (e) {
        setError('Ошибка удаления сервера');
      }
    }
  };

  return (
    <motion.div className="py-8 px-0 sm:px-8 w-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5 }}>
      <motion.h3 className="text-3xl font-bold mb-8 text-blue-700 animate-fade-in tracking-tight" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>Серверы Outline</motion.h3>
      <div className="mb-6 flex justify-end">
        <motion.button
          onClick={() => {
            setEditingServer(null);
            setForm({ name: '', country: '', status: 'online', api_url: '', cert_sha256: '', max_keys: 100 });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all text-lg font-semibold shadow-md cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          Добавить сервер
        </motion.button>
      </div>
      {/* Модальное окно */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 w-full max-w-2xl mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-800">{editingServer ? 'Редактировать сервер' : 'Добавить сервер'}</h3>
                <button onClick={() => {
                  setShowModal(false);
                  setEditingServer(null);
                }} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <motion.form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-blue-800">Название</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="border-2 border-blue-200 rounded-xl px-4 py-2 outline-none bg-blue-50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-blue-800">Страна</label>
                  <input name="country" value={form.country} onChange={handleChange} required className="border-2 border-blue-200 rounded-xl px-4 py-2 outline-none bg-blue-50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-blue-800">Статус</label>
                  <select name="status" value={form.status} onChange={handleChange} required className="border-2 border-blue-200 rounded-xl px-4 py-2 outline-none bg-blue-50">
                    <option value="online">Онлайн</option>
                    <option value="offline">Оффлайн</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-blue-800">API URL</label>
                  <input name="api_url" value={form.api_url} onChange={handleChange} required className="border-2 border-blue-200 rounded-xl px-4 py-2 outline-none bg-blue-50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-blue-800">Cert SHA256</label>
                  <input name="cert_sha256" value={form.cert_sha256} onChange={handleChange} required className="border-2 border-blue-200 rounded-xl px-4 py-2 outline-none bg-blue-50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-blue-800">Лимит ключей (max_keys)</label>
                  <input name="max_keys" type="number" min="1" value={form.max_keys} onChange={handleChange} required className="border-2 border-blue-200 rounded-xl px-4 py-2 outline-none bg-blue-50" />
                </div>
                <motion.button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all text-lg font-semibold shadow-md cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>{editingServer ? 'Сохранить изменения' : 'Добавить сервер'}</motion.button>
                {error && <motion.div className="text-red-600 text-center font-semibold animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
              </motion.form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div className="overflow-x-auto rounded-3xl shadow-2xl border border-gray-100 bg-white animate-fade-in" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <table className="min-w-full text-sm sm:text-base">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">
                <div className="flex items-center">
                  ID
                  {isMobile && (
                    <button onClick={() => setShowLongColumns(!showLongColumns)} className="ml-1 text-gray-500 hover:text-blue-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showLongColumns ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.958 9.958 0 011.563-2.665m10.131-4.7C16.111 4.083 14.073 4 12 4c-4.478 0-8.268 2.943-9.543 7a10.025 10.025 0 014.134 4.645zm1.963 4.698A10.035 10.035 0 0112 20c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.134-4.645zm-1.963 4.698z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Название</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Страна</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Статус</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">
                <div className="flex items-center">
                  API URL
                  {isMobile && (
                    <button onClick={() => setShowLongColumns(!showLongColumns)} className="ml-1 text-gray-500 hover:text-blue-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showLongColumns ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.958 9.958 0 011.563-2.665m10.131-4.7C16.111 4.083 14.073 4 12 4c-4.478 0-8.268 2.943-9.543 7a10.025 10.025 0 014.134 4.645zm1.963 4.698A10.035 10.035 0 0112 20c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.134-4.645zm-1.963 4.698z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">
                <div className="flex items-center">
                  Cert SHA256
                  {isMobile && (
                    <button onClick={() => setShowLongColumns(!showLongColumns)} className="ml-1 text-gray-500 hover:text-blue-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showLongColumns ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.958 9.958 0 011.563-2.665m10.131-4.7C16.111 4.083 14.073 4 12 4c-4.478 0-8.268 2.943-9.543 7a10.025 10.025 0 014.134 4.645zm1.963 4.698A10.035 10.035 0 0112 20c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.134-4.645zm-1.963 4.698z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Лимит ключей</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Создан</th>
              <th className="py-3 sm:py-4 px-3 sm:px-4 text-left font-bold text-blue-800">Действия</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {servers.map((s, idx) => (
                <motion.tr
                  key={s.id}
                  className="group transition-all duration-200 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.03 * idx }}
                  layout
                >
                  <td className={`py-2 sm:py-3 px-3 sm:px-4 text-xs text-gray-500 break-all font-mono ${isMobile && !showLongColumns ? 'hidden' : 'table-cell'}`}>{s.id}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{s.name}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{s.country}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{s.status}</td>
                  <td className={`py-2 sm:py-3 px-3 sm:px-4 break-all text-blue-700 font-mono ${isMobile && !showLongColumns ? 'hidden' : 'table-cell'}`}>{s.api_url}</td>
                  <td className={`py-2 sm:py-3 px-3 sm:px-4 break-all text-blue-700 font-mono ${isMobile && !showLongColumns ? 'hidden' : 'table-cell'}`}>{s.cert_sha256}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-700">{s.active_keys || 0}</span>
                        <span className="text-sm text-gray-500">из {s.max_keys}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            (s.active_keys || 0) / s.max_keys > 0.8 ? 'bg-red-500' :
                            (s.active_keys || 0) / s.max_keys > 0.5 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(((s.active_keys || 0) / s.max_keys) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{s.created_at ? formatOmskDate(s.created_at) : '-'}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Редактировать
                    </button>
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