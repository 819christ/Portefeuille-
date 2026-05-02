// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'fa-house-chimney', label: 'Accueil' },
    { path: '/assistant', icon: 'fa-robot', label: 'Assistant' },
    { path: '/history', icon: 'fa-clock-rotate-left', label: 'Historique' },
    { path: '/settings', icon: 'fa-gear', label: 'Réglages' }
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-gray-100 px-6 py-3 flex justify-around items-center z-50 rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.1)]" style={{ width: 'calc(100% - 3rem)' }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`${isActive ? 'text-emerald-600' : 'text-gray-400 opacity-70'} flex flex-col items-center gap-1.5 transition-all`}
          >
            <div className={`${isActive ? 'bg-emerald-50' : ''} p-2 rounded-xl`}>
              <i className={`fa-solid ${item.icon} text-lg`}></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
