import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Wallet } from '../types';

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await api.get<{ wallet: Wallet }>('/wallet');
      setWallet(res.wallet);
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const addCredits = useCallback(async (amount: number) => {
    const res = await api.post<{ wallet: Wallet }>(
      '/wallet/virtual-topup',
      { amount }
    );

    setWallet(res.wallet);

    return res.wallet;
  }, []);

  // Actualiza únicamente el saldo recibido del servidor.
  const updateBalance = useCallback((balance: number) => {
    setWallet(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        balance,
      };
    });
  }, []);

  return {
    wallet,
    loading,
    fetchWallet,
    addCredits,
    updateBalance,
  };
}




