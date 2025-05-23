import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function BroadcastTemplates({ token }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '', id: null });
  const [isEditing, setIsEditing] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/admin/broadcast-templates`, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка получения шаблонов');
      setTemplates(data.templates);
    } catch (error) {
      toast.error(error.message || 'Ошибка при получении шаблонов');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.title || !newTemplate.content) {
      toast.error('Название и содержание шаблона обязательны.');
      return;
    }
    setLoading(true);
    try {
      const url = isEditing 
        ? `${apiUrl}/api/admin/broadcast-templates/${newTemplate.id}`
        : `${apiUrl}/api/admin/broadcast-templates`;
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(newTemplate)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения шаблона');
      fetchTemplates();
      setNewTemplate({ title: '', content: '', id: null });
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Ошибка при сохранении шаблона');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/broadcast-templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления шаблона');
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || 'Ошибка при удалении шаблона');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    // ... rest of the component code ...
  );
} 