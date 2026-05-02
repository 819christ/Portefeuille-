// src/hooks/useDatabase.js
import { useState, useEffect } from 'react';
import db from '../services/db';

export const useDatabase = () => {
  const [wallets, setWallets] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const allWallets = await db.getAllWallets();
      const allPlans = await db.getAllPlanifications();
      setWallets(allWallets);
      setPlans(allPlans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return { wallets, plans, loading, refreshData };
};
