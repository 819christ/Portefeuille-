// src/components/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ totalBalance, isBalanceVisible, toggleBalance, unreadCount }) => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="w-full bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-lg sticky top-0 z-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <i className="fa-solid fa-wallet text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Mon Portefeuille</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/download')}
            className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 active:scale-90 transition"
            title="Installer l'application">
            <i className="fa-solid fa-cloud-arrow-down text-lg"></i>
          </button>
          <button onClick={() => navigate('/notifications')}
            className="relative bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10 active:scale-90 transition">
            <i className="fa-solid fa-bell text-lg"></i>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-emerald-600 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-emerald-100 text-sm font-medium mb-1 tracking-wide">Solde total</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold tabular-nums tracking-tight">
              {isBalanceVisible ? `${totalBalance.toLocaleString('fr-FR')} FCFA` : '•••••• FCFA'}
            </h2>
          </div>
        </div>

        <button onClick={toggleBalance}
          className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 mb-1 backdrop-blur-sm border border-white/10">
          <i className={`fa-solid ${isBalanceVisible ? 'fa-eye' : 'fa-eye-slash'} text-xl`}></i>
        </button>
      </div>

      <p className="text-emerald-100/80 text-[10px] mt-4 font-bold uppercase tracking-[0.2em] opacity-80">
        {currentDate}
      </p>
    </div>
  );
};

export default Header;
