// src/components/Layout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AIAgent from './AIAgent';
import PopupManager from './PopupManager';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Accueil', icon: 'fa-house-chimney' },
    { path: '/assistant', label: 'Assistant', icon: 'fa-robot' },
    { path: '/history', label: 'Historique', icon: 'fa-clock-rotate-left' },
    { path: '/settings', label: 'Réglages', icon: 'fa-gear' },
  ];

  return (
    <div className="max-w-md mx-auto w-full bg-white h-screen shadow-xl flex flex-col relative overflow-hidden">
      {/* Top Safe Area Spacer */}
      <div style={{ height: 'env(safe-area-inset-top)', minHeight: '10px' }} className="w-full bg-white shrink-0"></div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col relative scrollbar-hide pb-36 pt-4">
        {children}
      </main>

      {/* Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 w-full bg-white/90 backdrop-blur-2xl border-t border-gray-100 px-6 pt-5 flex justify-around items-center z-50 rounded-t-[32px] shadow-[0_-15px_50px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              location.pathname === item.path ? 'text-emerald-600 scale-110' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Persistent AI Agent Widget */}
      <AIAgent />
      
      {/* Global Popups */}
      <PopupManager />
    </div>
  );
};

export default Layout;
