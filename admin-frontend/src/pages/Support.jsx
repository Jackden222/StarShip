import React, { useEffect, useState } from 'react';
import { formatOmskDate } from '../utils/formatDate';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

export default function Support({ token }) {
  const [tickets, setTickets] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openTicketId, setOpenTicketId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [success, setSuccess] = useState('');
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '' });
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const fetchTickets = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/admin/tickets`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setTickets(data);
        setLoading(false);
      })
      .catch(e => {
        setError('Ошибка загрузки тикетов');
        setLoading(false);
      });
  };

  const fetchTemplates = () => {
    fetch(`${apiUrl}/api/admin/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setTemplates(data);
      })
      .catch(e => {
        console.error('Ошибка загрузки шаблонов:', e);
      });
  };

  useEffect(() => {
    fetchTickets();
    fetchTemplates();

    // Автоматическое обновление тикетов каждые 30 секунд
    const interval = setInterval(() => {
      fetchTickets();
    }, 30000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(interval);
  }, [token]);

  const handleAnswer = async (e, ticketId) => {
    e.preventDefault();
    if (!ticketId) return;
    setSuccess('');
    setError('');
    if (!answer.trim()) {
      toast.error('Ответ не может быть пустым.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/${ticketId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ answer })
    });
    if (res.ok) {
      setSuccess('Ответ отправлен пользователю');
      setAnswer('');
      setOpenTicketId(null);
      fetchTickets();
    } else {
      setError('Ошибка отправки ответа');
      }
    } catch (e) {
      setError('Ошибка отправки ответа');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async e => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.content) {
      toast.error('Название и содержание шаблона обязательны.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newTemplate)
    });
    if (res.ok) {
      setNewTemplate({ title: '', content: '' });
      setShowNewTemplate(false);
      fetchTemplates();
      }
    } catch (e) {
      setError('Ошибка создания шаблона');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async id => {
    if (!confirm('Удалить этот шаблон?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/templates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchTemplates();
      }
    } catch (e) {
      setError('Ошибка удаления шаблона');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async text => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Скопировано!');
      setTimeout(() => setCopySuccess(''), 1000);
    } catch {
      setCopySuccess('Ошибка копирования');
      setTimeout(() => setCopySuccess(''), 1000);
    }
  };

  const handleDeleteTicket = async id => {
    if (!confirm('Удалить этот тикет?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchTickets();
      setOpenTicketId(null);
      }
    } catch (e) {
      setError('Ошибка удаления тикета');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'answered': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-8 px-0 sm:px-8 w-full flex gap-8 animate-fade-in">
      {/* Список тикетов */}
      <div className="flex-1">
        <h3 className="text-3xl font-bold mb-8 text-blue-700 tracking-tight">Техподдержка</h3>
        <div className="overflow-x-auto rounded-3xl shadow-2xl border border-gray-100 bg-white">
          <table className="min-w-full text-base">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="py-4 px-4 text-left font-bold text-blue-800">Пользователь</th>
                <th className="py-4 px-4 text-left font-bold text-blue-800">Вопрос</th>
                <th className="py-4 px-4 text-left font-bold text-blue-800">Статус</th>
                <th className="py-4 px-4 text-left font-bold text-blue-800">Создан</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 animate-pulse">Загрузка...</td></tr>
              ) : tickets.map(t => (
                <React.Fragment key={t.id}>
                  <tr
                    className={`group transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-b-0 ${openTicketId === t.id ? 'bg-yellow-100/80' : 'hover:bg-blue-50'}`}
                    onClick={() => setOpenTicketId(openTicketId === t.id ? null : t.id)}
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">{t.users?.username || 'Без username'} <span className="text-xs text-gray-400 ml-2">(ID: {t.users?.telegram_id})</span></td>
                    <td className="py-3 px-4 max-w-xs truncate flex items-center gap-2">{t.question}
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteTicket(t.id); }}
                        className="text-red-600 hover:text-red-700 text-xs border border-red-200 rounded px-2 py-0.5 ml-2 font-semibold cursor-pointer"
                        title="Удалить тикет"
                      >Удалить</button>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>
                        {t.status === 'open' ? 'Открыт' : t.status === 'answered' ? 'Отвечен' : 'Закрыт'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{formatOmskDate(t.created_at)}</td>
                  </tr>
                  {openTicketId === t.id && (
                    <tr>
                      <td colSpan={4} className="bg-blue-50 border-t px-6 py-6 rounded-b-3xl">
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-800">Вопрос от {t.users?.username || 'пользователя'}</h4>
                          <p className="text-gray-700 mb-4 text-lg">{t.question}</p>
                          {t.answer ? (
                            <div className="mb-4">
                              <h5 className="font-semibold mb-1 text-green-700">Ваш ответ:</h5>
                              <p className="text-gray-700 bg-green-50 rounded-lg p-3 shadow-inner">{t.answer}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Отправлен: {formatOmskDate(t.answered_at)}
                              </p>
                            </div>
                          ) : (
                            <form onSubmit={e => handleAnswer(e, t.id)} className="space-y-4">
                              <div>
                                <label className="block text-sm mb-1 font-semibold text-blue-800">Ваш ответ:</label>
                                <textarea
                                  value={answer}
                                  onChange={e => setAnswer(e.target.value)}
                                  required
                                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-xl px-4 py-3 h-28 outline-none transition-all duration-200 bg-blue-50 text-base resize-none shadow-sm"
                                  placeholder="Введите ответ пользователю..."
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all text-lg font-semibold shadow-md cursor-pointer"
                              >
                                Отправить ответ
                              </button>
                            </form>
                          )}
                          {success && <div className="text-green-600 mt-2 font-semibold animate-fade-in">{success}</div>}
                          {error && <div className="text-red-600 mt-2 font-semibold animate-fade-in">{error}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Панель шаблонов */}
      <div className="w-[420px] space-y-6">
        {/* Шаблоны */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-blue-800 text-lg">Шаблоны ответов</h4>
            <button
              onClick={() => setShowNewTemplate(!showNewTemplate)}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              {showNewTemplate ? 'Отмена' : '+ Новый шаблон'}
            </button>
          </div>

          {showNewTemplate && (
            <form onSubmit={handleCreateTemplate} className="mb-4 space-y-2">
              <input
                type="text"
                value={newTemplate.title}
                onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                placeholder="Название шаблона"
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 outline-none transition-all duration-200 bg-blue-50 font-semibold"
                required
              />
              <textarea
                value={newTemplate.content}
                onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Текст шаблона"
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-3 py-2 h-24 outline-none transition-all duration-200 bg-blue-50"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md cursor-pointer"
              >
                Сохранить шаблон
              </button>
            </form>
          )}

          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="border-2 border-blue-100 rounded-xl p-3 relative bg-blue-50 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-medium text-blue-800">{t.title}</h5>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold cursor-pointer"
                  >
                    Удалить
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{t.content}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnswer(t.content)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold cursor-pointer"
                  >
                    Использовать
                  </button>
                  <button
                    onClick={() => handleCopy(t.content)}
                    className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
                    title="Скопировать в буфер"
                  >
                    📋
                  </button>
                  {copySuccess && <span className="text-green-600 text-xs ml-2">{copySuccess}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 