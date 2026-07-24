import { create } from 'zustand';

export const useGameStore = create((set) => ({
  locale: 'ru',
  zaps: 0,
  breached: 0,
  toggleLocale: () => set((state) => ({ locale: state.locale === 'ru' ? 'en' : 'ru' })),
  addZap: () => set((state) => ({ zaps: state.zaps + 1 })),
  addBreached: () => set((state) => ({ breached: state.breached + 1 })),
}));
