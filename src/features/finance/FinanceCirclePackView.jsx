import { useRef, useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '@store/financeStore';
import { useCurrencyStore } from '@store/currencyStore';
import { formatCurrency } from '@shared/lib/currencies';
import { computeBreakdownByType } from '@shared/lib/financeUtils';
import { getTypeColor, getTypeLabel } from '@shared/lib/financeConstants';
import { CirclePack } from '@shared/lib/circlepackLayout';

export default function FinanceCirclePackView() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);

  const records = useFinanceStore((s) => s.records);
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
    if (dimensions.width === 0 || records.length === 0) return [];

    const breakdown = computeBreakdownByType(records);
    const items = breakdown.map((b) => ({
      id: b.type,
      name: getTypeLabel(b.type),
      color: getTypeColor(b.type),
      income: b.income,
      expenses: b.expenses,
      count: b.count,
      cost: Math.max(0.01, b.income + b.expenses),
    }));

    const pack = new CirclePack(dimensions.width, dimensions.height);
    return pack.layout(items);
  }, [records, dimensions]);

  if (records.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600">
        <p className="text-sm text-slate-400 dark:text-slate-500">Add records to see the circle pack</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/50"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {circles.map((circle) => {
          const showLabel = circle.radius > 25;
          const isLarge = circle.radius > 40;

          return (
            <div
              key={circle.id}
              className="absolute flex flex-col items-center justify-center rounded-full border-2 border-white/80 shadow-sm transition-transform duration-200 hover:scale-105 cursor-pointer dark:border-slate-700/80"
              style={{
                left: circle.x - circle.radius,
                top: circle.y - circle.radius,
                width: circle.radius * 2,
                height: circle.radius * 2,
                background: `radial-gradient(circle at 35% 35%, ${circle.color}33, ${circle.color}88)`,
              }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();
                setTooltip({
                  id: circle.id,
                  name: circle.name,
                  income: circle.income,
                  expenses: circle.expenses,
                  count: circle.count,
                  x: rect.left - containerRect.left + circle.radius,
                  y: rect.top - containerRect.top - 8,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {showLabel && (
                <span
                  className="truncate px-1 text-center font-semibold text-slate-700 dark:text-slate-200"
                  style={{ fontSize: Math.max(9, circle.radius * 0.22), maxWidth: circle.radius * 1.6 }}
                >
                  {circle.name}
                </span>
              )}
              {isLarge && (
                <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: Math.max(8, circle.radius * 0.18) }}>
                  {circle.count} record{circle.count !== 1 ? 's' : ''}
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
              {tooltip.count} record{tooltip.count !== 1 ? 's' : ''}
            </div>
            {tooltip.income > 0 && (
              <div className="text-green-400">
                +{formatCurrency(tooltip.income, selectedCurrency, currencies)}
              </div>
            )}
            {tooltip.expenses > 0 && (
              <div className="text-red-400">
                -{formatCurrency(tooltip.expenses, selectedCurrency, currencies)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
