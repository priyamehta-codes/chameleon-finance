import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '@store/settingsStore';

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const getEffectiveTheme = useSettingsStore((s) => s.getEffectiveTheme);

  const effectiveTheme = getEffectiveTheme();

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement;

    html.removeAttribute('data-theme');

    if (effectiveTheme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      html.style.colorScheme = 'dark';
    } else {
      html.style.colorScheme = 'light';
    }
  }, [effectiveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      // Only respond to system changes if user hasn't set a preference
      if (!theme) {
        // Force re-render by toggling and resetting
        setTheme(null);
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, setTheme]);

  const isDark = effectiveTheme === 'dark';

  const getChartColors = useCallback(() => ({
    isDark,
    text: isDark ? '#f1f5f9' : '#0f172a',
    textSecondary: isDark ? '#cbd5e1' : '#64748b',
    background: isDark ? '#1e293b' : '#ffffff',
    grid: isDark ? '#475569' : '#e0e0e0',
    border: isDark ? '#334155' : '#e2e8f0',
    tooltip: isDark ? '#334155' : '#f8f9fb',
    hover: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
  }), [isDark]);

  return {
    theme: effectiveTheme,
    isDark,
    toggleTheme,
    getChartColors,
  };
}
