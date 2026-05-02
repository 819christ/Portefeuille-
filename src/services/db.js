// src/services/db.js
// Gestion centralisée du stockage local avec IndexedDB (Portefeuille React)

const DB_NAME = "PortefeuilleDB";
const DB_VERSION = 4;

import { schedulePlanNotification, cancelPlanNotification } from './notifications';

let dbInstance = null;

export const initDB = async () => {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const d = e.target.result;
      
      if (!d.objectStoreNames.contains("wallets")) {
        d.createObjectStore("wallets", { keyPath: "id", autoIncrement: true });
      }
      
      if (!d.objectStoreNames.contains("transactions")) {
        d.createObjectStore("transactions", { keyPath: "id", autoIncrement: true })
         .createIndex("walletId", "walletId", { unique: false });
      }
      
      if (!d.objectStoreNames.contains("planifications")) {
        d.createObjectStore("planifications", { keyPath: "id", autoIncrement: true })
         .createIndex("walletId", "walletId", { unique: false });
      }
      
      if (!d.objectStoreNames.contains("notifications")) {
        d.createObjectStore("notifications", { keyPath: "id", autoIncrement: true });
      }
      
      if (!d.objectStoreNames.contains("chat_history")) {
        d.createObjectStore("chat_history", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log("✅ Database Initialized (v" + DB_VERSION + ")");
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("❌ Database Error:", event.target.error);
      reject(event.target.error);
    };
  });
};

export const getDB = async () => {
  if (dbInstance) return dbInstance;
  return await initDB();
};

// ====================== PORTFEUILLES (WALLETS) ======================
export const createWallet = async (name, description = "") => {
  const d = await getDB();
  const tx = d.transaction("wallets", "readwrite");
  const request = tx.objectStore("wallets").add({ 
    name, 
    description, 
    balance: 0, 
    createdAt: Date.now() 
  });
  return new Promise(r => request.onsuccess = () => r(request.result));
};

export const updateWallet = async (id, data) => {
  const d = await getDB();
  const tx = d.transaction("wallets", "readwrite");
  const store = tx.objectStore("wallets");
  const wallet = await new Promise(r => store.get(id).onsuccess = e => r(e.target.result));
  if (!wallet) return;
  Object.assign(wallet, data);
  store.put(wallet);
  return new Promise(r => tx.oncomplete = r);
};

export const deleteWallet = async (id) => {
  const d = await getDB();
  const tx = d.transaction(["wallets", "transactions", "planifications"], "readwrite");
  tx.objectStore("wallets").delete(id);
  return new Promise(r => tx.oncomplete = r);
};

export const getAllWallets = async () => {
  const d = await getDB();
  return new Promise(r => {
    const tx = d.transaction("wallets", "readonly");
    const req = tx.objectStore("wallets").getAll();
    req.onsuccess = e => r(e.target.result);
  });
};

export const getWalletById = async (id) => {
  const d = await getDB();
  return new Promise(r => {
    const tx = d.transaction("wallets", "readonly");
    const req = tx.objectStore("wallets").get(id);
    req.onsuccess = e => r(e.target.result);
  });
};

// ====================== TRANSACTIONS ======================
export const updateWalletBalance = async (walletId, amount, type) => {
  const wallet = await getWalletById(walletId);
  if (!wallet) return;
  const d = await getDB();
  const tx = d.transaction("wallets", "readwrite");
  wallet.balance += (type === "deposit" ? amount : -amount);
  tx.objectStore("wallets").put(wallet);
  return new Promise(r => tx.oncomplete = r);
};

export const addTransaction = async (walletId, amount, type, reason = "") => {
  const wallet = await getWalletById(walletId);
  if (!wallet) throw new Error("Portefeuille introuvable.");
  
  if (type === 'withdrawal' && wallet.balance < amount) {
    throw new Error("Solde insuffisant dans ce portefeuille.");
  }

  await updateWalletBalance(walletId, amount, type);
  
  const d = await getDB();
  const tx = d.transaction("transactions", "readwrite");
  tx.objectStore("transactions").add({ 
    walletId, 
    type, 
    amount: Math.abs(amount), 
    reason, 
    date: Date.now() 
  });
  return new Promise(r => tx.oncomplete = r);
};

export const getWalletHistory = async (walletId) => {
  const d = await getDB();
  return new Promise(r => {
    d.transaction("transactions", "readonly")
     .objectStore("transactions")
     .index("walletId")
     .getAll(IDBKeyRange.only(walletId))
     .onsuccess = e => r(e.target.result.sort((a, b) => b.date - a.date));
  });
};

export const getAllTransactions = async () => {
  const d = await getDB();
  return new Promise(r => d.transaction("transactions", "readonly").objectStore("transactions").getAll().onsuccess = e => r(e.target.result));
};

// ====================== PLANIFICATIONS ======================
export const createPlanification = async (data) => {
  const d = await getDB();
  const tx = d.transaction("planifications", "readwrite");
  data.createdAt = Date.now();
  data.status = data.status || "pending";
  data.nextDueDate = calculateNextDate(data.startDate, data.freqVal, data.freqUnit);
  const req = tx.objectStore("planifications").add(data);
  return new Promise((resolve, reject) => {
    req.onsuccess = async (e) => {
      const id = e.target.result;
      await schedulePlanNotification(id, data);
      resolve(id);
    };
    req.onerror = () => reject(req.error);
  });
};

export const updatePlanification = async (id, data) => {
  const d = await getDB();
  const tx = d.transaction("planifications", "readwrite");
  const store = tx.objectStore("planifications");
  const plan = await new Promise(r => store.get(id).onsuccess = e => r(e.target.result));
  if (!plan) return;
  Object.assign(plan, data);
  if (data.startDate || data.freqVal || data.freqUnit) {
    plan.nextDueDate = calculateNextDate(plan.startDate, plan.freqVal, plan.freqUnit);
  }
  const req = store.put(plan);
  return new Promise((resolve, reject) => {
    req.onsuccess = async () => {
      await cancelPlanNotification(id);
      if (plan.status === 'pending') {
        await schedulePlanNotification(id, plan);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
};

export const deletePlanification = async (id) => {
  const d = await getDB();
  const tx = d.transaction("planifications", "readwrite");
  const req = tx.objectStore("planifications").delete(id);
  return new Promise((resolve, reject) => {
    req.onsuccess = async () => {
      await cancelPlanNotification(id);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
};

export const getAllPlanifications = async () => {
  const d = await getDB();
  return new Promise(r => d.transaction("planifications", "readonly").objectStore("planifications").getAll().onsuccess = e => r(e.target.result));
};

export const getWalletPlanifications = async (walletId) => {
  const d = await getDB();
  return new Promise(r => {
    d.transaction("planifications", "readonly")
     .objectStore("planifications")
     .index("walletId")
     .getAll(IDBKeyRange.only(walletId))
     .onsuccess = e => r(e.target.result.filter(p => p.status === 'pending'));
  });
};

export const getPlanificationById = async (id) => {
  const d = await getDB();
  return new Promise(r => d.transaction("planifications", "readonly").objectStore("planifications").get(id).onsuccess = e => r(e.target.result));
};

export const validatePlanification = async (id, motif) => {
  const d = await getDB();
  const plan = await getPlanificationById(id);
  if (!plan) return;

  await addTransaction(plan.walletId, plan.amount, plan.type, motif || plan.label || plan.name);

  const txWrite = d.transaction("planifications", "readwrite");
  const store = txWrite.objectStore("planifications");
  
  await cancelPlanNotification(id);
  
  if (plan.freqUnit === "none") {
    plan.status = "validated";
  } else {
    plan.startDate = plan.nextDueDate;
    plan.nextDueDate = calculateNextDate(plan.startDate, plan.freqVal, plan.freqUnit);
    plan.status = "pending";
    await schedulePlanNotification(id, plan);
  }
  store.put(plan);
  return new Promise((r, rej) => {
    txWrite.oncomplete = r;
    txWrite.onerror = () => rej(txWrite.error);
  });
};

// ====================== NOTIFICATIONS ======================
export const saveNotification = async (title, message, type = 'info') => {
  const d = await getDB();
  const tx = d.transaction("notifications", "readwrite");
  tx.objectStore("notifications").add({ 
    title, 
    message, 
    type, 
    date: Date.now(), 
    read: false 
  });
  return new Promise(r => tx.oncomplete = r);
};

export const getNotifications = async () => {
  const d = await getDB();
  return new Promise(r => {
    d.transaction("notifications", "readonly")
     .objectStore("notifications")
     .getAll()
     .onsuccess = e => r(e.target.result.sort((a, b) => b.date - a.date));
  });
};

export const getUnreadNotifCount = async () => {
  const notifs = await getNotifications();
  return notifs.filter(n => !n.read).length;
};

export const markAsRead = async (id) => {
  const d = await getDB();
  const tx = d.transaction("notifications", "readwrite");
  const store = tx.objectStore("notifications");
  const n = await new Promise(r => store.get(id).onsuccess = e => r(e.target.result));
  if (n) { n.read = true; store.put(n); }
  return new Promise(r => tx.oncomplete = r);
};

export const markAllNotificationsAsRead = async () => {
  const d = await getDB();
  const tx = d.transaction("notifications", "readwrite");
  const store = tx.objectStore("notifications");
  const all = await new Promise(r => store.getAll().onsuccess = e => r(e.target.result));
  for (const n of all) {
    if (!n.read) {
      n.read = true;
      store.put(n);
    }
  }
  return new Promise(r => tx.oncomplete = r);
};

export const clearAllNotifications = async () => {
  const d = await getDB();
  const tx = d.transaction("notifications", "readwrite");
  tx.objectStore("notifications").clear();
  return new Promise(r => tx.oncomplete = r);
};

// ====================== CHAT HISTORY ======================
export const saveChat = async (msg) => {
  const d = await getDB();
  const tx = d.transaction("chat_history", "readwrite");
  const req = tx.objectStore("chat_history").add(msg);
  return new Promise((r, rej) => {
    req.onsuccess = e => r(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
};

export const getChatHistory = async () => {
  const d = await getDB();
  return new Promise(r => d.transaction("chat_history", "readonly").objectStore("chat_history").getAll().onsuccess = e => r(e.target.result));
};

export const clearChatHistory = async () => {
  const d = await getDB();
  const tx = d.transaction("chat_history", "readwrite");
  tx.objectStore("chat_history").clear();
  return new Promise(r => tx.oncomplete = r);
};

export const deleteLastAssistantMessage = async () => {
  const d = await getDB();
  const history = await getChatHistory();
  const lastAi = [...history].reverse().find(m => m.role === 'assistant');
  if (!lastAi) return;
  const tx = d.transaction("chat_history", "readwrite");
  tx.objectStore("chat_history").delete(lastAi.id);
  return new Promise(r => tx.oncomplete = r);
};

export const updateUserMessageText = async (id, newText) => {
  const d = await getDB();
  const tx = d.transaction("chat_history", "readwrite");
  const store = tx.objectStore("chat_history");
  const msg = await new Promise(r => store.get(id).onsuccess = e => r(e.target.result));
  if (!msg) return;
  msg.text = newText;
  store.put(msg);
  return new Promise(r => tx.oncomplete = r);
};

export const deleteChatById = async (id) => {
  const d = await getDB();
  const tx = d.transaction("chat_history", "readwrite");
  tx.objectStore("chat_history").delete(id);
  return new Promise(r => tx.oncomplete = r);
};

// ====================== UTILS ======================
const calculateNextDate = (start, val, unit) => {
  const d = new Date(start || Date.now());
  if (unit === "none") return d.getTime();
  const v = parseInt(val) || 1;
  if (unit === "days") d.setDate(d.getDate() + v);
  else if (unit === "weeks") d.setDate(d.getDate() + (v * 7));
  else if (unit === "months") d.setMonth(d.getMonth() + v);
  else if (unit === "years") d.setFullYear(d.getFullYear() + v);
  return d.getTime();
};

// ====================== PROTOTYPE ALIASES ======================
// Aliases to match prototype method names used in agent.js and assistant.html
export const addTx = addTransaction;
export const getPlanifications = getWalletPlanifications;
export const getHistory = getWalletHistory;
export const getWallets = getAllWallets;
export const addPlan = createPlanification;
export const createPlan = (data) => createPlanification({
  walletId: data.walletId,
  label: data.label,
  description: data.description || '',
  amount: data.amount,
  type: data.type || 'withdrawal',
  startDate: data.startDate || Date.now(),
  freqVal: data.dayValue || data.freqVal || 0,
  freqUnit: data.frequency || data.freqUnit || 'none'
});
export const deletePlan = deletePlanification;

const db = {
  initDB,
  getDB,
  createWallet,
  updateWallet,
  deleteWallet,
  getAllWallets,
  getWalletById,
  addTransaction,
  getWalletHistory,
  getAllTransactions,
  updateWalletBalance,
  createPlanification,
  updatePlanification,
  deletePlanification,
  getAllPlanifications,
  getWalletPlanifications,
  getPlanificationById,
  validatePlanification,
  saveNotification,
  getNotifications,
  getUnreadNotifCount,
  markAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  saveChat,
  getChatHistory,
  clearChatHistory,
  deleteLastAssistantMessage,
  updateUserMessageText,
  deleteChatById,
  // Prototype aliases
  addTx,
  getPlanifications,
  getHistory,
  getWallets,
  addPlan,
  createPlan,
  deletePlan,
};

export default db;
