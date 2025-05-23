import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function BroadcastTemplates() {
  const [templates, setTemplates] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/broadcast-templates');
    const data = await res.json();
    setTemplates(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/broadcast-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });

      if (!res.ok) throw new Error('Failed to create template');

      toast.success('Template created successfully');
      setTitle('');
      setContent('');
      fetchTemplates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
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

  const handleEdit = (template) => {
    setTitle(template.title);
    setContent(template.content);
    setEditingId(template.id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`/api/admin/broadcast-templates/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });

      if (!res.ok) throw new Error('Failed to update template');

      toast.success('Template updated successfully');
      setTitle('');
      setContent('');
      setEditingId(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Template' : 'Create Template'}
          </h2>
          
          <form onSubmit={editingId ? handleUpdate : handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
                {editingId ? 'Update' : 'Create'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setContent('');
                    setEditingId(null);
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Templates</h2>
          
          <div className="space-y-4">
            {templates.map(template => (
              <div key={template.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{template.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{template.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
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
    </motion.div>
  );
} 