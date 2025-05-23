import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[600px] relative animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-blue-700 text-2xl font-bold">×</button>
        {children}
      </div>
    </div>
  );
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export default function Referrals({ token }) {
  const [top, setTop] = useState([]);
  const [selected, setSelected] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Для рекламы
  const [adLinks, setAdLinks] = useState([]);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState('');
  const [adSuccess, setAdSuccess] = useState('');
  const [adCopy, setAdCopy] = useState('');
  const [adName, setAdName] = useState('');
  const [adDeleteLoading, setAdDeleteLoading] = useState('');

  useEffect(() => {
    fetch('/api/admin/referrals/top', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setTop);

    fetch('/api/admin/ad-ref-links', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setAdLinks);
  }, [token]);

  const loadList = (referrer_id) => {
    setLoading(true);
    setSelected(referrer_id);
    setModalOpen(true);
    fetch(`/api/admin/referrals/${referrer_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setList(data); setLoading(false); });
  };

  const handleGenerateAdLink = async (e) => {
    e.preventDefault();
    setAdLoading(true);
    setAdError('');
    setAdSuccess('');
    if (!adName.trim()) {
      setAdError('Введите название ссылки');
      setAdLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/ad-ref-links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: adName.trim() })
      });
      if (res.ok) {
        const link = await res.json();
        setAdLinks([link, ...adLinks]);
        setAdSuccess('Ссылка сгенерирована');
        setAdName('');
      } else {
        setAdError('Ошибка генерации ссылки');
      }
    } catch {
      setAdError('Ошибка генерации ссылки');
    } finally {
      setAdLoading(false);
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setAdCopy('Скопировано!');
    setTimeout(() => setAdCopy(''), 1500);
  };

  const handleDeleteAdLink = async (id) => {
    setAdDeleteLoading(id);
    setAdError('');
    try {
      const res = await fetch(`/api/admin/ad-ref-links/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAdLinks(adLinks.filter(l => l.id !== id));
      } else {
        setAdError('Ошибка удаления ссылки');
      }
    } catch {
      setAdError('Ошибка удаления ссылки');
    } finally {
      setAdDeleteLoading('');
    }
  };

  return (
    <div className="py-8 px-0 sm:px-8 w-full">
      {/* Блок для рекламных реферальных ссылок */}
      <div className="mb-8 bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 animate-fade-in">
        <h4 className="text-2xl font-bold mb-4 text-blue-700">Рекламные реферальные ссылки</h4>
        <form onSubmit={handleGenerateAdLink} className="flex gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">Название ссылки</label>
            <input
              type="text"
              value={adName}
              onChange={e => setAdName(e.target.value)}
              className="border-2 border-blue-200 focus:border-blue-500 rounded-xl px-4 py-2 outline-none transition-all duration-200 bg-blue-50 text-base"
              placeholder="Например: Реклама в Telegram"
              disabled={adLoading}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all font-semibold"
            disabled={adLoading}
          >
            {adLoading ? 'Генерация...' : 'Сгенерировать ссылку'}
          </button>
        </form>
        {adError && <div className="text-red-600 mb-2">{adError}</div>}
        {adSuccess && <div className="text-green-600 mb-2">{adSuccess}</div>}
        <div className="space-y-4">
          {adLinks.map(link => {
            const url = `https://t.me/StarShip_VPN_Tunel_bot?start=ref_${link.referrer_id}`;
            return (
              <div key={link.id} className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white bg-blue-600 rounded-xl px-2 py-1 mr-2">{link.name}</span>
                  <span className="font-mono text-blue-800 text-sm break-all">{url}</span>
                  <button
                    onClick={() => handleCopy(url)}
                    className="ml-2 px-3 py-1 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                  >
                    Копировать
                  </button>
                  <button
                    onClick={() => handleDeleteAdLink(link.id)}
                    className="ml-2 px-3 py-1 cursor-pointer bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
                    disabled={adDeleteLoading === link.id}
                  >
                    {adDeleteLoading === link.id ? 'Удаление...' : 'Удалить'}
                  </button>
                  {adCopy && <span className="text-green-600 ml-2 text-xs">{adCopy}</span>}
                </div>
                <div className="text-xs text-gray-500">Создана: {link.created_at ? new Date(link.created_at).toLocaleString('ru-RU') : '-'}</div>
                <div className="flex gap-6 mt-2">
                  <div>Переходов: <b>{link.clicks ?? 0}</b></div>
                  <div>Регистраций: <b>{link.registrations ?? 0}</b></div>
                  <div className="text-white bg-green-600 rounded-xl px-2 py-1">Платных: <b>{link.paid ?? 0}</b></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <h3 className="text-3xl font-bold mb-8 text-blue-700 animate-fade-in tracking-tight">Рефералы</h3>
      <div className="overflow-x-auto rounded-3xl shadow-2xl border border-gray-100 bg-white animate-fade-in mb-8">
        <table className="min-w-full text-base">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th className="py-4 px-4 text-left font-bold text-blue-800">#</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Username</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Кол-во приглашённых</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Купили подписку</th>
              <th className="py-4 px-4 text-left font-bold text-blue-800">Детали</th>
            </tr>
          </thead>
          <tbody>
            {top.map((u, i) => (
              <tr key={u.referrer_id} className="group transition-all duration-200 hover:bg-blue-50 border-b border-gray-100 last:border-b-0">
                <td className="py-3 px-4">{i + 1}</td>
                <td className="py-3 px-4 font-mono">{u.username || u.referrer_id}</td>
                <td className="py-3 px-4 font-bold">{u.count}</td>
                <td className="py-3 px-4 font-bold text-green-700">{u.paid_count}</td>
                <td className="py-3 px-4">
                  <button onClick={() => loadList(u.referrer_id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all font-semibold cursor-pointer">Показать</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h4 className="text-xl font-bold mb-4 text-blue-700">Приглашённые пользователем</h4>
        {loading ? <div>Загрузка...</div> : (
          <table className="min-w-full text-base">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="py-2 px-2 text-left font-bold text-blue-800">ID</th>
                <th className="py-2 px-2 text-left font-bold text-blue-800">Username</th>
                <th className="py-2 px-2 text-left font-bold text-blue-800">Telegram ID</th>
                <th className="py-2 px-2 text-left font-bold text-blue-800">Баланс</th>
                <th className="py-2 px-2 text-left font-bold text-blue-800">Подписка до</th>
                <th className="py-2 px-2 text-left font-bold text-blue-800">Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2 px-2 font-mono text-xs">{u.id}</td>
                  <td className="py-2 px-2">{u.username}</td>
                  <td className="py-2 px-2">{u.telegram_id}</td>
                  <td className="py-2 px-2">{u.balance ?? 0}</td>
                  <td className="py-2 px-2">{u.subscription_end ? new Date(u.subscription_end).toLocaleString('ru-RU') : '-'}</td>
                  <td className="py-2 px-2">{u.created_at ? new Date(u.created_at).toLocaleString('ru-RU') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
} 
