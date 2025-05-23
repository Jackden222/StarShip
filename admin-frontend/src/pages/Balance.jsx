import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Balance = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAmount: 0,
    totalTransactions: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/admin/balance/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserTransactions = async (userId) => {
    try {
      const { data } = await axios.get(`/api/admin/balance/transactions/${userId}`);
      setTransactions(data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Статистика баланса</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Всего пополнивших</h3>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Общая сумма</h3>
          <p className="text-2xl font-bold">{stats.totalAmount} ₽</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Всего транзакций</h3>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-xl font-bold mb-4">Баланс пользователей</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Telegram ID</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Баланс (₽)</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-4 py-2">{u.telegram_id}</td>
                  <td className="px-4 py-2">{u.username || '—'}</td>
                  <td className="px-4 py-2 font-bold">{u.balance || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Транзакции пользователя</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Дата</th>
                  <th className="px-4 py-2">Звезды</th>
                  <th className="px-4 py-2">Сумма</th>
                  <th className="px-4 py-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-2">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{transaction.stars}</td>
                    <td className="px-4 py-2">{transaction.amount} ₽</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Balance; 