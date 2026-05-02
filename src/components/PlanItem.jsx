// src/components/PlanItem.jsx
import React from 'react';

const PlanItem = ({ plan, onValidate, onLongPress }) => {
  const isLate = new Date(plan.nextDueDate) < new Date().setHours(0, 0, 0, 0);
  const pressTimerRef = React.useRef(null);

  const startPress = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    pressTimerRef.current = setTimeout(() => {
      if (onLongPress) onLongPress(e, plan, x, y);
    }, 600);
  };
  const clearPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  return (
    <div 
      onMouseDown={startPress} onTouchStart={startPress}
      onMouseUp={clearPress} onMouseLeave={clearPress} onTouchEnd={clearPress} onTouchMove={clearPress}
      className="bg-white border border-gray-100 p-5 rounded-[32px] flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm"
    >
      <div className={`w-12 h-12 ${plan.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        <i className={`fa-solid ${plan.type === 'deposit' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-lg`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 text-sm truncate leading-tight">{plan.label || plan.name}</h4>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
          {plan.amount.toLocaleString('fr-FR')} FCFA • <span className={isLate ? 'text-red-500' : ''}>{isLate ? 'En retard' : 'Aujourd\'hui'}</span>
        </p>
      </div>
      <button 
        onClick={() => onValidate(plan)}
        className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center active:scale-90 transition shadow-sm"
      >
        <i className="fa-solid fa-check"></i>
      </button>
    </div>
  );
};

export default PlanItem;
