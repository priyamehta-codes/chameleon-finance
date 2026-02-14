import { useBudget } from '@features/budget/useBudget';
import { useCurrencyStore } from '@store/currencyStore';
import { formatCurrency } from '@shared/lib/currencies';

export default function BudgetIndicator() {
  const { usage } = useBudget();
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const currencies = useCurrencyStore((s) => s.currencies);

  if (!usage) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-400 dark:text-slate-500">No budget set</p>
      </div>
    );
  }

  const fillPercent = Math.min(usage.percentage, 100);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Budget</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {formatCurrency(usage.total, selectedCurrency, currencies)} / {formatCurrency(usage.budget, selectedCurrency, currencies)}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: usage.color,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs" style={{ color: usage.color }}>
          {usage.message}
        </span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {usage.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
