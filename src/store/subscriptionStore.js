import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      subs: [],
      step: 1,
      currentView: 'treemap',

      addSub: (sub) => set((state) => ({
        subs: [...state.subs, {
          ...sub,
          id: sub.id || Date.now().toString(),
          lastModified: new Date().toISOString()
        }]
      })),

      editSub: (id, data) => set((state) => ({
        subs: state.subs.map(s =>
          s.id === id ? { ...s, ...data, lastModified: new Date().toISOString() } : s
        )
      })),

      removeSub: (id) => set((state) => ({
        subs: state.subs.filter(s => s.id !== id)
      })),

      setSubs: (subs) => set({ subs }),

      clearAll: () => set({ subs: [] }),

      setStep: (step) => set({ step }),

      setView: (currentView) => set({ currentView }),
    }),
    {
      name: 'vexly_flow_data',
      // Custom storage to match legacy format (array, not object)
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            // Legacy format is raw array, new format is Zustand state object
            if (Array.isArray(parsed)) {
              return { state: { subs: parsed, step: 1, currentView: 'treemap' } };
            }
            return { state: parsed };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          // Save subs as raw array for backward compat with legacy app
          localStorage.setItem(name, JSON.stringify(value.state.subs));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        subs: state.subs,
        step: state.step,
        currentView: state.currentView,
      }),
    }
  )
);
