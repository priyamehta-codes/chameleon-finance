import { STORAGE_KEY, getHistory, saveHistory, calculateMoMChange, calculateYoYChange, calculateTrendDirection, getChartData, hasEnoughData, exportTrendData } from './useTrends';

describe('Trends', () => {
  // --- getHistory ---

  test('CT-1: returns empty array when empty', () => {
    expect(getHistory()).toEqual([]);
  });

  test('CT-2: returns saved data', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    expect(getHistory()).toEqual(history);
  });

  test('CT-3: returns empty array on corrupted data', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(getHistory()).toEqual([]);
  });

  // --- saveHistory ---

  test('CT-4: saves data to localStorage', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ];
    saveHistory(history);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored).toEqual(history);
  });

  test('CT-5: handles QuotaExceededError gracefully', () => {
    const originalSetItem = localStorage.setItem;
    const error = new Error('Quota exceeded');
    error.name = 'QuotaExceededError';
    localStorage.setItem = vi.fn(() => { throw error; });

    expect(() => saveHistory([{ month: '2024-01', total: 100 }])).not.toThrow();

    localStorage.setItem = originalSetItem;
  });

  // --- calculateMoMChange ---

  test('CT-6: returns null when less than 2 months', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ]));
    expect(calculateMoMChange()).toBeNull();
  });

  test('CT-7: calculates increase correctly', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 120, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateMoMChange();
    expect(result).not.toBeNull();
    expect(result.change).toBe(20);
    expect(result.percentage).toBe(20);
    expect(result.direction).toBe('up');
    expect(result.current).toBe(120);
    expect(result.previous).toBe(100);
  });

  test('CT-8: calculates decrease correctly', () => {
    const history = [
      { month: '2024-01', total: 200, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 150, subscriptionCount: 4, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateMoMChange();
    expect(result).not.toBeNull();
    expect(result.change).toBe(-50);
    expect(result.percentage).toBe(-25);
    expect(result.direction).toBe('down');
  });

  test('CT-9: returns stable for small change (<5%)', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 103, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateMoMChange();
    expect(result).not.toBeNull();
    expect(result.direction).toBe('stable');
  });

  test('CT-10: returns null when previous total is 0', () => {
    const history = [
      { month: '2024-01', total: 0, subscriptionCount: 0, currency: 'USD' },
      { month: '2024-02', total: 100, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    expect(calculateMoMChange()).toBeNull();
  });

  // --- calculateYoYChange ---

  test('CT-11: returns null when less than 12 months', () => {
    const history = Array.from({ length: 11 }, (_, i) => ({
      month: `2024-${String(i + 1).padStart(2, '0')}`,
      total: 100,
      subscriptionCount: 5,
      currency: 'USD',
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    expect(calculateYoYChange()).toBeNull();
  });

  test('CT-12: calculates correctly with 13 months of data', () => {
    const history = Array.from({ length: 13 }, (_, i) => ({
      month: i < 12
        ? `2024-${String(i + 1).padStart(2, '0')}`
        : '2025-01',
      total: i === 0 ? 100 : i === 12 ? 150 : 110,
      subscriptionCount: 5,
      currency: 'USD',
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateYoYChange();
    expect(result).not.toBeNull();
    expect(result.current).toBe(150);
    expect(result.previous).toBe(100);
    expect(result.change).toBe(50);
    expect(result.percentage).toBe(50);
    expect(result.direction).toBe('up');
  });

  // --- calculateTrendDirection ---

  test('CT-13: returns stable with less than 2 data points', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ]));
    const result = calculateTrendDirection(6);
    expect(result.direction).toBe('stable');
    expect(result.strength).toBe(0);
  });

  test('CT-14: detects increasing trend', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 120, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-03', total: 140, subscriptionCount: 6, currency: 'USD' },
      { month: '2024-04', total: 160, subscriptionCount: 6, currency: 'USD' },
      { month: '2024-05', total: 180, subscriptionCount: 7, currency: 'USD' },
      { month: '2024-06', total: 200, subscriptionCount: 7, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateTrendDirection(6);
    expect(result.direction).toBe('increasing');
  });

  test('CT-15: detects decreasing trend', () => {
    const history = [
      { month: '2024-01', total: 200, subscriptionCount: 7, currency: 'USD' },
      { month: '2024-02', total: 180, subscriptionCount: 6, currency: 'USD' },
      { month: '2024-03', total: 160, subscriptionCount: 6, currency: 'USD' },
      { month: '2024-04', total: 140, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-05', total: 120, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-06', total: 100, subscriptionCount: 4, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateTrendDirection(6);
    expect(result.direction).toBe('decreasing');
  });

  test('CT-16: detects stable trend', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-03', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-04', total: 100, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = calculateTrendDirection(6);
    expect(result.direction).toBe('stable');
  });

  // --- getChartData ---

  test('CT-17: returns empty arrays when no data', () => {
    const result = getChartData(6);
    expect(result.labels).toEqual([]);
    expect(result.data).toEqual([]);
  });

  test('CT-18: returns correct labels and data for history entries', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 120, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-03', total: 110, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = getChartData(6);
    expect(result.labels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(result.data).toEqual([100, 120, 110]);
  });

  test('CT-19: limits to requested months', () => {
    const history = [
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 110, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-03', total: 120, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-04', total: 130, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-05', total: 140, subscriptionCount: 5, currency: 'USD' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    const result = getChartData(3);
    expect(result.labels).toHaveLength(3);
    expect(result.data).toHaveLength(3);
    expect(result.labels).toEqual(['Mar', 'Apr', 'May']);
    expect(result.data).toEqual([120, 130, 140]);
  });

  // --- hasEnoughData ---

  test('CT-20: false when less than 2 months', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ]));
    expect(hasEnoughData()).toBe(false);
  });

  test('CT-21: true when 2 or more months', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
      { month: '2024-02', total: 110, subscriptionCount: 5, currency: 'USD' },
    ]));
    expect(hasEnoughData()).toBe(true);
  });

  // --- exportTrendData ---

  test('CT-22: returns Blob', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ]));
    const blob = exportTrendData();
    expect(blob).toBeInstanceOf(Blob);
  });

  test('CT-23: Blob type is text/csv', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ]));
    const blob = exportTrendData();
    expect(blob.type).toBe('text/csv');
  });

  test('CT-24: CSV content has header row', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { month: '2024-01', total: 100, subscriptionCount: 5, currency: 'USD' },
    ]));
    const blob = exportTrendData();
    const text = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });
    expect(text.startsWith('Month,Total Spending,Subscription Count,Currency')).toBe(true);
  });
});
