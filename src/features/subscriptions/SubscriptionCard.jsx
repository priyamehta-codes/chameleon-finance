import { getColor, LOGO_API_TOKEN } from '@shared/lib/constants';
import { formatOriginalPrice } from '@shared/lib/currencies';
import { useCurrencyStore } from '@store/currencyStore';
import { useReminders } from '@features/reminders/useReminders';

export default function SubscriptionCard({ sub, onEdit, onRemove }) {
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const currencies = useCurrencyStore((s) => s.currencies);
  const { calculateNextRenewal, getDaysUntilRenewal, getRenewalBadgeClass, getRenewalBadgeText } = useReminders();

  const color = getColor(sub.color);

  const domain = sub.url
    ? sub.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    : null;
  const logoUrl = domain && domain.length > 3
    ? `https://img.logo.dev/${domain}?token=${LOGO_API_TOKEN}&size=100&retina=true&format=png`
    : null;

  let renewalBadge = null;
  if (sub.startDate) {
    const renewalDate = calculateNextRenewal(sub.startDate, sub.cycle);
    if (renewalDate) {
      const daysUntil = getDaysUntilRenewal(renewalDate);
      if (daysUntil <= 30) {
        renewalBadge = (
          <div className={`renewal-badge ${getRenewalBadgeClass(daysUntil)}`}>
            {getRenewalBadgeText(daysUntil)}
          </div>
        );
      }
    }
  }

  return (
    <div className="relative flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {renewalBadge}
      <div
        className="flex flex-1 cursor-pointer items-center gap-3 min-w-0"
        onClick={() => onEdit(sub.id)}
      >
        <div
          className="h-10 w-1 shrink-0 rounded-full"
          style={{ background: `linear-gradient(180deg, ${color.bg} 0%, ${color.accent} 100%)` }}
        />
        {logoUrl ? (
          <img
            src={logoUrl}
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
            crossOrigin="anonymous"
            alt={sub.name}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <span className="text-sm font-bold text-slate-400">{sub.name.charAt(0)}</span>
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate font-bold text-slate-900">{sub.name}</div>
          <div className="text-xs text-slate-500">
            {formatOriginalPrice(sub, selectedCurrency, currencies)} / {sub.cycle}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(sub.id)}
          className="p-2 text-slate-300 hover:text-indigo-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => onRemove(sub.id)}
          className="p-2 text-slate-300 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
