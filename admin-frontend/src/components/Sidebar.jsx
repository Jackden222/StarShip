import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { key: 'users', label: 'Пользователи', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  )},
  { key: 'servers', label: 'Текущие серверы', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
  )},
  { key: 'keys', label: 'Ключи Outline', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z" /></svg>
  )},
  { key: 'promos', label: 'Промокоды', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6M15 14V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2h6z" /></svg>
  )},
  { key: 'broadcast', label: 'Рассылка', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  )},
  { key: 'support', label: 'Тикеты', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636A9 9 0 105.636 18.364 9 9 0 0018.364 5.636z" /></svg>
  )},
  { key: 'referrals', label: 'Рефералы', icon: (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 110 8 4 4 0 010-8z M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87" /></svg>
  )},
];

export default function Sidebar({ view, setView, handleLogout }) {
  const [hasNewTickets, setHasNewTickets] = useState(false);
  const [prevTicketsState, setPrevTicketsState] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const audioRef = useRef(new Audio('/notification.mp3'));
  const [ticketCount, setTicketCount] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer;
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('admin_token') || '';
        if (!token) return;
        const res = await fetch(`${apiUrl}/api/admin/tickets`, { headers: { Authorization: 'Bearer ' + token } });
        if (!res.ok) return;
        const data = await res.json();
        const hasOpenTickets = Array.isArray(data) && data.some(t => t.status === 'open');
        
        if (hasOpenTickets && !prevTicketsState) {
          console.log('Playing notification sound...');
          audioRef.current.play()
            .then(() => console.log('Sound played successfully'))
            .catch(err => console.error('Error playing sound:', err));
        }
        
        setPrevTicketsState(hasOpenTickets);
        setHasNewTickets(hasOpenTickets);
        setTicketCount(data.filter(ticket => ticket.status === 'open').length);
      } catch {}
      timer = setTimeout(fetchTickets, 10000);
    };
    fetchTickets();
    return () => timer && clearTimeout(timer);
  }, [prevTicketsState]);

  return (
    <>
      {isMobile && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg sm:top-6 sm:left-6"
        >
          {isOpen ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      )}

      <AnimatePresence>
        {(!isMobile || isOpen) && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed lg:relative w-[280px] sm:w-72 bg-gradient-to-b from-white via-blue-50 to-blue-100 border-r border-gray-200 flex flex-col py-6 sm:py-8 px-4 sm:px-6 min-h-screen shadow-xl rounded-r-3xl z-40"
          >
            {/* Лого */}
            <div className="flex items-center mb-8 sm:mb-12">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center mr-3 shadow-lg">
                <span className="text-white text-xl sm:text-2xl font-black">S</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">StarShipVPN</span>
            </div>
            {/* Навигация */}
            <nav className="flex-1 flex flex-col gap-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    if (isMobile) setIsOpen(false);
                  }}
                  className={
                    'flex items-center px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 mb-1 shadow-sm group cursor-pointer ' +
                    (view === item.key ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700')
                  }
                >
                  <span className="w-5 h-5 sm:w-6 sm:h-6 mr-2">{item.icon}</span>
                  {item.label}
                  {item.key === 'support' && (
                    <AnimatePresence>
                      {hasNewTickets && (
                        <motion.span
                          className="ml-2 inline-block align-middle"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                          <svg width="16" height="16" sm:width="18" sm:height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2C6.13 2 3 5.13 3 9V13L1 15V16H19V15L17 13V9C17 5.13 13.87 2 10 2ZM10 18C11.1 18 12 17.1 12 16H8C8 17.1 8.9 18 10 18Z" fill="#f59e42"/></svg>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  )}
                </button>
              ))}
            </nav>
            {/* User info */}
            <div className="mt-8 sm:mt-12 flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-blue-50 shadow-inner">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-base sm:text-lg">A</div>
              <div>
                <div className="font-semibold text-gray-800 text-sm sm:text-base">Admin</div>
                <div className="text-xs text-gray-500">Администратор</div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="mt-6 sm:mt-8 bg-red-500 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-red-600 transition-all shadow-md cursor-pointer text-sm sm:text-base"
            >
              Выйти
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
} 