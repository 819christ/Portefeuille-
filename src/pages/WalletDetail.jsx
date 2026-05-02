// src/pages/WalletDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import db from '../services/db';
import { DescriptionOverlay, ValidationModal, DeleteModal, ErrorModal } from '../components/Modals';

const WalletDetail = () => {
  const { id } = useParams();
  const walletId = parseInt(id);
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [descText, setDescText] = useState('');
  
  // Sheet State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null); // 'deposit', 'withdrawal', 'plan', 'wallet'
  
  // Modals
  const [validationTarget, setValidationTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Context Menu
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });
  const pressTimerRef = useRef(null);

  // Forms State
  const [walletForm, setWalletForm] = useState({ name: '', description: '' });
  const [txForm, setTxForm] = useState({ amount: '', reason: '' });
  const [planForm, setPlanForm] = useState({
    name: '', description: '', amount: '', type: 'withdrawal', date: new Date().toISOString().split('T')[0], freqVal: '', freqUnit: 'none'
  });

  const fetchData = async () => {
    const w = await db.getWalletById(walletId);
    if (!w) return navigate('/');
    setWallet(w);
    localStorage.setItem('lastWalletId', walletId);

    sessionStorage.setItem('agentContext', JSON.stringify({
      page: 'wallet-detail',
      label: w.name,
      walletId: w.id,
      walletName: w.name,
      balance: w.balance
    }));

    const p = await db.getPlanifications(walletId);
    setPlans(p);

    const h = await db.getHistory(walletId);
    setHistory(h);
  };

  useEffect(() => {
    fetchData();
    return () => {
      setSheetOpen(false);
      setContextMenu({ visible: false, x: 0, y: 0, target: null });
    };
  }, [walletId]);

  const trunc = (t, n = 38) => t && t.length > n ? t.slice(0, n) + '...' : (t || '');

  // ACTIONS
  const openTxModal = (type) => {
    setCurrentAction(type);
    setTxForm({ amount: '', reason: '' });
    setSheetOpen(true);
  };

  const openPlanModal = () => {
    setCurrentAction('plan');
    setPlanForm({
      name: '', description: '', amount: '', type: 'withdrawal', 
      date: new Date().toISOString().split('T')[0], freqVal: '', freqUnit: 'none'
    });
    setSheetOpen(true);
  };

  const submitForm = async () => {
    try {
      if (currentAction === 'wallet') {
        if (!walletForm.name) throw new Error("Le nom du portefeuille est obligatoire.");
        await db.updateWallet(walletId, { name: walletForm.name, description: walletForm.description });
      } else if (currentAction === 'plan') {
        const data = {
          walletId,
          label: planForm.name,
          description: planForm.description,
          amount: parseFloat(planForm.amount),
          type: planForm.type,
          startDate: new Date(planForm.date).getTime(),
          freqVal: parseInt(planForm.freqVal) || 0,
          freqUnit: planForm.freqUnit
        };
        if (!data.label) throw new Error("Le nom de la planification est obligatoire.");
        if (!data.amount || isNaN(data.amount)) throw new Error("Le montant est invalide.");
        if (!data.description) throw new Error("La description est obligatoire pour une planification.");
        if (isNaN(data.startDate)) throw new Error("La date de départ est invalide.");

        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (data.startDate < today.getTime() && !contextMenu.target) {
          throw new Error("Impossible de planifier une tâche dans le passé.");
        }

        if (contextMenu.target) await db.updatePlanification(contextMenu.target.id, data);
        else await db.addPlan(data);
      } else {
        const amount = parseFloat(txForm.amount);
        if (!amount || isNaN(amount)) throw new Error("Montant invalide");
        if (currentAction === 'withdrawal' && !txForm.reason) throw new Error("Le motif est obligatoire pour un retrait.");
        await db.addTx(walletId, amount, currentAction, txForm.reason);
      }
      setSheetOpen(false);
      setContextMenu({ visible: false, x: 0, y: 0, target: null });
      fetchData();
    } catch (e) {
      setErrorMsg(e.message);
    }
  };

  const handlePlanAction = async (p, isLate) => {
    if (isLate) {
      setContextMenu({ visible: false, x: 0, y: 0, target: { id: p.id, type: 'plan', name: p.label, item: p } });
      setCurrentAction('plan');
      setPlanForm({
        name: p.label, description: p.description || '', amount: p.amount, type: p.type, 
        date: new Date(p.startDate).toISOString().split('T')[0], freqVal: p.freqVal, freqUnit: p.freqUnit
      });
      setSheetOpen(true);
    } else {
      setValidationTarget(p);
    }
  };

  const confirmValidation = async (motif) => {
    try {
      await db.validatePlanification(validationTarget.id, motif);
      setValidationTarget(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de la validation");
    }
  };

  // LONG PRESS
  const handleTouchStart = (e, target) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (target.type === 'header') {
      pressTimerRef.current = setTimeout(() => {
        setContextMenu({ visible: false, x: 0, y: 0, target: null });
        setCurrentAction('wallet');
        setWalletForm({ name: wallet.name, description: wallet.description || '' });
        setSheetOpen(true);
      }, 800);
    } else {
      pressTimerRef.current = setTimeout(() => {
        setContextMenu({ visible: true, x: Math.min(x, window.innerWidth - 160), y, target });
      }, 600);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  // CONTEXT MENU
  const handleContextEdit = () => {
    if (contextMenu.target && contextMenu.target.type === 'plan') {
      const p = contextMenu.target.item;
      setCurrentAction('plan');
      setPlanForm({
        name: p.label, description: p.description || '', amount: p.amount, type: p.type, 
        date: new Date(p.startDate).toISOString().split('T')[0], freqVal: p.freqVal, freqUnit: p.freqUnit
      });
      setSheetOpen(true);
    }
    setContextMenu({ visible: false, x: 0, y: 0, target: contextMenu.target }); // Keep target but hide menu
  };

  const handleContextDelete = () => {
    setDeleteTarget(contextMenu.target);
    setContextMenu({ visible: false, x: 0, y: 0, target: null });
  };

  const confirmDelete = async () => {
    if (deleteTarget.type === 'plan') {
      await db.deletePlanification(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchData();
  };

  if (!wallet) return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <div className="flex-1 flex flex-col font-sans select-none overflow-hidden relative" onClick={() => setContextMenu({...contextMenu, visible: false})}>
      
      {/* STICKY TOP CONTAINER */}
      <div className="sticky top-0 z-40 bg-white">
        {/* HEADER SECTION */}
        <div 
          id="walletHeader"
          onMouseDown={(e) => handleTouchStart(e, { type: 'header' })}
          onTouchStart={(e) => handleTouchStart(e, { type: 'header' })}
          onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd} onTouchEnd={handleTouchEnd}
          className="bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-lg active:bg-emerald-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition">
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
            <div className="flex-1 text-center pr-10">
              <h1 onClick={(e) => { e.stopPropagation(); setDescText(wallet.name); }} className="font-bold text-xl truncate px-4 tracking-tight cursor-pointer">
                {wallet.name}
              </h1>
              {wallet.description ? (
                <p 
                  onClick={(e) => { e.stopPropagation(); setDescText(wallet.description); }} 
                  className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-1 cursor-pointer"
                  style={{ textDecoration: 'underline', textDecorationColor: 'rgba(167,243,208,0.4)' }}
                >
                  {trunc(wallet.description, 42)}
                </p>
              ) : (
                <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest mt-1">—</p>
              )}
            </div>
          </div>

          <div className="text-center pb-2">
            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Solde disponible</p>
            <div className="flex items-center justify-center gap-3">
              <h2 className={`text-4xl font-bold tabular-nums tracking-tight ${!balanceVisible ? 'balance-masked' : ''}`}>
                {balanceVisible ? `${wallet.balance.toLocaleString('fr-FR')} FCFA` : (
                  <><span className="balance-masked tracking-widest">••••••</span> <span className="text-2xl ml-1 font-bold opacity-30">FCFA</span></>
                )}
              </h2>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all active:scale-95 border border-white/10">
                <i className={`fa-solid ${balanceVisible ? 'fa-eye' : 'fa-eye-slash'} text-lg`}></i>
              </button>
            </div>
            <p className="text-emerald-100/60 text-[9px] mt-4 font-bold uppercase tracking-widest">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-around px-6 -mt-8 relative z-50">
          <button onClick={() => openTxModal('deposit')} className="bg-white w-20 h-20 rounded-[28px] shadow-xl shadow-emerald-900/5 flex flex-col items-center justify-center btn-active transition-all group border border-emerald-50">
            <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-emerald-100 transition-colors">
              <i className="fa-solid fa-arrow-up text-emerald-600 text-lg"></i>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Ajouter</span>
          </button>

          <button onClick={() => openTxModal('withdrawal')} className="bg-white w-20 h-20 rounded-[28px] shadow-xl shadow-red-900/5 flex flex-col items-center justify-center btn-active transition-all group border border-red-50">
            <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-red-100 transition-colors">
              <i className="fa-solid fa-arrow-down text-red-500 text-lg"></i>
            </div>
            <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">Retirer</span>
          </button>

          <button onClick={openPlanModal} className="bg-white w-20 h-20 rounded-[28px] shadow-xl shadow-orange-900/5 flex flex-col items-center justify-center btn-active transition-all group border border-orange-50">
            <div className="bg-orange-50 w-10 h-10 rounded-full flex items-center justify-center mb-1 group-hover:bg-orange-100 transition-colors">
              <i className="fa-solid fa-calendar-check text-orange-500 text-lg"></i>
            </div>
            <span className="text-[9px] text-orange-500 font-bold uppercase tracking-tighter">Planifier</span>
          </button>
        </div>
      </div>

      {/* MAIN SCROLL AREA */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* PLANIFICATIONS SECTION */}
        <div className="px-6 pt-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              Planifications
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full">{plans.length}</span>
            </h3>
          </div>
          <div className="space-y-4">
            {plans.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-[28px] text-gray-400 text-sm font-bold border border-dashed border-gray-100">Aucune planification</div>
            ) : (
              plans.map(p => {
                const nowMidnight = new Date(); nowMidnight.setHours(0, 0, 0, 0);
                const dueDate = new Date(p.nextDueDate); dueDate.setHours(0, 0, 0, 0);
                const daysDiff = Math.round((dueDate.getTime() - nowMidnight.getTime()) / 86400000);

                return (
                  <div 
                    key={p.id}
                    onMouseDown={(e) => handleTouchStart(e, { id: p.id, type: 'plan', name: p.label, item: p })}
                    onTouchStart={(e) => handleTouchStart(e, { id: p.id, type: 'plan', name: p.label, item: p })}
                    onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd} onTouchEnd={handleTouchEnd}
                    className={`plan-card bg-white border border-gray-100 shadow-sm rounded-[28px] p-4 flex justify-between items-center active:bg-gray-50 transition-all ${daysDiff < 0 ? 'border-red-100 bg-red-50/20' : ''}`}
                  >
                    <div className="flex gap-4 items-center min-w-0 flex-1">
                       <div className={`${daysDiff < 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                          <i className={`fa-solid ${daysDiff < 0 ? 'fa-triangle-exclamation' : 'fa-calendar-check'} text-lg`}></i>
                       </div>
                       <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 text-sm leading-tight truncate">
                          {p.label}
                          {daysDiff > 0 && daysDiff === 1 && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase font-black ml-1">Demain</span>}
                          {daysDiff > 0 && daysDiff === 2 && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase font-black ml-1">Dans 2 jours</span>}
                          {daysDiff === 0 && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md uppercase font-black ml-1">Aujourd'hui</span>}
                          {daysDiff === -1 && <span className="text-[8px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-md uppercase font-black ml-1">Hier</span>}
                          {daysDiff < -1 && <span className="text-[8px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-md uppercase font-black ml-1">En retard</span>}
                        </p>
                        {p.description && (
                          <p onClick={(e) => { e.stopPropagation(); setDescText(p.description); }} className="text-[10px] font-bold text-gray-400 opacity-70 cursor-pointer truncate underline decoration-gray-400/40">
                            {trunc(p.description, 40)}
                          </p>
                        )}
                        <p className="text-[10px] font-bold text-gray-400">{p.amount.toLocaleString('fr-FR')} FCFA • {new Date(p.nextDueDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    {daysDiff > 0 ? (
                      <div className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ml-2 border border-gray-200 shadow-inner">J-{daysDiff}</div>
                    ) : daysDiff === 0 ? (
                      <button onClick={(e) => { e.stopPropagation(); handlePlanAction(p, false); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all ml-2 shadow-lg shadow-emerald-100">Valider</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); handlePlanAction(p, true); }} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all ml-2 shadow-lg shadow-red-100"><i className="fa-solid fa-rotate"></i> Sync</button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TRANSACTIONS HISTORY */}
        <div className="px-6 pt-10 pb-20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 text-lg">Historique</h3>
            <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{history.length}</span>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-[28px] text-gray-400 text-sm font-bold border border-dashed border-gray-100">Aucun mouvement</div>
            ) : (
              history.map(t => (
                <div key={t.id} className="bg-white border border-gray-100 shadow-sm rounded-[28px] p-4 flex items-center justify-between active:bg-gray-50 transition-all">
                  <div className="flex gap-4 items-center min-w-0 flex-1">
                    <div className={`w-12 h-12 ${t.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <i className={`fa-solid ${t.type === 'deposit' ? 'fa-arrow-up' : 'fa-arrow-down'} text-lg`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 text-sm leading-none mb-0.5 truncate">{t.type === 'deposit' ? 'Dépôt' : 'Retrait'}</p>
                      {t.reason && (
                        <p onClick={(e) => { e.stopPropagation(); setDescText(t.reason); }} className="text-[10px] font-bold text-gray-400 cursor-pointer truncate underline decoration-gray-400/30">
                          {trunc(t.reason, 40)}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{new Date(t.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold text-sm ${t.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-[8px] font-bold text-gray-300 uppercase leading-none">FCFA</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CONTEXT MENU */}
      <div 
        className={`context-menu border border-gray-100 ${contextMenu.visible ? 'active' : ''}`}
        style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleContextEdit} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 rounded-xl">
          <i className="fa-solid fa-pen text-emerald-600"></i> Modifier
        </button>
        <button onClick={handleContextDelete} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 rounded-xl">
          <i className="fa-solid fa-trash"></i> Supprimer
        </button>
      </div>

      {/* UNIFIED BOTTOM SHEET */}
      <div className={`fixed inset-0 z-[100] ${sheetOpen ? '' : 'sheet-hidden'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSheetOpen(false)}></div>
        <div className={`absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] shadow-2xl p-8 flex flex-col max-h-[90vh] transition-transform duration-300 ease-out ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0"></div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {currentAction === 'deposit' ? "Déposer" : 
                 currentAction === 'withdrawal' ? "Retirer" : 
                 currentAction === 'wallet' ? "Modifier Portefeuille" : 
                 contextMenu.target ? "Modifier planification" : "Nouvelle planification"}
              </h3>
            </div>

            <div className="space-y-4 pb-6">
              {currentAction === 'wallet' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom du portefeuille</label>
                    <input type="text" value={walletForm.name} onChange={e => setWalletForm({...walletForm, name: e.target.value})} placeholder="ex: Mobile Money" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-2 border-transparent focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description / Précision</label>
                    <input type="text" value={walletForm.description} onChange={e => setWalletForm({...walletForm, description: e.target.value})} placeholder="N° de téléphone, usage..." className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium outline-none border-2 border-transparent focus:border-emerald-500" />
                  </div>
                </div>
              )}

              {(currentAction === 'deposit' || currentAction === 'withdrawal') && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Montant (FCFA)</label>
                    <input type="number" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} placeholder="0" className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-xl font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Motif / Précision</label>
                    <input type="text" value={txForm.reason} onChange={e => setTxForm({...txForm, reason: e.target.value})} placeholder="Note rapide..." className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm font-medium outline-none" />
                  </div>
                </div>
              )}

              {currentAction === 'plan' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom de la planification</label>
                    <input type="text" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} placeholder="ex: Loyer" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description / Précision</label>
                    <textarea value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} placeholder="Détails importants..." className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-medium outline-none h-20"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Montant</label>
                      <input type="number" value={planForm.amount} onChange={e => setPlanForm({...planForm, amount: e.target.value})} placeholder="0" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type</label>
                      <select value={planForm.type} onChange={e => setPlanForm({...planForm, type: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none border-none appearance-none">
                        <option value="withdrawal">Retrait</option>
                        <option value="deposit">Dépôt</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date de départ</label>
                    <input type="date" value={planForm.date} onChange={e => setPlanForm({...planForm, date: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fréquence</label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="number" 
                        value={planForm.freqVal} 
                        onChange={e => setPlanForm({...planForm, freqVal: e.target.value})} 
                        placeholder="Ex: 1" 
                        disabled={planForm.freqUnit === 'none'}
                        className={`w-1/3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold outline-none transition-all ${planForm.freqUnit === 'none' ? 'opacity-50' : ''}`} 
                      />
                      <select 
                        value={planForm.freqUnit} 
                        onChange={e => {
                          const unit = e.target.value;
                          setPlanForm({...planForm, freqUnit: unit, freqVal: unit === 'none' ? '' : planForm.freqVal});
                        }} 
                        className="w-2/3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl p-4 text-sm font-bold outline-none appearance-none transition-all"
                      >
                        <option value="none">Aucune (une fois)</option>
                        <option value="days">Jours</option>
                        <option value="weeks">Semaines</option>
                        <option value="months">Mois</option>
                        <option value="years">Années</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={submitForm} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-4">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>

      <DescriptionOverlay isOpen={!!descText} onClose={() => setDescText('')} text={descText} />
      <ValidationModal isOpen={!!validationTarget} onClose={() => setValidationTarget(null)} plan={validationTarget} onConfirm={confirmValidation} />
      <DeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} item={deleteTarget} onConfirm={confirmDelete} />
      <ErrorModal isOpen={!!errorMsg} onClose={() => setErrorMsg('')} message={errorMsg} />
    </div>
  );
};

export default WalletDetail;
