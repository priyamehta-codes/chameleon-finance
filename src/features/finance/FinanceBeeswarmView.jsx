import { useRef, useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '@store/financeStore';
import { useCurrencyStore } from '@store/currencyStore';
import { formatCurrency } from '@shared/lib/currencies';
import { computeBreakdownByType } from '@shared/lib/financeUtils';
import { getTypeColor, getTypeLabel } from '@shared/lib/financeConstants';
import { Beeswarm } from '@shared/lib/beeswarmLayout';

export default function FinanceBeeswarmView() {
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
      const isMobile = width < 640;
      setDimensions({ width, height: isMobile ? 280 : 340 });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dots = useMemo(() => {
    if (dimensions.width === 0 || records.length === 0) return [];

    const isMobile = dimensions.width < 640;
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

    const beeswarm = new Beeswarm(dimensions.width, dimensions.height, 20, isMobile);
    return beeswarm.layout(items);
  }, [records, dimensions]);

  if (records.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600">
        <p className="text-sm text-slate-400 dark:text-slate-500">Add records to see the beeswarm</p>
      </div>
    );
  }

  const costs = dots.map((d) => d.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/50"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* X-axis labels */}
        <div className="absolute bottom-1 left-5 right-5 flex justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatCurrency(minCost, selectedCurrency, currencies)}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatCurrency(maxCost, selectedCurrency, currencies)}
          </span>
        </div>

        {/* Dots */}
        {dots.map((dot) => (
          <div
            key={dot.id}
            className="absolute flex items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform duration-200 hover:scale-110 cursor-pointer dark:border-slate-700"
            style={{
              left: dot.x - dot.radius,
              top: dot.y - dot.radius,
              width: dot.radius * 2,
              height: dot.radius * 2,
              background: `linear-gradient(135deg, ${dot.color}33, ${dot.color}88)`,
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const containerRect = containerRef.current.getBoundingClientRect();
              setTooltip({
                id: dot.id,
                name: dot.name,
                income: dot.income,
                expenses: dot.expenses,
                count: dot.count,
                x: rect.left - containerRect.left + dot.radius,
                y: rect.top - containerRect.top - 8,
              });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <span
              className="truncate px-1 text-center text-xs font-semibold text-slate-700 dark:text-slate-200"
              style={{ fontSize: Math.max(9, dot.radius * 0.4) }}
            >
              {dot.name}
            </span>
          </div>
        ))}

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
