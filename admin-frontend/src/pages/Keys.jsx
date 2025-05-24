import React, { useEffect, useState } from 'react';
import { formatOmskDate } from '../utils/formatDate';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

export default function Keys({ token }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // breakpoint for sm
  const [showLongColumns, setShowLongColumns] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [token]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setKeys(data);
    } catch (e) {
      setError('Ошибка загрузки ключей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить ключ?')) {
      setDeleteLoadingId(id);
    try {
        const res = await fetch(`${apiUrl}/api/admin/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
        if (res.ok) {
        setSuccess('Ключ успешно удален');
        setShowDeleteModal(false);
        setSelectedKey(null);
        fetchKeys();
      } else {
        setError('Ошибка при удалении ключа');
      }
    } catch (e) {
      setError('Ошибка при удалении ключа');
      }
    }
  };

  if (loading) return (
    <motion.div className="flex flex-col items-center justify-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-lg text-gray-400">Загрузка...</div>
    </motion.div>
  );

  if (error) return <motion.div className="text-center py-8 text-red-500 animate-fade-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>;

  return (
    <motion.div className="py-8 px-0 sm:px-8 w-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5 }}>
      <motion.h3 className="text-3xl font-bold mb-8 text-blue-700 animate-fade-in tracking-tight" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>Ключи Outline</motion.h3>
      
      {success && (
        <motion.div 
          className="mb-6 p-4 bg-green-100 text-green-700 rounded-xl animate-fade-in"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onAnimationComplete={() => setTimeout(() => setSuccess(''), 3000)}
        >
          {success}
        </motion.div>
      )}

      <motion.div className="overflow-x-auto rounded-3xl shadow-2xl border border-gray-100 bg-white animate-fade-in" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <table className="min-w-full text-sm sm:text-base">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="py-4 px-4 text-left font-bold text-blue-800">
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
              <th className="py-4 px-4 text-left font-bold text-blue-800">Пользователь</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Сервер</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">
                <div className="flex items-center">
                  Outline Key ID
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
              <th className="py-4 px-4 text-left font-bold text-blue-800">
                <div className="flex items-center">
                  Access URL
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
              <th className="py-4 px-4 text-left font-bold text-blue-800">Создан</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Действует до</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Действия</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {keys.map((k, idx) => (
                <motion.tr
                  key={k.id}
                  className="group transition-all duration-200 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.03 * idx }}
                  layout
                >
                  <td className={`py-3 px-4 text-xs text-gray-500 break-all font-mono ${isMobile && !showLongColumns ? 'hidden' : 'table-cell'}`}>{k.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">@{k.users?.username || 'Неизвестно'}</span>
                      <span className="text-xs text-gray-500">ID: {k.user_id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{k.servers?.name || 'Неизвестно'}</span>
                      <span className="text-xs text-gray-500">{k.servers?.country || ''}</span>
                    </div>
                  </td>
                  <td className={`py-3 px-4 text-xs text-gray-500 break-all font-mono ${isMobile && !showLongColumns ? 'hidden' : 'table-cell'}`}>{k.outline_key_id}</td>
                  <td className={`py-3 px-4 break-all text-blue-700 font-semibold ${isMobile && !showLongColumns ? 'hidden' : 'table-cell'}`}>{k.access_url}</td>
                  <td className="py-3 px-4">{k.created_at ? formatOmskDate(k.created_at) : '-'}</td>
                  <td className="py-3 px-4">
                    {k.users?.subscription_end ? formatOmskDate(k.users.subscription_end) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setSelectedKey(k);
                        setShowDeleteModal(true);
                      }}
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

      {/* Модальное окно подтверждения удаления */}
      <AnimatePresence>
        {showDeleteModal && selectedKey && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h4 className="text-xl font-bold text-blue-800 mb-4">Подтверждение удаления</h4>
              <p className="text-gray-700 mb-6">Вы уверены, что хотите удалить ключ Outline с ID <strong>{selectedKey?.outline_key_id}</strong>?</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">Отмена</button>
                <button onClick={() => handleDelete(selectedKey.id)} className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors">Удалить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 