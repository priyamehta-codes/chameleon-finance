import { useSettingsStore } from '@store/settingsStore';

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset Zustand store state
    useSettingsStore.setState({ theme: null });
  });

  // --- Default state ---

  test('CD-1: default theme is null', () => {
    const { theme } = useSettingsStore.getState();
    expect(theme).toBeNull();
  });

  // --- setTheme ---

  test('CD-2: setTheme dark sets theme to dark', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  test('CD-3: setTheme light sets theme to light', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  test('CD-4: setTheme null resets to system default', () => {
    useSettingsStore.getState().setTheme('dark');
    useSettingsStore.getState().setTheme(null);
    expect(useSettingsStore.getState().theme).toBeNull();
  });

  // --- toggleTheme ---

  test('CD-5: toggleTheme from null goes to dark', () => {
    // null !== 'dark' is true, so it sets 'dark'
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  test('CD-6: toggleTheme from dark goes to light', () => {
    useSettingsStore.setState({ theme: 'dark' });
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  test('CD-7: toggleTheme from light goes to dark', () => {
    useSettingsStore.setState({ theme: 'light' });
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  test('CD-8: double toggle returns to original', () => {
    useSettingsStore.setState({ theme: 'dark' });
    useSettingsStore.getState().toggleTheme();
    useSettingsStore.getState().toggleTheme();
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  // --- getEffectiveTheme ---

  test('CD-9: getEffectiveTheme returns light when theme is null and matchMedia returns false', () => {
    // matchMedia is mocked to return matches: false in setup.js
    useSettingsStore.setState({ theme: null });
    expect(useSettingsStore.getState().getEffectiveTheme()).toBe('light');
  });

  test('CD-10: getEffectiveTheme returns dark when theme is dark', () => {
    useSettingsStore.setState({ theme: 'dark' });
    expect(useSettingsStore.getState().getEffectiveTheme()).toBe('dark');
  });

  test('CD-11: getEffectiveTheme returns light when theme is light', () => {
    useSettingsStore.setState({ theme: 'light' });
    expect(useSettingsStore.getState().getEffectiveTheme()).toBe('light');
  });

  // --- localStorage backward compatibility ---

  test('CD-12: legacy dark string is read correctly', () => {
    // Set the legacy plain-string format before rehydrating
    localStorage.setItem('subgrid_theme', 'dark');
    // Trigger rehydration by calling the persist rehydrate method
    useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  test('CD-13: legacy light string is read correctly', () => {
    localStorage.setItem('subgrid_theme', 'light');
    useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  test('CD-14: saving theme writes plain string to localStorage', () => {
    useSettingsStore.getState().setTheme('dark');
    const stored = localStorage.getItem('subgrid_theme');
    expect(stored).toBe('dark');
  });
});
