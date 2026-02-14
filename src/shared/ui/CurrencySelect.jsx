import { useCurrencyStore } from '@store/currencyStore';

export default function CurrencySelect({ value, onChange, className = '' }) {
  const currencies = useCurrencyStore((s) => s.currencies);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ${className}`}
    >
      {Object.entries(currencies).map(([code, curr]) => (
        <option key={code} value={code}>
          {curr.symbol} {code} - {curr.name}
        </option>
      ))}
    </select>
  );
}
