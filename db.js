// db.js - Gestion du stockage local avec IndexedDB

window.db = (function() {
  let dbInstance = null;

// ====================== INITIALISATION ======================
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("PortefeuilleDB", 2); // Version passée à 2 pour ajouter la nouvelle table

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Table des portefeuilles
      if (!db.objectStoreNames.contains("wallets")) {
        const walletStore = db.createObjectStore("wallets", { keyPath: "id", autoIncrement: true });
        walletStore.createIndex("name", "name", { unique: false });
      }

      // Table des transactions
      if (!db.objectStoreNames.contains("transactions")) {
        const txStore = db.createObjectStore("transactions", { keyPath: "id", autoIncrement: true });
        txStore.createIndex("walletId", "walletId", { unique: false });
      }

      // Table des planifications (nouveau)
      if (!db.objectStoreNames.contains("planifications")) {
        const planStore = db.createObjectStore("planifications", { keyPath: "id", autoIncrement: true });
        planStore.createIndex("walletId", "walletId", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}

// ====================== PORTFEUILLES ======================
async function createWallet(name, description = "") {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("wallets", "readwrite");
    const store = tx.objectStore("wallets");
    
    const wallet = { name, description, balance: 0, createdAt: Date.now() };
    const request = store.add(wallet);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllWallets() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("wallets", "readonly");
    const store = tx.objectStore("wallets");
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ====================== TRANSACTIONS ======================
async function addTransaction(walletId, amount, type, reason = "") {
  const db_local = await getDB();
  await updateWalletBalance(walletId, amount, type);
  
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("transactions", "readwrite");
    const store = tx.objectStore("transactions");
    
    const transaction = {
      walletId,
      type,
      amount: Math.abs(amount),
      reason,
      date: Date.now()
    };
    
    const request = store.add(transaction);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Met à jour le solde du portefeuille
async function updateWalletBalance(walletId, amount, type) {
  const wallet = await getWalletById(walletId);
  if (!wallet) return;

  const db_local = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("wallets", "readwrite");
    const store = tx.objectStore("wallets");
    
    const change = (type === "deposit") ? amount : -amount;
    wallet.balance += change;
    
    const request = store.put(wallet);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getWalletById(walletId) {
  const db_local = await getDB();
  return new Promise((resolve) => {
    const tx = db_local.transaction("wallets", "readonly");
    const request = tx.objectStore("wallets").get(walletId);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getWalletHistory(walletId) {
  const db_local = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("transactions", "readonly");
    const store = tx.objectStore("transactions");
    const index = store.index("walletId");
    const request = index.getAll(IDBKeyRange.only(walletId));
    
    request.onsuccess = () => {
      const sorted = request.result.sort((a, b) => b.date - a.date);
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

// ====================== PLANIFICATIONS ======================

async function createPlanification(walletId, amount, type, frequency, label, dayValue) {
  const db_local = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("planifications", "readwrite");
    const store = tx.objectStore("planifications");
    
    const plan = {
      walletId,
      type,                    // "deposit" ou "withdrawal"
      amount,
      frequency,               // "daily", "weekly", "monthly"
      dayValue,                // ex: 5 pour le 5 du mois
      label,                   // motif qui apparaît dans l'historique
      nextDueDate: calculateNextDueDate(frequency, dayValue),
      active: true,
      status: "pending",       // pending, validated, missed
      createdAt: Date.now()
    };
    
    const request = store.add(plan);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllPlanifications() {
  const db_local = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("planifications", "readonly");
    const request = tx.objectStore("planifications").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Valider une planification (crée la transaction + met à jour le statut)
async function validatePlanification(planId) {
  const plans = await getAllPlanifications();
  const plan = plans.find(p => p.id === planId);
  if (!plan) return null;

  await addTransaction(plan.walletId, plan.amount, plan.type, plan.label);
  
  const db_local = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("planifications", "readwrite");
    const store = tx.objectStore("planifications");
    
    plan.status = "validated";
    plan.nextDueDate = calculateNextDueDate(plan.frequency, plan.dayValue);
    const request = store.put(plan);
    request.onsuccess = () => resolve(plan);
    request.onerror = () => reject(request.error);
  });
}

// Vérifier et marquer les planifications en retard
async function checkMissedPlanifications() {
  const plans = await getAllPlanifications();
  const now = Date.now();
  const db_local = await getDB();
  
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("planifications", "readwrite");
    const store = tx.objectStore("planifications");

    for (const plan of plans) {
      if (plan.active && plan.status === "pending" && plan.nextDueDate < now) {
        plan.status = "missed";
        store.put(plan);
      }
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Marquer comme manquée
async function markAsMissed(planId) {
  const plan = await getPlanById(planId);
  if (!plan) return;

  const db_local = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db_local.transaction("planifications", "readwrite");
    const store = tx.objectStore("planifications");
    plan.status = "missed";
    const request = store.put(plan);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Fonction utilitaire pour calculer la prochaine date
function calculateNextDueDate(frequency, dayValue) {
  const now = new Date();
  let next = new Date(now);
  
  if (frequency === "daily") {
    next.setDate(now.getDate() + 1);
  } else if (frequency === "monthly") {
    next.setDate(dayValue);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (frequency === "weekly") {
    next.setDate(now.getDate() + (dayValue - now.getDay() + 7) % 7);
  }
  
  return next.getTime();
}

async function getPlanById(planId) {
  const db_local = await getDB();
  return new Promise((resolve) => {
    const tx = db_local.transaction("planifications", "readonly");
    const request = tx.objectStore("planifications").get(planId);
    request.onsuccess = () => resolve(request.result);
  });
}


// ====================== UTILITAIRE ======================
async function getDB() {
  if (dbInstance) return dbInstance;
  return await initDB();
}

return {
  initDB,
  createWallet,
  getAllWallets,
  getWalletById,
  addTransaction,
  getWalletHistory,
  createPlanification,
  getAllPlanifications,
  validatePlanification,
  checkMissedPlanifications,
  markAsMissed,
  getPlanById
};

})();
