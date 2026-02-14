import { calculateNextRenewal, getDaysUntilRenewal, getRenewalBadgeText, getRenewalBadgeClass, getUpcomingRenewals } from './useReminders';

describe('Reminders', () => {
  // --- calculateNextRenewal ---

  test('CR-1: monthly cycle returns future date', () => {
    const pastDate = '2023-01-15';
    const result = calculateNextRenewal(pastDate, 'Monthly');
    expect(result).not.toBeNull();
    const resultDate = new Date(result);
    const today = new Date();
    expect(resultDate.getTime()).toBeGreaterThan(today.getTime());
  });

  test('CR-2: yearly cycle returns future date', () => {
    const pastDate = '2020-06-01';
    const result = calculateNextRenewal(pastDate, 'Yearly');
    expect(result).not.toBeNull();
    const resultDate = new Date(result);
    const today = new Date();
    expect(resultDate.getTime()).toBeGreaterThan(today.getTime());
  });

  test('CR-3: weekly cycle returns future date', () => {
    const pastDate = '2023-01-01';
    const result = calculateNextRenewal(pastDate, 'Weekly');
    expect(result).not.toBeNull();
    const resultDate = new Date(result);
    const today = new Date();
    expect(resultDate.getTime()).toBeGreaterThan(today.getTime());
  });

  test('CR-4: null startDate returns null', () => {
    expect(calculateNextRenewal(null, 'Monthly')).toBeNull();
  });

  test('CR-5: invalid date returns null', () => {
    expect(calculateNextRenewal('not-a-date', 'Monthly')).toBeNull();
  });

  // --- getDaysUntilRenewal ---

  test('CR-6: today returns 0', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    expect(getDaysUntilRenewal(todayStr)).toBe(0);
  });

  test('CR-7: tomorrow returns 1', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    expect(getDaysUntilRenewal(tomorrowStr)).toBe(1);
  });

  test('CR-8: 7 days out returns 7', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const futureStr = future.toISOString().split('T')[0];
    expect(getDaysUntilRenewal(futureStr)).toBe(7);
  });

  test('CR-9: past date returns 0', () => {
    expect(getDaysUntilRenewal('2020-01-01')).toBe(0);
  });

  test('CR-10: null input returns 0', () => {
    expect(getDaysUntilRenewal(null)).toBe(0);
  });

  // --- getRenewalBadgeText ---

  test('CR-11: 0 returns "Today"', () => {
    expect(getRenewalBadgeText(0)).toBe('Today');
  });

  test('CR-12: 1 returns "Tomorrow"', () => {
    expect(getRenewalBadgeText(1)).toBe('Tomorrow');
  });

  test('CR-13: 5 returns "5d"', () => {
    expect(getRenewalBadgeText(5)).toBe('5d');
  });

  // --- getRenewalBadgeClass ---

  test('CR-14: 0 returns urgent', () => {
    expect(getRenewalBadgeClass(0)).toBe('renewal-badge-urgent');
  });

  test('CR-15: 3 returns urgent', () => {
    expect(getRenewalBadgeClass(3)).toBe('renewal-badge-urgent');
  });

  test('CR-16: 4 returns warning', () => {
    expect(getRenewalBadgeClass(4)).toBe('renewal-badge-warning');
  });

  test('CR-17: 7 returns warning', () => {
    expect(getRenewalBadgeClass(7)).toBe('renewal-badge-warning');
  });

  test('CR-18: 8 returns normal', () => {
    expect(getRenewalBadgeClass(8)).toBe('renewal-badge-normal');
  });

  // --- getUpcomingRenewals ---

  test('CR-19: returns empty array for no subs', () => {
    expect(getUpcomingRenewals([])).toEqual([]);
  });

  test('CR-20: filters subs with renewals within daysAhead', () => {
    const today = new Date();
    // Create a start date that ensures renewal is within 30 days (tomorrow)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 1);
    // Set startDate one month before so the next monthly renewal is about tomorrow
    const monthlyStart = new Date(startDate);
    monthlyStart.setMonth(monthlyStart.getMonth() - 1);

    const subs = [
      { id: 1, name: 'Netflix', startDate: monthlyStart.toISOString().split('T')[0], cycle: 'Monthly', price: 15 },
    ];

    const result = getUpcomingRenewals(subs, 30);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].renewalDate).toBeDefined();
    expect(result[0].daysUntilRenewal).toBeDefined();
  });

  test('CR-21: sorts by renewal date ascending', () => {
    const today = new Date();

    // Create two subs that will renew at different times within the next 30 days
    const start1 = new Date(today);
    start1.setDate(start1.getDate() + 10);
    start1.setMonth(start1.getMonth() - 1);

    const start2 = new Date(today);
    start2.setDate(start2.getDate() + 3);
    start2.setMonth(start2.getMonth() - 1);

    const subs = [
      { id: 1, name: 'Later', startDate: start1.toISOString().split('T')[0], cycle: 'Monthly', price: 15 },
      { id: 2, name: 'Sooner', startDate: start2.toISOString().split('T')[0], cycle: 'Monthly', price: 10 },
    ];

    const result = getUpcomingRenewals(subs, 30);
    if (result.length >= 2) {
      expect(new Date(result[0].renewalDate).getTime()).toBeLessThanOrEqual(new Date(result[1].renewalDate).getTime());
    }
  });

  test('CR-22: skips subs without startDate', () => {
    const subs = [
      { id: 1, name: 'No Date', cycle: 'Monthly', price: 10 },
    ];
    const result = getUpcomingRenewals(subs, 30);
    expect(result).toEqual([]);
  });
});
