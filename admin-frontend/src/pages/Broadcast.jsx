import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

export default function Broadcast({ token }) {
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('message');
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка получения пользователей');
      setUsers(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/broadcast-templates`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка получения шаблонов');
      setTemplates(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchScheduledBroadcasts = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/scheduled-broadcasts`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка получения запланированных рассылок');
      setScheduledBroadcasts(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    if (!message.trim()) {
      setError('Введите сообщение для рассылки');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          user_ids: selectedUsers.length > 0 ? selectedUsers : null
        })
      });

      if (res.ok) {
        const { sent } = await res.json();
        setSuccess(`Сообщение отправлено ${sent} пользователям`);
        setMessage('');
        setSelectedUsers([]);
      } else {
        const error = await res.json();
        setError(error.error || 'Ошибка отправки сообщения');
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      setError('Ошибка отправки сообщения');
    }
  };

  const handleCreateTemplate = async e => {
    e.preventDefault();
    if (!newTemplate.title || !newTemplate.content) {
      setError('Заполните все поля шаблона');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/admin/broadcast-templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });

      if (res.ok) {
        const template = await res.json();
        setTemplates([template, ...templates]);
        setNewTemplate({ title: '', content: '' });
        setShowTemplateModal(false);
        setSuccess('Шаблон создан');
      } else {
        const error = await res.json();
        setError(error.error || 'Ошибка создания шаблона');
      }
    } catch (error) {
      setError('Ошибка создания шаблона');
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/broadcast-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id));
        setSuccess('Шаблон удален');
      } else {
        const error = await res.json();
        setError(error.error || 'Ошибка удаления шаблона');
      }
    } catch (error) {
      setError('Ошибка удаления шаблона');
    }
  };

  const handleUseTemplate = (content) => {
    setMessage(content);
    setActiveTab('message');
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Сообщение не может быть пустым.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки сообщения');
      toast.success('Сообщение успешно отправлено');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleBroadcast = async () => {
    if (!message.trim() || !scheduledAt) {
      toast.error('Сообщение и время обязательны.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/scheduled-broadcasts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ message, scheduledAt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка планирования рассылки');
      toast.success('Рассылка успешно запланирована');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScheduledBroadcast = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/scheduled-broadcasts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      if (!res.ok) throw new Error('Ошибка удаления рассылки');
      toast.success('Рассылка успешно удалена');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.telegram_id.toString().includes(searchQuery)
  );

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
    fetchScheduledBroadcasts();
  }, [token]);

  return (
    <div className="py-8 px-0 sm:px-8 w-full">
      <h3 className="text-3xl font-bold mb-8 text-blue-700 animate-fade-in tracking-tight">Рассылка</h3>
      
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-3xl mx-auto animate-fade-in">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('message')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'message' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Сообщение
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === 'templates' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Шаблоны
          </button>
        </div>

        {activeTab === 'message' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div>
              <label className="block text-lg mb-2 font-semibold text-blue-800">Сообщение</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-xl px-4 py-3 h-32 outline-none transition-all duration-200 bg-blue-50 text-base resize-none shadow-sm"
                placeholder="Введите сообщение для рассылки..."
              />
            </div>
            <div>
              <label className="block text-lg mb-2 font-semibold text-blue-800">Выберите пользователей (необязательно)</label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по username или telegram_id..."
                className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-xl px-4 py-2 mb-3 outline-none transition-all duration-200 bg-blue-50 text-base shadow-sm"
              />
              <div className="border-2 border-blue-100 rounded-2xl max-h-60 overflow-y-auto bg-white shadow-inner transition-all divide-y divide-blue-50">
                {loading ? (
                  <div className="p-6 text-center text-gray-500 animate-pulse">Загрузка...</div>
                ) : (
                  <div>
                    {filteredUsers.map(u => (
                      <label key={u.id} className={`flex items-center p-3 cursor-pointer transition-all duration-150 ${selectedUsers.includes(u.id) ? 'bg-blue-50' : 'hover:bg-blue-50'}`}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, u.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                            }
                          }}
                          className="mr-3 accent-blue-500 w-5 h-5"
                        />
                        <span className="font-medium text-gray-800">{u.username || 'Без username'} <span className="text-xs text-gray-400 ml-2">(ID: {u.telegram_id})</span></span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {selectedUsers.length > 0 
                  ? `Выбрано пользователей: ${selectedUsers.length}`
                  : 'Если никого не выбрать, сообщение будет отправлено всем пользователям'}
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all text-lg font-semibold shadow-md cursor-pointer"
            >
              Отправить
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-semibold text-blue-800">Шаблоны сообщений</h4>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all font-medium"
              >
                Создать шаблон
              </button>
            </div>
            
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-blue-800">{template.title}</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUseTemplate(template.content)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Использовать
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{template.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full">
            <h4 className="text-2xl font-bold text-blue-800 mb-6">Создать шаблон</h4>
            <form onSubmit={handleCreateTemplate} className="space-y-6">
              <div>
                <label className="block text-lg mb-2 font-semibold text-blue-800">Название шаблона</label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-xl px-4 py-2 outline-none transition-all duration-200 bg-blue-50 text-base"
                  placeholder="Например: Промокод на скидку"
                />
              </div>
              <div>
                <label className="block text-lg mb-2 font-semibold text-blue-800">Содержание</label>
                <textarea
                  value={newTemplate.content}
                  onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-xl px-4 py-3 h-32 outline-none transition-all duration-200 bg-blue-50 text-base resize-none"
                  placeholder="Введите текст шаблона..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all font-medium"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success && <div className="text-green-600 text-center font-semibold animate-fade-in mt-4">{success}</div>}
      {error && <div className="text-red-600 text-center font-semibold animate-fade-in mt-4">{error}</div>}
    </div>
  );
} 
 