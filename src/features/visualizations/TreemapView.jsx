import { useRef, useState, useEffect, useMemo } from 'react';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useCurrencyStore } from '@store/currencyStore';
import { toMonthly, formatCurrency } from '@shared/lib/currencies';
import { getColor } from '@shared/lib/constants';
import { getLogoProxyUrl } from '@shared/lib/logo';
import { Treemap } from '@shared/lib/treemapLayout';

export default function TreemapView() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState(null);

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

  const cells = useMemo(() => {
    if (dimensions.width === 0 || subs.length === 0) return [];

    const items = subs.map((sub) => ({
      ...sub,
      val: Math.max(0.01, toMonthly(sub, selectedCurrency, currencies)),
    }));

    const treemap = new Treemap(dimensions.width, dimensions.height);
    return treemap.layout(items);
  }, [subs, selectedCurrency, currencies, dimensions]);

  if (subs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
        <p className="text-sm text-slate-400">Add subscriptions to see the treemap</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {cells.map((cell) => {
          const color = getColor(cell.color);
          const monthly = toMonthly(cell, selectedCurrency, currencies);
          const logoUrl = getLogoProxyUrl(cell.url);

          const isSmall = cell.w < 80 || cell.h < 60;
          const isTiny = cell.w < 50 || cell.h < 40;
          const isHovered = hoveredId === cell.id;

          return (
            <div
              key={cell.id}
              className="absolute flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/60 transition-all duration-200"
              style={{
                left: cell.x,
                top: cell.y,
                width: Math.max(0, cell.w),
                height: Math.max(0, cell.h),
                backgroundColor: color.bg,
                borderColor: color.accent,
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                zIndex: isHovered ? 10 : 1,
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              }}
              onMouseEnter={() => setHoveredId(cell.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={`${cell.name}: ${formatCurrency(monthly, selectedCurrency, currencies)}/mo`}
            >
              {!isTiny && logoUrl && (
                <img
                  src={logoUrl}
                  className="mb-1 h-6 w-6 rounded object-contain"
                  crossOrigin="anonymous"
                  alt={cell.name}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              {!isTiny && (
                <span className="truncate px-1 text-center text-xs font-semibold text-slate-700">
                  {cell.name}
                </span>
              )}
              {!isSmall && (
                <span className="text-xs text-slate-500">
                  {formatCurrency(monthly, selectedCurrency, currencies)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
