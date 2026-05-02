// src/components/ActionSheet.jsx
import React, { useState, useEffect } from 'react';

const ActionSheet = ({ isOpen, onClose, wallets, onSubmit, initialStep = 1, initialAction = null, editItem = null }) => {
  const [step, setStep] = useState(initialStep); // 1: Select Wallet, 2: Select Action, 3: Form
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [actionType, setActionType] = useState(initialAction); // 'deposit', 'withdrawal', 'plan', 'wallet'
  
  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    name: '',
    description: '',
    planDate: new Date().toISOString().split('T')[0],
    planFreqVal: '1',
    planFreqUnit: 'months',
    planType: 'withdrawal'
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      setStep(initialStep);
      setActionType(initialAction);
      
      if (editItem) {
        if (initialAction === 'wallet') {
          setFormData(prev => ({
            ...prev,
            name: editItem.name || '',
            description: editItem.description || ''
          }));
        } else if (initialAction === 'plan') {
          setFormData(prev => ({
            ...prev,
            name: editItem.label || '',
            description: editItem.description || '',
            amount: editItem.amount?.toString() || '',
            planType: editItem.type || 'withdrawal',
            planDate: editItem.startDate ? new Date(editItem.startDate).toISOString().split('T')[0] : prev.planDate,
            planFreqVal: editItem.freqVal?.toString() || '',
            planFreqUnit: editItem.freqUnit || 'none'
          }));
          if (editItem.walletId) {
            setSelectedWallet(wallets.find(w => w.id === editItem.walletId) || null);
          }
        }
      } else {
        // Reset form if opening without editItem
        setFormData({
          amount: '', reason: '', name: '', description: '',
          planDate: new Date().toISOString().split('T')[0],
          planFreqVal: '1', planFreqUnit: 'months', planType: 'withdrawal'
        });
      }

      window.addEventListener('keydown', handleEsc);
    } else {
      setTimeout(() => {
        setStep(1);
        setSelectedWallet(null);
        setActionType(null);
      }, 300);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, initialStep, initialAction, onClose]);

  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
    setStep(2);
  };

  const handleActionSelect = (type) => {
    setActionType(type);
    setStep(3);
  };

  const handleSubmit = () => {
    onSubmit({
      walletId: selectedWallet?.id,
      type: actionType,
      editId: editItem?.id,
      ...formData
    });
    // Form data reset is handled via the close effect or next open
    setFormData({
      amount: '', reason: '', name: '', description: '',
      planDate: new Date().toISOString().split('T')[0],
      planFreqVal: '1', planFreqUnit: 'months', planType: 'withdrawal'
    });
    onClose();
  };

  const back = () => {
    if (step === 3) {
      if (initialAction) onClose(); // If we started straight at the form, back closes it
      else setStep(2);
    }
    else if (step === 2) setStep(1);
  };

  return (
    <div id="actionSheet" className={`fixed inset-0 z-[10010] ${isOpen ? '' : 'sheet-hidden'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div id="actionSheetContent" className={`absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] shadow-2xl p-8 flex flex-col max-h-[90vh] ${isOpen ? '' : 'sheet-content-hidden'}`}>
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0"></div>

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center text-gray-800">Sélectionner un portefeuille</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
              {wallets.map(w => (
                <button 
                  key={w.id}
                  onClick={() => handleWalletSelect(w)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-emerald-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <i className="fa-solid fa-wallet"></i>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{w.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{w.balance.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-500"></i>
                </button>
              ))}
              <button 
                onClick={() => { setActionType('wallet'); setStep(3); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-emerald-200 hover:text-emerald-500 transition-all"
              >
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-plus"></i>
                </div>
                Nouveau portefeuille
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={back} className="text-gray-400"><i className="fa-solid fa-arrow-left"></i></button>
              <h3 className="text-xl font-bold text-gray-800">Choisir une action</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleActionSelect('deposit')} className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 font-bold active:scale-95 transition">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center"><i className="fa-solid fa-arrow-up"></i></div>
                Ajouter de l'argent
              </button>
              <button onClick={() => handleActionSelect('withdrawal')} className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 font-bold active:scale-95 transition">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center"><i className="fa-solid fa-arrow-down"></i></div>
                Retirer de l'argent
              </button>
              <button onClick={() => handleActionSelect('plan')} className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-600 font-bold active:scale-95 transition">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center"><i className="fa-solid fa-calendar-check"></i></div>
                Créer une planification
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={back} className="text-gray-400"><i className="fa-solid fa-arrow-left"></i></button>
              <h3 className="text-xl font-bold text-gray-800">
                {actionType === 'wallet' ? (editItem ? 'Modifier portefeuille' : 'Nouveau portefeuille') : 
                 actionType === 'plan' ? (editItem ? 'Modifier planification' : 'Planification') : 'Transaction'}
              </h3>
            </div>

            <div className="space-y-4 pb-6">
              {actionType === 'wallet' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom du portefeuille</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Mobile Money" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-500"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description / Précision</label>
                    <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="N° de téléphone, usage..." className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium outline-none border-2 border-transparent focus:border-emerald-500"/>
                  </div>
                </>
              )}

              {(actionType === 'deposit' || actionType === 'withdrawal') && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Montant (FCFA)</label>
                    <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-xl font-bold outline-none"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Motif / Précision</label>
                    <input type="text" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Note rapide..." className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-medium outline-none"/>
                  </div>
                </>
              )}

              {actionType === 'plan' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom de la planification</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Loyer" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-500 transition-all"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Détails..." className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium outline-none h-20 border-2 border-transparent focus:border-emerald-500 transition-all"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Montant (FCFA)</label>
                      <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-500 transition-all"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                      <select value={formData.planType} onChange={e => setFormData({...formData, planType: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-500 transition-all">
                        <option value="withdrawal">Retrait</option>
                        <option value="deposit">Dépôt</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date de début</label>
                    <input type="date" value={formData.planDate} onChange={e => setFormData({...formData, planDate: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-500 transition-all"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fréquence</label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="number" 
                        value={formData.planFreqVal} 
                        onChange={e => setFormData({...formData, planFreqVal: e.target.value})} 
                        placeholder="Ex: 1" 
                        disabled={formData.planFreqUnit === 'none'}
                        className={`w-1/3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold outline-none transition-all ${formData.planFreqUnit === 'none' ? 'opacity-50' : ''}`}
                      />
                      <select 
                        value={formData.planFreqUnit} 
                        onChange={e => {
                          const unit = e.target.value;
                          setFormData({...formData, planFreqUnit: unit, planFreqVal: unit === 'none' ? '' : formData.planFreqVal});
                        }} 
                        className="w-2/3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                      >
                        <option value="none">Aucune (une fois)</option>
                        <option value="days">Jour(s)</option>
                        <option value="weeks">Semaine(s)</option>
                        <option value="months">Mois</option>
                        <option value="years">Année(s)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-4">
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionSheet;
