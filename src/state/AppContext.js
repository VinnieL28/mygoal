import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ensureSeed, getSetting, listBills, listTransactions, listWallets, setSetting } from '../db/db';
import { refreshWeeklyIfEnabled, scheduleBillReminders } from '../utils/notifications';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [currency, setCurrencyState] = useState('MKD');
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bills, setBills] = useState([]);

  const refresh = useCallback(async () => {
    const [w, t, b] = await Promise.all([listWallets(), listTransactions(), listBills()]);
    setWallets(w);
    setTransactions(t);
    setBills(b);
  }, []);

  useEffect(() => {
    (async () => {
      await ensureSeed();
      const cur = await getSetting('currency', 'MKD');
      setCurrencyState(cur || 'MKD');
      await refresh();
      setReady(true);
      refreshWeeklyIfEnabled(cur || 'MKD').catch(() => {});
      scheduleBillReminders(cur || 'MKD').catch(() => {});
    })();
  }, [refresh]);

  const setCurrency = useCallback(async (code) => {
    setCurrencyState(code);
    await setSetting('currency', code);
  }, []);

  const value = useMemo(
    () => ({ ready, currency, setCurrency, wallets, transactions, bills, refresh }),
    [ready, currency, setCurrency, wallets, transactions, bills, refresh],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
