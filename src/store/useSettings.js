import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Safe localStorage wrapper (private windows / blocked storage won't crash the app).
const safeStorage = {
  getItem: (k) => {
    try { return window.localStorage.getItem(k); } catch { return null; }
  },
  setItem: (k, v) => {
    try { window.localStorage.setItem(k, v); } catch { /* ignore */ }
  },
  removeItem: (k) => {
    try { window.localStorage.removeItem(k); } catch { /* ignore */ }
  },
};

export const useSettings = create(
  persist(
    (set) => ({
      trainerWheels: true,
      fourColor: true,
      coachNotes: true,
      highScores: { speed: 0, pushfold: 0, outs: 0, potodds: 0 },
      toggle: (key) => set((s) => ({ [key]: !s[key] })),
      setValue: (key, value) => set({ [key]: value }),
      submitScore: (key, value) =>
        set((s) => (value > (s.highScores[key] || 0) ? { highScores: { ...s.highScores, [key]: value } } : {})),
    }),
    { name: 'poker-dojo-settings', storage: createJSONStorage(() => safeStorage) },
  ),
);
