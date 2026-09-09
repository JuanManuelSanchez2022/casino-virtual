import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { SpinResult } from '../types';

export function useSlots() {
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);

  const spin = useCallback(async (bet: number) => {
    setSpinning(true);
    setLastResult(null);

    try {
      const result = await api.post<SpinResult>('/games/slots/spin', { bet });
      setLastResult(result);
      return result;
    } finally {
      setSpinning(false);
    }
  }, []);

  return { spinning, lastResult, spin };
}
