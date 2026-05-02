// src/components/Modals.jsx
import React, { useState } from 'react';

export const ValidationModal = ({ isOpen, onClose, onConfirm, plan }) => {
  const [motif, setMotif] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] p-6 shadow-2xl relative w-full max-w-sm overlay-in border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Valider l'opération</h3>
        <p className="text-sm font-bold text-gray-500 mb-6">{plan?.label || plan?.name}</p>
        <div className="mb-6">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
            Motif / Description <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={motif}
            onChange={e => setMotif(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition"
            placeholder="Ex: Loyer du mois..."
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm active:scale-95 transition">Annuler</button>
          <button onClick={() => { onConfirm(motif); setMotif(''); }} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition shadow-lg shadow-emerald-200">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export const ErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] p-6 shadow-2xl relative w-full max-w-sm overlay-in border border-gray-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Opération refusée</h3>
        <p className="text-sm font-medium text-gray-500 mb-8 px-4">{message}</p>
        <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm active:scale-95 transition shadow-lg shadow-gray-200">Compris</button>
      </div>
    </div>
  );
};

export const DescriptionOverlay = ({ isOpen, onClose, text }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] p-8 shadow-2xl relative max-w-sm w-full border border-gray-100 overlay-in">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center active:scale-90 transition shadow-sm">
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
          <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Description complète</h4>
        </div>
        <div className="text-gray-700 text-sm font-medium leading-relaxed max-h-56 overflow-y-auto scrollbar-hide">
          {text}
        </div>
      </div>
    </div>
  );
};

export const DeleteModal = ({ isOpen, onClose, onConfirm, item }) => {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[32px] p-6 shadow-2xl relative w-full max-w-sm overlay-in border border-gray-100">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <i className="fa-solid fa-trash-can text-xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Supprimer l'élément</h3>
        <p className="text-sm font-medium text-gray-500 text-center mb-6">
          Pour confirmer la suppression de <span className="font-bold text-gray-800">{item?.name}</span>, tapez son nom exact ci-dessous.
        </p>
        <div className="mb-6">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-red-50/50 border border-red-100 rounded-2xl px-4 py-3 text-sm font-bold text-red-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition text-center"
            placeholder="Nom de l'élément..."
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm active:scale-95 transition">Annuler</button>
          <button 
            onClick={() => {
              if (input.trim().toLowerCase() === item?.name?.trim().toLowerCase()) {
                onConfirm();
                setInput('');
              } else {
                alert("Le nom ne correspond pas exactement.");
              }
            }} 
            className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm active:scale-95 transition shadow-lg shadow-red-200"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};
