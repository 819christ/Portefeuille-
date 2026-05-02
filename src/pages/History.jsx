// src/pages/History.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/db';
import { DescriptionOverlay } from '../components/Modals';

const History = () => {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [descText, setDescText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const dbWallets = await db.getAllWallets();
      setWallets(dbWallets);
      
      const txs = await db.getAllTransactions();
      txs.sort((a, b) => b.date - a.date);
      setAllTransactions(txs);
      
      setLoading(false);

      sessionStorage.setItem('agentContext', JSON.stringify({"page":"history","label":"Historique"}));
    };
    fetchData();
  }, []);

  const walletMap = useMemo(() => {
    const map = {};
    wallets.forEach(w => map[w.id] = w);
    return map;
  }, [wallets]);

  const filteredTxs = useMemo(() => {
    if (currentFilter === 'all') return allTransactions;
    return allTransactions.filter(t => t.type === currentFilter);
  }, [allTransactions, currentFilter]);

  const { totalIn, totalOut, totalNet } = useMemo(() => {
    const sumIn = allTransactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const sumOut = allTransactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    return {
      totalIn: sumIn,
      totalOut: sumOut,
      totalNet: sumIn - sumOut
    };
  }, [allTransactions]);

  const groupedTxs = useMemo(() => {
    const groups = {};
    filteredTxs.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [filteredTxs]);

  const trunc = (t, n = 38) => t && t.length > n ? t.slice(0, n) + '...' : (t || '');

  return (
    <div className="flex-1 flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* STICKY TOP CONTAINER */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        {/* HEADER */}
        <div className="w-full bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
          {/* Decoration circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition backdrop-blur-sm border border-white/10">
                <i className="fa-solid fa-arrow-left text-lg"></i>
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Historique Global</h1>
                <p className="text-emerald-100/70 text-[9px] font-bold uppercase tracking-widest">Tous les portefeuilles</p>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
              <span className="text-[10px] font-black tracking-widest uppercase">{allTransactions.length} OPÉ.</span>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="col-span-2 bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-emerald-100/60 text-[9px] font-black uppercase tracking-widest mb-1">Flux Net Total</p>
                <h2 className="text-3xl font-black tabular-nums tracking-tight">{totalNet.toLocaleString('fr-FR')} FCFA</h2>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <i className="fa-solid fa-chart-line text-xl"></i>
              </div>
            </div>
            
            <div className="bg-emerald-500/30 rounded-2xl p-3 border border-white/5">
              <p className="text-emerald-100/70 text-[8px] font-black uppercase tracking-widest mb-1">Total Entrées</p>
              <p className="text-lg font-black tabular-nums text-white">{totalIn.toLocaleString('fr-FR')} FCFA</p>
            </div>
            
            <div className="bg-red-400/20 rounded-2xl p-3 border border-white/5">
              <p className="text-red-100/70 text-[8px] font-black uppercase tracking-widest mb-1">Total Sorties</p>
              <p className="text-lg font-black tabular-nums text-white">{totalOut.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="px-6 pt-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setCurrentFilter('all')} className={`filter-btn px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${currentFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>Tout</button>
          <button onClick={() => setCurrentFilter('deposit')} className={`filter-btn px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${currentFilter === 'deposit' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Entrées</button>
          <button onClick={() => setCurrentFilter('withdrawal')} className={`filter-btn px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${currentFilter === 'withdrawal' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>Sorties</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
        <div className="px-6 pt-4 space-y-1">
          {loading ? (
            <>
              <div className="animate-pulse bg-gray-100 h-5 w-24 rounded-full mb-3"></div>
              <div className="animate-pulse bg-gray-50 h-16 rounded-[24px] mb-2"></div>
              <div className="animate-pulse bg-gray-50 h-16 rounded-[24px] mb-2"></div>
              <div className="animate-pulse bg-gray-100 h-5 w-20 rounded-full mt-5 mb-3"></div>
              <div className="animate-pulse bg-gray-50 h-16 rounded-[24px] mb-2"></div>
            </>
          ) : filteredTxs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-clock-rotate-left text-gray-200 text-3xl"></i>
              </div>
              <p className="text-gray-400 text-sm font-bold">Aucune transaction</p>
              <p className="text-gray-300 text-xs font-medium mt-1">L'historique apparaîtra ici</p>
            </div>
          ) : (
            Object.entries(groupedTxs).map(([dateKey, txList]) => {
              const groupDate = new Date(dateKey);
              groupDate.setHours(0, 0, 0, 0);

              const today = new Date(); today.setHours(0, 0, 0, 0);
              const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

              let label;
              if (groupDate.getTime() === today.getTime()) {
                label = "Aujourd'hui";
              } else if (groupDate.getTime() === yesterday.getTime()) {
                label = "Hier";
              } else {
                label = groupDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                label = label.charAt(0).toUpperCase() + label.slice(1);
              }

              const dayIn = txList.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
              const dayOut = txList.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
              const dayNet = dayIn - dayOut;

              return (
                <div key={dateKey} className="mb-6">
                  <div className="date-group-header bg-white/80 flex items-center justify-between py-2 mb-3">
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
                    <span className={`text-[11px] font-black ${dayNet >= 0 ? 'text-emerald-500' : 'text-red-400'} tabular-nums`}>
                      {dayNet >= 0 ? '+' : ''}{dayNet.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="space-y-3">
                    {txList.map(t => {
                      const wallet = walletMap[t.walletId];
                      const walletName = wallet ? wallet.name : 'Wallet supprimé';
                      const mainLabel = t.type === 'deposit' ? 'Dépôt' : 'Retrait';
                      const subLabel = t.reason || '';
                      const time = new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={t.id} className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-4 flex items-center justify-between active:bg-gray-50 transition-all">
                          <div className="flex gap-3 items-center min-w-0 flex-1">
                            <div className={`w-11 h-11 ${t.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                              <i className={`fa-solid ${t.type === 'deposit' ? 'fa-arrow-up' : 'fa-arrow-down'} text-base`}></i>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-800 text-sm leading-none mb-1 truncate">{mainLabel}</p>
                              {subLabel && (
                                <p 
                                  className="text-[10px] font-bold text-gray-400 cursor-pointer" 
                                  onClick={(e) => { e.stopPropagation(); setDescText(subLabel); }}
                                  style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textDecoration: 'underline', textDecorationColor: 'rgba(156,163,175,0.4)' }}
                                >
                                  {trunc(subLabel, 38)}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full truncate max-w-[100px]">{walletName}</span>
                                <span className="text-gray-300 text-[9px] font-bold">{time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className={`font-bold text-sm ${t.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'} tabular-nums`}>
                              {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString('fr-FR')}
                            </p>
                            <p className="text-[8px] font-bold text-gray-300 uppercase">FCFA</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <DescriptionOverlay 
        isOpen={!!descText} 
        onClose={() => setDescText('')} 
        text={descText}
      />
    </div>
  );
};

export default History;
