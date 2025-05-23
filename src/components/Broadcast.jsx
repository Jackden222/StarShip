import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [templates, setTemplates] = useState([]);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchScheduledBroadcasts();
    fetchUsers();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/broadcast-templates');
    const data = await res.json();
    setTemplates(data);
  };

  const fetchScheduledBroadcasts = async () => {
    const res = await fetch('/api/admin/scheduled-broadcasts');
    const data = await res.json();
    setScheduledBroadcasts(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  const handleTemplateSelect = (template) => {
    setMessage(template.content);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        message,
        scheduled_at: scheduledAt || null,
        user_ids: selectedUsers.length > 0 ? selectedUsers : null
      };

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to send broadcast');

      toast.success('Broadcast sent successfully');
      setMessage('');
      setScheduledAt('');
      setSelectedUsers([]);
      fetchScheduledBroadcasts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteScheduled = async (id) => {
    try {
      const res = await fetch(`/api/admin/scheduled-broadcasts/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete scheduled broadcast');

      toast.success('Scheduled broadcast deleted');
      fetchScheduledBroadcasts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/broadcast-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: templateTitle, content: templateContent })
      });

      if (!res.ok) throw new Error('Failed to create template');

      toast.success('Template created successfully');
      setTemplateTitle('');
      setTemplateContent('');
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTemplateDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/broadcast-templates/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete template');

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTemplateEdit = (template) => {
    setTemplateTitle(template.title);
    setTemplateContent(template.content);
    setEditingTemplateId(template.id);
  };

  const handleTemplateUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`/api/admin/broadcast-templates/${editingTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: templateTitle, content: templateContent })
      });

      if (!res.ok) throw new Error('Failed to update template');

      toast.success('Template updated successfully');
      setTemplateTitle('');
      setTemplateContent('');
      setEditingTemplateId(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Send Broadcast</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Templates
            </label>
            <select 
              className="w-full p-2 border rounded"
              onChange={(e) => handleTemplateSelect(templates.find(t => t.id === e.target.value))}
            >
              <option value="">Select template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Users (optional)
              </label>
              <select
                multiple
                value={selectedUsers}
                onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full p-2 border rounded"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.telegram_id}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              {scheduledAt ? 'Schedule Broadcast' : 'Send Now'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingTemplateId ? 'Edit Template' : 'Create Template'}
          </h2>
          
          <form onSubmit={editingTemplateId ? handleTemplateUpdate : handleTemplateSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                {editingTemplateId ? 'Update' : 'Create'}
              </button>
              
              {editingTemplateId && (
                <button
                  type="button"
                  onClick={() => {
                    setTemplateTitle('');
                    setTemplateContent('');
                    setEditingTemplateId(null);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Templates</h3>
            <div className="space-y-3">
              {templates.map(template => (
                <div key={template.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{template.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{template.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTemplateEdit(template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTemplateDelete(template.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Scheduled Broadcasts</h2>
          
          <div className="space-y-4">
            {scheduledBroadcasts.map(broadcast => (
              <div key={broadcast.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{broadcast.message}</p>
                    <p className="text-sm text-gray-500">
                      Scheduled for: {new Date(broadcast.scheduled_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {broadcast.status}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteScheduled(broadcast.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 