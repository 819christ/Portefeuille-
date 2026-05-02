import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Download = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Scroll to section if hash exists
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Utilisez le menu de votre navigateur pour 'Ajouter à l'écran d'accueil'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const sections = [
    {
      id: 'about',
      icon: 'fa-circle-info',
      title: 'À propos',
      color: 'bg-blue-50 text-blue-500',
      content: (
        <div className="space-y-4">
          <p className="text-gray-500 text-xs leading-relaxed font-medium">
            <strong>Portefeuille</strong> est une solution de gestion financière personnelle de nouvelle génération, conçue pour être à la fois puissante et accessible.
          </p>
          <p className="text-gray-500 text-xs leading-relaxed font-medium">
            Créé par <span className="text-emerald-600 font-bold">TCHIAKPE Christ Aurel</span>, ce projet vise à démocratiser le suivi budgétaire grâce à l'intelligence artificielle et une expérience utilisateur sans friction.
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      icon: 'fa-headset',
      title: 'Contact',
      color: 'bg-emerald-50 text-emerald-500',
      content: (
        <div className="grid grid-cols-1 gap-3">
          <a href="mailto:aureltchiakpe819@gmail.com" className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 active:scale-95 transition">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-envelope text-xs"></i>
            </div>
            <span className="text-xs font-bold text-gray-700">Email Support</span>
          </a>
          <a href="https://chat.whatsapp.com/KfnSKojgMBIBlpBdADBjmH" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 active:scale-95 transition">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-green-500">
              <i className="fa-brands fa-whatsapp text-xs"></i>
            </div>
            <span className="text-xs font-bold text-gray-700">WhatsApp Support</span>
          </a>
        </div>
      )
    },
    {
      id: 'version',
      icon: 'fa-code-branch',
      title: 'Versioning',
      color: 'bg-purple-50 text-purple-500',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Version Actuelle</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-[10px] font-black uppercase">1.5.0 Stable</span>
          </div>
          <p className="text-gray-500 text-xs font-medium leading-relaxed">
            Dernière mise à jour : 29 Avril 2026. <br/>
            Inclut l'Assistant IA, le support multidevises et les notifications natives Capacitor.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none pb-20 overflow-x-hidden">
      {/* HEADER HERO */}
      <div className="relative h-[45vh] bg-emerald-600 rounded-b-[60px] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl"></div>
        </div>

        <button 
          onClick={() => navigate('/settings')}
          className="absolute top-8 left-8 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center active:scale-90 transition border border-white/10 text-white"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 space-y-6"
        >
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl mx-auto">
            <i className="fa-solid fa-wallet text-4xl text-emerald-600"></i>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Portefeuille</h1>
            <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-[0.3em]">Version 1.5.0 Stable</p>
          </div>
        </motion.div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-md mx-auto w-full -mt-16 px-6 space-y-6 relative z-20">
        
        {/* INSTALL CARD */}
        <div className="bg-white p-8 rounded-[48px] shadow-2xl shadow-gray-200 border border-gray-50 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Installation</h2>
            <p className="text-gray-400 text-xs font-medium max-w-[200px] mx-auto">
              Optimisez votre expérience en installant l'application nativement.
            </p>
          </div>

            {!isInstalled ? (
              <button 
                onClick={handleInstall}
                className="w-full bg-emerald-600 text-white py-5 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-cloud-arrow-down"></i>
                Installer la PWA
              </button>
            ) : (
              <div className="bg-emerald-50 w-full p-4 rounded-[28px] border border-emerald-100 flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                  <i className="fa-solid fa-check text-xs"></i>
                </div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">PWA Installée</span>
              </div>
            )}

            <div className="w-full pt-2 flex flex-col items-center gap-4">
              <div className="w-full h-px bg-gray-100"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ou télécharger l'APK direct</p>
              <a 
                href="/downloads/portefeuille.apk" 
                download="portefeuille.apk"
                className="w-full bg-gray-900 text-white py-5 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-android text-emerald-500"></i>
                Télécharger l'APK
              </a>
              <p className="text-[9px] text-gray-400 font-medium italic">Recommandé pour une expérience native complète</p>
            </div>
          </div>

        {/* DYNAMIC SECTIONS */}
        <div className="space-y-4 pt-4">
          {sections.map((sec, idx) => (
            <motion.div 
              key={sec.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx }}
              id={sec.id}
              className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${sec.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <i className={`fa-solid ${sec.icon} text-lg`}></i>
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{sec.title}</h3>
              </div>
              {sec.content}
            </motion.div>
          ))}

          {/* RATING SECTION */}
          <motion.div 
            id="feedback"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 p-8 rounded-[40px] shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-star text-lg"></i>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Noter l'App</h3>
            </div>
            <p className="text-gray-400 text-xs font-medium leading-relaxed">
              Votre avis est essentiel pour nous aider à améliorer Portefeuille. Prenez quelques secondes pour nous noter.
            </p>
            <div className="flex justify-between px-2 pt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-all duration-300 ${star <= rating ? 'text-amber-500 scale-125' : 'text-gray-700 hover:text-gray-600'}`}
                >
                  <i className={`fa-${star <= rating ? 'solid' : 'regular'} fa-star`}></i>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <button className="w-full bg-white/10 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] active:scale-95 transition">
                Envoyer mon avis
              </button>
            )}
          </motion.div>
        </div>

        <div className="text-center pt-8 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Portefeuille PWA 2026</p>
        </div>
      </div>
    </div>
  );
};

export default Download;
