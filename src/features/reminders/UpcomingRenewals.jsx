import { useReminders } from '@features/reminders/useReminders';
import { useCurrencyStore } from '@store/currencyStore';
import { formatOriginalPrice } from '@shared/lib/currencies';
import { getColor, LOGO_API_TOKEN } from '@shared/lib/constants';

export default function UpcomingRenewals() {
  const { upcoming, getRenewalBadgeText } = useReminders();
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const currencies = useCurrencyStore((s) => s.currencies);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Upcoming Renewals</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">No renewals in the next 30 days</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Upcoming Renewals ({upcoming.length})
      </h3>
      <div className="space-y-2">
        {upcoming.map((sub) => {
          const color = getColor(sub.color);
          const domain = sub.url
            ? sub.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
            : null;
          const logoUrl = domain && domain.length > 3
            ? `https://img.logo.dev/${domain}?token=${LOGO_API_TOKEN}&size=100&retina=true&format=png`
            : null;

          const isUrgent = sub.daysUntilRenewal <= 3;
          const isWarning = sub.daysUntilRenewal <= 7;

          return (
            <div
              key={sub.id}
              className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: `linear-gradient(180deg, ${color.bg} 0%, ${color.accent} 100%)` }}
                />
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    className="h-7 w-7 shrink-0 rounded-md object-contain"
                    crossOrigin="anonymous"
                    alt={sub.name}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{sub.name.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{sub.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {formatOriginalPrice(sub, selectedCurrency, currencies)} / {sub.cycle}
                  </div>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isUrgent
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : isWarning
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {getRenewalBadgeText(sub.daysUntilRenewal)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
