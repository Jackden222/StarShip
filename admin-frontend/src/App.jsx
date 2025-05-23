import Balance from './pages/Balance';
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Support from './pages/Support';
import Broadcast from './pages/Broadcast';
import Promos from './pages/PromoCodes';
import Referrals from './pages/Referrals';
import Servers from './pages/Servers';

const ADMIN_TOKEN = localStorage.getItem('admin_token') || '';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Восстанавливаем страницу из localStorage при загрузке
    return localStorage.getItem('currentPage') || 'dashboard';
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Сохраняем страницу в localStorage при изменении
    localStorage.setItem('currentPage', page);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">StarShipVPN Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => handlePageChange('dashboard')}
                  className={`${
                    currentPage === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handlePageChange('users')}
                  className={`${
                    currentPage === 'users'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Пользователи
                </button>
                <button
                  onClick={() => handlePageChange('tickets')}
                  className={`${
                    currentPage === 'tickets'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Тикеты
                </button>
                <button
                  onClick={() => handlePageChange('broadcast')}
                  className={`${
                    currentPage === 'broadcast'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Рассылка
                </button>
                <button
                  onClick={() => handlePageChange('promos')}
                  className={`${
                    currentPage === 'promos'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Промокоды
                </button>
                <button
                  onClick={() => handlePageChange('referrals')}
                  className={`${
                    currentPage === 'referrals'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Рефералы
                </button>
                <button
                  onClick={() => handlePageChange('servers')}
                  className={`${
                    currentPage === 'servers'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Серверы
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'users' && <Users />}
        {currentPage === 'tickets' && <Support />}
        {currentPage === 'broadcast' && <Broadcast token={ADMIN_TOKEN} />}
        {currentPage === 'promos' && <Promos />}
        {currentPage === 'referrals' && <Referrals />}
        {currentPage === 'servers' && <Servers />}
      </main>
    </div>
  );
}

export default App;
 