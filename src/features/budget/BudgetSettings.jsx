import { useState } from 'react';
import { useBudget } from '@features/budget/useBudget';
import { useCurrencyStore } from '@store/currencyStore';
import CurrencySelect from '@shared/ui/CurrencySelect';

export default function BudgetSettings() {
  const { budget, setBudget, removeBudget } = useBudget();
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);

  const [amount, setAmount] = useState(budget?.amount?.toString() || '');
  const [currency, setCurrency] = useState(budget?.currency || selectedCurrency);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const parsed = parseFloat(amount);
    const result = setBudget(parsed, currency);

    if (result.success) {
      setError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error);
    }
  };

  const handleRemove = () => {
    removeBudget();
    setAmount('');
    setError('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Monthly Budget</label>

      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. 100"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <CurrencySelect
          value={currency}
          onChange={(val) => {
            setCurrency(val);
            setSaved(false);
          }}
          className="shrink-0"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {saved ? 'Saved!' : 'Set Budget'}
        </button>
        {budget && (
          <button
            onClick={handleRemove}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-500"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
