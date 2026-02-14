import { useMemo } from 'react';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useCurrencyStore } from '@store/currencyStore';
import { toMonthly } from '@shared/lib/currencies';

export const BUDGET_KEY = 'subgrid_budget';

export function getBudget() {
  try {
    const data = localStorage.getItem(BUDGET_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setBudget(amount, currency) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Budget must be a positive number' };
  }

  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify({ amount, currency }));
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save budget' };
  }
}

export function removeBudget() {
  try {
    localStorage.removeItem(BUDGET_KEY);
  } catch (err) {
    console.warn('Failed to remove budget:', err);
  }
}

export function getThresholdStatus(percentage) {
  if (percentage < 80) return 'safe';
  if (percentage < 90) return 'warning';
  if (percentage < 100) return 'caution';
  return 'danger';
}

export function getThresholdColor(status) {
  const colors = {
    'safe': '#22c55e',
    'warning': '#eab308',
    'caution': '#f97316',
    'danger': '#ef4444'
  };
  return colors[status] || '#e0e0e0';
}

export function getStatusMessage(status) {
  const messages = {
    'safe': '✓ Within budget',
    'warning': '⚠ Approaching limit (80%+)',
    'caution': '⚠ Near limit (90%+)',
    'danger': '✗ Over budget (100%+)'
  };
  return messages[status] || '';
}

export function useBudget() {
  const subs = useSubscriptionStore((s) => s.subs);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const currencies = useCurrencyStore((s) => s.currencies);

  const budget = getBudget();

  const usage = useMemo(() => {
    if (!budget) return null;

    let totalSpending = 0;
    for (let i = 0; i < subs.length; i++) {
      totalSpending += toMonthly(subs[i], selectedCurrency, currencies);
    }

    const percentage = (totalSpending / budget.amount) * 100;
    const status = getThresholdStatus(percentage);

    return {
      total: totalSpending,
      budget: budget.amount,
      percentage: Math.round(percentage * 1000) / 1000,
      status,
      currency: budget.currency,
      color: getThresholdColor(status),
      message: getStatusMessage(status),
    };
  }, [subs, selectedCurrency, currencies, budget?.amount, budget?.currency]);

  return {
    usage,
    budget,
    setBudget,
    removeBudget,
    getThresholdColor,
    getStatusMessage,
  };
}
