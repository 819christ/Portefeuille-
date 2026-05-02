// src/components/Splash.jsx
import React, { useEffect, useState } from 'react';

const Splash = ({ onComplete }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
      setTimeout(onComplete, 500); // Wait for transition
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-overlay ${hidden ? 'splash-hidden' : ''}`}>
      <div className="mesh-gradient"></div>
      <div className="splash-content" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[32px] flex items-center justify-center shadow-2xl mb-6">
          <i className="fa-solid fa-wallet text-4xl text-white"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Portefeuille</h1>
        <p className="text-emerald-600 font-bold text-[9px] uppercase tracking-[0.4em]">Gestion Intelligente</p>
        <div className="progress-bar-splash"><div></div></div>
      </div>
    </div>
  );
};

export default Splash;
