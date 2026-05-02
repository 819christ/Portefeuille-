import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PopupManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUpdate, setShowUpdate] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isStandaloneMode);

    // Simulate update detection (in a real app, this would come from a Service Worker or API)
    const lastUpdateCheck = localStorage.getItem('last_update_check');
    const now = Date.now();
    // Show update popup every 24 hours for demo purposes if not updated
    if (!lastUpdateCheck || now - parseInt(lastUpdateCheck) > 86400000) {
      setTimeout(() => setShowUpdate(true), 3000);
      localStorage.setItem('last_update_check', now.toString());
    }

    // Show install popup if not standalone and hasn't seen it in 1 hour
    const lastInstallCheck = localStorage.getItem('last_install_check');
    if (!isStandaloneMode && (!lastInstallCheck || now - parseInt(lastInstallCheck) > 3600000)) {
      setTimeout(() => setShowInstall(true), 6000);
      localStorage.setItem('last_install_check', now.toString());
    }
  }, []);

  // Hide popups when on specific pages to avoid UI clutter
  if (location.pathname === '/download' || location.pathname === '/assistant') return null;

  return (
    <AnimatePresence>
      {/* UPDATE POPUP */}
      {showUpdate && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 20, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-4 right-4 z-[999] max-w-md mx-auto"
        >
          <div className="bg-emerald-600 text-white p-4 rounded-3xl shadow-2xl shadow-emerald-200 border border-emerald-400 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <i className="fa-solid fa-cloud-arrow-up animate-bounce"></i>
              </div>
              <div className="truncate">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mise à jour</p>
                <p className="text-sm font-bold truncate">Version 1.6.0 disponible !</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setShowUpdate(false); navigate('/settings#update-section'); }}
                className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition"
              >
                Voir
              </button>
              <button 
                onClick={() => setShowUpdate(false)}
                className="w-8 h-8 bg-black/10 rounded-xl flex items-center justify-center hover:bg-black/20"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* INSTALL POPUP */}
      {showInstall && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: -100, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-4 right-4 z-[999] max-w-md mx-auto"
        >
          <div className="bg-gray-900 text-white p-6 rounded-[32px] shadow-2xl border border-gray-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                  <i className="fa-solid fa-wallet text-xl"></i>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">Installer l'App</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Expérience Premium</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstall(false)}
                className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center active:scale-90 transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <p className="text-xs text-gray-300 font-medium leading-relaxed">
              Ajoutez Portefeuille à votre écran d'accueil pour un accès rapide et hors-ligne.
            </p>

            <div className="flex gap-2">
              <button 
                onClick={() => { setShowInstall(false); navigate('/download'); }}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 active:scale-95 transition"
              >
                Installer maintenant
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PopupManager;
