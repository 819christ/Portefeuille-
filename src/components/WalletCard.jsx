// src/components/WalletCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const WalletCard = ({ wallet, isBalanceVisible, lastTx, pendingCount, onShowDescription, onLongPress }) => {
  const navigate = useNavigate();
  const pressTimerRef = React.useRef(null);
  
  const trunc = (t, n = 38) => t && t.length > n ? t.slice(0, n) + '...' : (t || '');

  const startPress = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    pressTimerRef.current = setTimeout(() => {
      if (onLongPress) onLongPress(e, wallet, x, y);
    }, 600);
  };
  const clearPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  return (
    <div 
      onMouseDown={startPress} onTouchStart={startPress}
      onMouseUp={clearPress} onMouseLeave={clearPress} onTouchEnd={clearPress} onTouchMove={clearPress}
      className="wallet-card bg-white border border-gray-100 shadow-md rounded-[32px] p-6 w-80 flex-shrink-0 cursor-pointer active:scale-95 transition-all relative overflow-hidden"
    >
      {pendingCount > 0 && (
        <div className="absolute top-0 right-0 p-2">
          <div className="bg-red-500 w-2 h-2 rounded-full ring-4 ring-white animate-pulse"></div>
        </div>
      )}
      <div>
        <div className="flex justify-between items-start mb-8" onClick={() => navigate(`/wallet-detail/${wallet.id}`)}>
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="font-bold text-gray-900 text-xl truncate leading-tight">{wallet.name}</h4>
            {wallet.description ? (
              <p 
                className="text-emerald-600/60 text-xs font-bold mt-1 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  onShowDescription(wallet.description);
                }}
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(52,211,153,0.4)'
                }}
              >
                {trunc(wallet.description, 36)}
              </p>
            ) : (
              <p className="text-gray-300 text-xs mt-1">—</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-black text-emerald-600 block leading-none tabular-nums">
              {isBalanceVisible ? (wallet.balance || 0).toLocaleString('fr-FR') : '••••'}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">FCFA</span>
          </div>
        </div>
        <div className="flex justify-between items-end" onClick={() => navigate(`/wallet-detail/${wallet.id}`)}>
          <div className="flex items-center gap-2">
            <div className={`${lastTx?.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'} w-8 h-8 rounded-full flex items-center justify-center`}>
              <i className={`fa-solid ${lastTx?.type === 'deposit' ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs`}></i>
            </div>
            <div>
              <p className={`text-xs font-black ${lastTx?.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
                {lastTx ? (lastTx.type === 'deposit' ? '+' : '-') + lastTx.amount.toLocaleString('fr-FR') : '0'} FCFA
              </p>
              <p className="text-[8px] font-bold text-gray-400 uppercase">Dernière opé.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
