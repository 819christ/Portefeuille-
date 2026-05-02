// src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import db from '../services/db';

import Header from '../components/Header';
import WalletCard from '../components/WalletCard';
import PlanItem from '../components/PlanItem';
import ActionSheet from '../components/ActionSheet';
import { ValidationModal, ErrorModal, DescriptionOverlay, DeleteModal } from '../components/Modals';
import Splash from '../components/Splash';

const Home = () => {
  const { wallets, plans, loading, refreshData } = useDatabase();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletHistory, setWalletHistory] = useState({});
  const [showSplash, setShowSplash] = useState(!sessionStorage.getItem('splashShown'));
  
  // Sheet & Modal states
  const [sheetConfig, setSheetConfig] = useState({ isOpen: false, step: 1, action: null });
  const [validationPlan, setValidationPlan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [descText, setDescText] = useState('');
  
  // Context Menu
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, target: null });

  const fetchExtraData = useCallback(async () => {
    const count = await db.getUnreadNotifCount();
    setUnreadCount(count);

    const historyMap = {};
    for (const w of wallets) {
      const history = await db.getWalletHistory(w.id);
      historyMap[w.id] = history[0] || null;
    }
    setWalletHistory(historyMap);

    // Update agent context
    sessionStorage.setItem('agentContext', JSON.stringify({
      page: 'index',
      label: 'Accueil',
      wallets: wallets.map(w => `${w.name} (${w.balance} FCFA)`).join(', ')
    }));
  }, [wallets]);

  useEffect(() => {
    if (wallets.length > 0) {
      fetchExtraData();
    }
  }, [wallets, fetchExtraData]);

  // Close sheet on navigation
  useEffect(() => {
    return () => setSheetConfig({ isOpen: false, step: 1, action: null });
  }, []);

  const handleActionSubmit = async (data) => {
    try {
      if (data.type === 'wallet') {
        if (data.editId) {
          await db.updateWallet(data.editId, { name: data.name, description: data.description });
        } else {
          await db.createWallet(data.name, data.description);
        }
      } else if (data.type === 'deposit' || data.type === 'withdrawal') {
        await db.addTransaction(data.walletId, parseFloat(data.amount), data.type, data.reason);
      } else if (data.type === 'plan') {
        const planData = {
          walletId: data.walletId,
          label: data.name,
          description: data.description,
          amount: parseFloat(data.amount),
          type: data.planType,
          startDate: data.planDate,
          freqVal: data.planFreqVal,
          freqUnit: data.planFreqUnit
        };
        if (data.editId) {
          await db.updatePlanification(data.editId, planData);
        } else {
          await db.createPlanification(planData);
        }
      }
      refreshData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleValidatePlan = async (motif) => {
    try {
      await db.validatePlanification(validationPlan.id, motif);
      setValidationPlan(null);
      refreshData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLongPress = (e, item, x, y) => {
    e.preventDefault();
    e.stopPropagation();
    // type is 'wallet' or 'plan' based on what item has. Actually Wallet has balance, plan has nextDueDate
    const type = item.balance !== undefined ? 'wallet' : 'plan';
    setContextMenu({ visible: true, x: Math.min(x, window.innerWidth - 160), y, target: { ...item, type } });
  };

  const handleContextEdit = () => {
    if (!contextMenu.target) return;
    if (contextMenu.target.type === 'wallet') {
      // In React, editing a wallet requires opening the ActionSheet with action='wallet'
      setSheetConfig({ isOpen: true, step: 3, action: 'wallet', editItem: contextMenu.target });
      // Note: We need ActionSheet to support pre-filling for wallet edit, or we handle it here.
      // But in prototype, we just delete or rename wallets.
    } else if (contextMenu.target.type === 'plan') {
      // Plan edit needs ActionSheet 'plan' step
      setSheetConfig({ isOpen: true, step: 3, action: 'plan', editItem: contextMenu.target });
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleContextDelete = () => {
    setDeleteTarget(contextMenu.target);
    setContextMenu({ ...contextMenu, visible: false });
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'wallet') {
        await db.deleteWallet(deleteTarget.id);
      } else if (deleteTarget.type === 'plan') {
        await db.deletePlanification(deleteTarget.id);
      }
      setDeleteTarget(null);
      refreshData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleFabClick = () => {
    if (wallets.length === 0) {
      setSheetConfig({ isOpen: true, step: 3, action: 'wallet' });
    } else {
      setSheetConfig({ isOpen: true, step: 1, action: null });
    }
  };

  const handleNewWalletClick = () => {
    setSheetConfig({ isOpen: true, step: 3, action: 'wallet' });
  };

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  if (showSplash) {
    return <Splash onComplete={() => {
      setShowSplash(false);
      sessionStorage.setItem('splashShown', 'true');
    }} />;
  }

  return (
    <div className="flex-1 flex flex-col pb-32 relative" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
      <Header 
        totalBalance={totalBalance} 
        isBalanceVisible={isBalanceVisible} 
        toggleBalance={() => setIsBalanceVisible(!isBalanceVisible)}
        unreadCount={unreadCount}
      />

      {/* MAIN SCROLL AREA */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
        {/* MES PORTEFEUILLES */}
        <div className="pt-8 px-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-gray-800 text-lg">Mes portefeuilles</h3>
            <button 
              onClick={handleNewWalletClick}
              className="text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-bold btn-active transition-all"
            >
              <i className="fa-solid fa-plus-circle"></i> Nouveau
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6">
            {loading ? (
              <>
                <div className="animate-pulse bg-gray-100 w-80 h-44 rounded-[32px] flex-shrink-0"></div>
                <div className="animate-pulse bg-gray-100 w-80 h-44 rounded-[32px] flex-shrink-0"></div>
              </>
            ) : wallets.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 w-full rounded-[32px] p-10 flex flex-col items-center justify-center text-center">
                <i className="fa-solid fa-wallet text-gray-200 text-4xl mb-3"></i>
                <p className="text-gray-400 text-sm font-bold">Aucun portefeuille actif</p>
              </div>
            ) : (
              wallets.map(w => (
                <WalletCard 
                  key={w.id} 
                  wallet={w} 
                  isBalanceVisible={isBalanceVisible} 
                  lastTx={walletHistory[w.id]}
                  pendingCount={plans.filter(p => p.walletId === w.id && p.status === 'pending').length}
                  onShowDescription={(txt) => setDescText(txt)}
                  onLongPress={handleLongPress}
                />
              ))
            )}
          </div>
        </div>

        {/* PLANIFICATIONS */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              À faire aujourd'hui
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                {plans.filter(p => p.status === 'pending').length}
              </span>
            </h3>
            <button className="text-emerald-600 text-xs font-bold">Voir tout</button>
          </div>

          <div className="space-y-4">
            {plans.filter(p => p.status === 'pending').length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-[32px] text-gray-400 text-sm font-bold">Rien à faire</div>
            ) : (
              plans.filter(p => p.status === 'pending').map(p => (
                <PlanItem 
                  key={p.id} 
                  plan={p} 
                  onValidate={(p) => setValidationPlan(p)}
                  onLongPress={handleLongPress}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK TRANSACTION FAB */}
      <button 
        onClick={handleFabClick}
        className="fixed bottom-28 right-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-[0_10px_30px_rgba(5,150,105,0.4)] flex items-center justify-center z-40 btn-active transition-all ring-4 ring-white group hover:scale-110 active:scale-95"
      >
        <i className="fa-solid fa-plus text-2xl group-hover:rotate-90 transition-transform duration-300"></i>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 blur-lg animate-pulse -z-10"></div>
      </button>

      {/* OVERLAYS */}
      <ActionSheet 
        isOpen={sheetConfig.isOpen} 
        initialStep={sheetConfig.step}
        initialAction={sheetConfig.action}
        editItem={sheetConfig.editItem}
        onClose={() => setSheetConfig({ ...sheetConfig, isOpen: false, editItem: null })} 
        wallets={wallets}
        onSubmit={handleActionSubmit}
      />

      <ValidationModal 
        isOpen={!!validationPlan} 
        onClose={() => setValidationPlan(null)} 
        onConfirm={handleValidatePlan}
        plan={validationPlan}
      />

      <ErrorModal 
        isOpen={!!errorMsg} 
        onClose={() => setErrorMsg('')} 
        message={errorMsg}
      />

      <DescriptionOverlay 
        isOpen={!!descText} 
        onClose={() => setDescText('')} 
        text={descText}
      />

      <DeleteModal 
        isOpen={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        item={deleteTarget || {}} 
        onConfirm={confirmDelete} 
      />

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
    </div>
  );
};

export default Home;
