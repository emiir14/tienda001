
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ShippingState = {
  postalCode: string | null;
  shippingCost: number | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  setPostalCode: (code: string) => void;
  setShippingCost: (cost: number, postalCode: string) => void;
  setError: (error: string) => void;
  setLoading: () => void;
  reset: () => void;
};

export const useShippingStore = create<ShippingState>()(
  persist(
    (set) => ({
      postalCode: null,
      shippingCost: null,
      status: 'idle',
      error: null,
      setPostalCode: (code) => set({ postalCode: code, status: 'idle', error: null }),
      setShippingCost: (cost, postalCode) => set({ shippingCost: cost, postalCode, status: 'success', error: null }),
      setError: (error) => set({ error, status: 'error', shippingCost: null }),
      setLoading: () => set({ status: 'loading', error: null }),
      reset: () => set({ postalCode: null, shippingCost: null, status: 'idle', error: null }),
    }),
    {
      name: 'shipping-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
