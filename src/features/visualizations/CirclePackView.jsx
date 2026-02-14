import { useRef, useState, useEffect, useMemo } from 'react';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useCurrencyStore } from '@store/currencyStore';
import { toMonthly, formatCurrency } from '@shared/lib/currencies';
import { getColor, LOGO_API_TOKEN } from '@shared/lib/constants';
import { CirclePack } from '@shared/lib/circlepackLayout';

export default function CirclePackView() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);

  const subs = useSubscriptionStore((s) => s.subs);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const currencies = useCurrencyStore((s) => s.currencies);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(300, width * 0.65) });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const circles = useMemo(() => {
    if (dimensions.width === 0 || subs.length === 0) return [];

    const items = subs.map((sub) => ({
      ...sub,
      cost: Math.max(0.01, toMonthly(sub, selectedCurrency, currencies)),
    }));

    const pack = new CirclePack(dimensions.width, dimensions.height);
    return pack.layout(items);
  }, [subs, selectedCurrency, currencies, dimensions]);

  if (subs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
        <p className="text-sm text-slate-400">Add subscriptions to see the circle pack</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-50"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {circles.map((circle) => {
          const color = getColor(circle.color);
          const monthly = toMonthly(circle, selectedCurrency, currencies);
          const domain = circle.url
            ? circle.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
            : null;
          const logoUrl = domain && domain.length > 3
            ? `https://img.logo.dev/${domain}?token=${LOGO_API_TOKEN}&size=100&retina=true&format=png`
            : null;

          const showLabel = circle.radius > 25;
          const showLogo = circle.radius > 20 && logoUrl;
          const isLarge = circle.radius > 40;

          return (
            <div
              key={circle.id}
              className="absolute flex flex-col items-center justify-center rounded-full border-2 border-white/80 shadow-sm transition-transform duration-200 hover:scale-105 cursor-pointer"
              style={{
                left: circle.x - circle.radius,
                top: circle.y - circle.radius,
                width: circle.radius * 2,
                height: circle.radius * 2,
                background: `radial-gradient(circle at 35% 35%, ${color.bg}, ${color.accent})`,
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();
                setTooltip({
                  id: circle.id,
                  name: circle.name,
                  cost: monthly,
                  x: rect.left - containerRect.left + circle.radius,
                  y: rect.top - containerRect.top - 8,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {showLogo && (
                <img
                  src={logoUrl}
                  className="rounded object-contain"
                  style={{ width: circle.radius * 0.5, height: circle.radius * 0.5 }}
                  crossOrigin="anonymous"
                  alt={circle.name}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              {showLabel && (
                <span
                  className="truncate px-1 text-center font-semibold text-slate-700"
                  style={{ fontSize: Math.max(9, circle.radius * 0.22), maxWidth: circle.radius * 1.6 }}
                >
                  {circle.name}
                </span>
              )}
              {isLarge && (
                <span className="text-slate-500" style={{ fontSize: Math.max(8, circle.radius * 0.18) }}>
                  {formatCurrency(monthly, selectedCurrency, currencies)}
                </span>
              )}
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="font-semibold">{tooltip.name}</div>
            <div className="text-slate-300">
              {formatCurrency(tooltip.cost, selectedCurrency, currencies)}/mo
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
