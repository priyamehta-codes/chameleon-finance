import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      theme: null, // null means follow system preference

      setTheme: (theme) => set({ theme }),

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),

      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme) return theme;
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      },
    }),
    {
      name: 'subgrid_theme',
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          try {
            // Legacy format is just "light" or "dark"
            if (raw === 'light' || raw === 'dark') {
              return { state: { theme: raw } };
            }
            return { state: JSON.parse(raw) };
          } catch {
            return { state: { theme: raw } };
          }
        },
        setItem: (name, value) => {
          // Save as plain string for backward compat
          localStorage.setItem(name, value.state.theme || '');
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
