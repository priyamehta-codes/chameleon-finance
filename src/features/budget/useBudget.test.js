import { BUDGET_KEY, getBudget, setBudget, removeBudget, getThresholdStatus, getThresholdColor, getStatusMessage } from './useBudget';

describe('Budget', () => {
  // --- setBudget ---

  test('BC-1: saves valid budget', () => {
    const result = setBudget(100, 'USD');
    expect(result.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem(BUDGET_KEY));
    expect(stored.amount).toBe(100);
    expect(stored.currency).toBe('USD');
  });

  test('BC-2: rejects zero amount', () => {
    const result = setBudget(0, 'USD');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('BC-3: rejects negative amount', () => {
    const result = setBudget(-50, 'USD');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('BC-4: rejects NaN', () => {
    const result = setBudget(NaN, 'USD');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('BC-5: rejects non-number (string)', () => {
    const result = setBudget('one hundred', 'USD');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // --- getBudget ---

  test('BC-6: getBudget returns null when empty', () => {
    expect(getBudget()).toBeNull();
  });

  test('BC-7: getBudget returns saved data', () => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify({ amount: 200, currency: 'EUR' }));
    const budget = getBudget();
    expect(budget.amount).toBe(200);
    expect(budget.currency).toBe('EUR');
  });

  test('BC-8: getBudget returns null on corrupted data', () => {
    localStorage.setItem(BUDGET_KEY, '{invalid json');
    expect(getBudget()).toBeNull();
  });

  // --- removeBudget ---

  test('BC-9: removeBudget clears storage', () => {
    setBudget(100, 'USD');
    expect(getBudget()).not.toBeNull();
    removeBudget();
    expect(getBudget()).toBeNull();
  });

  // --- getThresholdStatus ---

  test('BC-10: 0% returns safe', () => {
    expect(getThresholdStatus(0)).toBe('safe');
  });

  test('BC-11: 50% returns safe', () => {
    expect(getThresholdStatus(50)).toBe('safe');
  });

  test('BC-12: 79% returns safe', () => {
    expect(getThresholdStatus(79)).toBe('safe');
  });

  test('BC-13: 80% returns warning', () => {
    expect(getThresholdStatus(80)).toBe('warning');
  });

  test('BC-14: 89% returns warning', () => {
    expect(getThresholdStatus(89)).toBe('warning');
  });

  test('BC-15: 90% returns caution', () => {
    expect(getThresholdStatus(90)).toBe('caution');
  });

  test('BC-16: 99% returns caution', () => {
    expect(getThresholdStatus(99)).toBe('caution');
  });

  test('BC-17: 100% returns danger', () => {
    expect(getThresholdStatus(100)).toBe('danger');
  });

  test('BC-18: 150% returns danger', () => {
    expect(getThresholdStatus(150)).toBe('danger');
  });

  // --- getThresholdColor ---

  test('BC-19: maps safe to green', () => {
    expect(getThresholdColor('safe')).toBe('#22c55e');
  });

  test('BC-20: maps unknown status to fallback color', () => {
    expect(getThresholdColor('nonexistent')).toBe('#e0e0e0');
  });

  // --- getStatusMessage ---

  test('BC-21: maps danger to over budget message', () => {
    const message = getStatusMessage('danger');
    expect(message).toContain('Over budget');
  });

  test('BC-22: unknown status returns empty string', () => {
    expect(getStatusMessage('nonexistent')).toBe('');
  });
});
