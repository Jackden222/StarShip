import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

export default function Broadcast({ token }) {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(''); // For scheduled broadcasts
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

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
    fetchScheduledBroadcasts();
  }, [token]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
} 