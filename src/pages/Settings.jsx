// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/db';

const Settings = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [aiName, setAiName] = useState('Assistant IA');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('groq');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('user_name') || '');
    setAiName(localStorage.getItem('ai_name') || 'Assistant IA');
    setApiKey(localStorage.getItem('assistant_api_key') || '');
    setProvider(localStorage.getItem('ai_provider') || 'groq');

    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 500);
    }
  }, []);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  const handleSave = () => {
    localStorage.setItem('user_name', userName);
    localStorage.setItem('ai_name', aiName);
    localStorage.setItem('assistant_api_key', apiKey);
    localStorage.setItem('ai_provider', provider);
    showToast('Paramètres enregistrés ✨');
    setTimeout(() => navigate('/'), 1000);
  };

  const handleClearChat = async () => {
    if (window.confirm("Effacer tout l'historique des conversations avec l'IA ?")) {
      await db.clearChatHistory();
      showToast("Historique effacé 🧹");
    }
  };

  const handleResetApp = () => {
    const confirmText = "RESET";
    const input = window.prompt(`Attention ! Cela supprimera TOUS vos portefeuilles, transactions et réglages. Tapez '${confirmText}' pour confirmer.`);
    if (input === confirmText) {
      window.indexedDB.deleteDatabase("PortefeuilleDB");
      localStorage.clear();
      showToast("Application réinitialisée 🏠");
      setTimeout(() => window.location.href = '/', 1500);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden font-sans select-none">
      {/* HEADER */}
      <div className="w-full bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition border border-white/10 backdrop-blur-sm">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-widest">Configuration & Profil</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-8 pb-32">
        {/* SECTION: PARAMÈTRES GÉNÉRAUX */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Paramètres Généraux</h3>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => navigate('/download#about')}
              className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-circle-info"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">À propos</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Infos sur le projet</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
            </button>

            <button onClick={() => navigate('/download#contact')}
              className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Contact</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Support et Assistance</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
            </button>

            <button onClick={() => navigate('/download#version')}
              className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-code-branch"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Versioning</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Version 1.5.0 (Stable)</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
            </button>

            <button onClick={() => navigate('/download#feedback')}
              className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-star"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Noter l'application</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Votre avis compte</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
            </button>
          </div>
        </section>

        {/* SECTION: CONFIGURATION IA */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Configuration IA</h3>
          
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-6">
            {/* Mon Profil */}
            <div>
              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Mon Profil</label>
              <div className="bg-white p-4 rounded-2xl border border-gray-100">
                 <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Votre nom"
                  className="w-full bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-300"/>
              </div>
            </div>

            {/* Nom Assistant */}
            <div>
              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Nom de l'Assistant</label>
              <div className="bg-white p-4 rounded-2xl border border-gray-100">
                <input type="text" value={aiName} onChange={e => setAiName(e.target.value)} placeholder="Ex: FinanceBot"
                  className="w-full bg-transparent border-none outline-none font-bold text-gray-700 placeholder:text-gray-300"/>
              </div>
            </div>

            {/* API Settings */}
            <div>
              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-4">Fournisseur & Clé API</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button onClick={() => setProvider('groq')}
                  className={`provider-btn p-3 rounded-2xl border-2 bg-white flex flex-col items-center gap-2 transition btn-active shadow-sm ${provider === 'groq' ? 'border-emerald-500 bg-emerald-50' : 'border-white'}`}>
                  <i className="fa-solid fa-bolt text-orange-500"></i>
                  <span className="text-[9px] font-black uppercase">Groq</span>
                </button>
                <button onClick={() => setProvider('google')}
                  className={`provider-btn p-3 rounded-2xl border-2 bg-white flex flex-col items-center gap-2 transition btn-active shadow-sm ${provider === 'google' ? 'border-emerald-500 bg-emerald-50' : 'border-white'}`}>
                  <i className="fa-brands fa-google text-blue-500"></i>
                  <span className="text-[9px] font-black uppercase">Google</span>
                </button>
                <button onClick={() => setProvider('cerebras')}
                  className={`provider-btn p-3 rounded-2xl border-2 bg-white flex flex-col items-center gap-2 transition btn-active shadow-sm ${provider === 'cerebras' ? 'border-emerald-500 bg-emerald-50' : 'border-white'}`}>
                  <i className="fa-solid fa-microchip text-purple-500"></i>
                  <span className="text-[9px] font-black uppercase">Cerebras</span>
                </button>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="••••••••••••••••"
                  className="w-full bg-white p-4 rounded-2xl border border-gray-100 outline-none focus:border-emerald-500 transition font-mono text-sm"/>
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <i className="fa-solid fa-eye text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: DONNÉES & SYSTÈME */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Système</h3>
          <div className="space-y-2">
            <button id="update-section" onClick={() => window.checkAppUpdate && window.checkAppUpdate()}
              className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-cloud-arrow-down"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Mise à jour</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Vérifier les nouvelles versions</p>
                </div>
              </div>
              <i className="fa-solid fa-rotate text-gray-200 text-xs"></i>
            </button>

            <button onClick={handleClearChat}
              className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-comment-slash"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Effacer le chat</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Supprimer l'historique IA</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-200 text-xs"></i>
            </button>

            <button onClick={handleResetApp}
              className="w-full p-5 bg-white rounded-3xl border border-red-50 flex items-center justify-between btn-active transition shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-trash-can"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-600">Réinitialiser l'application</p>
                  <p className="text-[9px] font-bold text-red-300 uppercase">Effacer TOUTES les données</p>
                </div>
              </div>
              <i className="fa-solid fa-triangle-exclamation text-red-100 text-xs"></i>
            </button>
          </div>
        </section>

        <div className="pt-4">
          <button onClick={handleSave}
            className="w-full bg-emerald-600 text-white p-5 rounded-[32px] font-black shadow-xl shadow-emerald-200 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm">
            Sauvegarder
          </button>
        </div>
      </div>

      {/* TOAST */}
      <div className={`fixed top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full text-xs font-bold z-[100] transition-all duration-300 ${toastMessage ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default Settings;
