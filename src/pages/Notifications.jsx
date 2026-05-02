// src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../services/db';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const notifs = await db.getNotifications();
    setNotifications(notifs);
    setLoading(false);
    sessionStorage.setItem('agentContext', JSON.stringify({ page: "notifications", label: "Notifications" }));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRead = async (id) => {
    await db.markAsRead(id);
    await fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await db.markAllNotificationsAsRead();
    await fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* HEADER */}
      <div className="w-full bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center active:scale-90 transition border border-white/10 backdrop-blur-sm">
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
            <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-widest">Alertes et Rappels</p>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex justify-between items-center">
          <div>
            <p className="text-2xl font-black tabular-nums">{unreadCount}</p>
            <p className="text-emerald-100/60 text-[9px] font-black uppercase tracking-widest">Non lues</p>
          </div>
          <button onClick={handleMarkAllAsRead} className="bg-white/20 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition border border-white/10">Tout marquer</button>
        </div>
      </div>

      {/* NOTIF LIST */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pt-6 pb-24">
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-gray-50 rounded-full w-1/2"></div>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-bell-slash text-gray-200 text-3xl"></i>
              </div>
              <p className="text-gray-400 text-sm font-bold">Aucune notification</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-[28px] border ${n.read ? 'bg-white border-gray-100 opacity-60' : 'bg-emerald-50/30 border-emerald-100 shadow-sm'} flex gap-4 items-start transition-all`}>
                <div className={`w-12 h-12 ${n.type === 'alert' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <i className={`fa-solid ${n.type === 'alert' ? 'fa-triangle-exclamation' : 'fa-calendar-check'} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 text-sm leading-tight">{n.title}</h4>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(n.date).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(n.date).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}</p>
                    {!n.read ? (
                      <button onClick={() => handleRead(n.id)} className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider bg-emerald-100/50 px-3 py-1.5 rounded-lg active:scale-90 transition">
                        <i className="fa-solid fa-circle-check"></i> Lu
                      </button>
                    ) : (
                      <span className="text-gray-400 font-bold text-[9px] uppercase"><i className="fa-solid fa-check-double"></i> Lu</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
