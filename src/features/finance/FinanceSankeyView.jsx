import { useRef, useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '@store/financeStore';
import { useCurrencyStore } from '@store/currencyStore';
import { formatCurrency } from '@shared/lib/currencies';
import { computeBreakdownByType } from '@shared/lib/financeUtils';
import { getTypeColor, getTypeLabel } from '@shared/lib/financeConstants';

/**
 * Simple 2-column Sankey for finance: Income → Expense Types + Remaining
 */
function layoutFinanceSankey(width, height, totalIncome, expenseTypes) {
  if (expenseTypes.length === 0) return { nodes: [], links: [] };

  const nodeWidth = width * 0.14;
  const nodePadding = 8;
  const topPadding = 10;
  const availableHeight = height - topPadding * 2;

  const col0X = width * 0.08;
  const col1X = width * 0.78;

  let totalExpenses = 0;
  for (const t of expenseTypes) totalExpenses += t.expenses;

  const effectiveIncome = Math.max(totalIncome, totalExpenses) || 1;
  const remaining = Math.max(0, totalIncome - totalExpenses);

  const nodes = [];
  const links = [];

  // Income node (left)
  nodes.push({
    id: '_income',
    label: 'Income',
    value: effectiveIncome,
    x: col0X,
    y: topPadding,
    width: nodeWidth,
    height: availableHeight,
    color: '#22c55e',
    column: 0,
  });

  // Expense type nodes (right)
  const typeCount = expenseTypes.length + (remaining > 0 ? 1 : 0);
  const paddingTotal = Math.max(0, typeCount - 1) * nodePadding;
  const typeAvailableHeight = availableHeight - paddingTotal;

  let typeY = topPadding;
  let incomeYOffset = topPadding;

  for (const t of expenseTypes) {
    const h = Math.max(20, (t.expenses / effectiveIncome) * typeAvailableHeight);
    const node = {
      id: `_type_${t.type}`,
      label: getTypeLabel(t.type),
      value: t.expenses,
      x: col1X,
      y: typeY,
      width: nodeWidth,
      height: h,
      color: getTypeColor(t.type),
      column: 1,
    };
    nodes.push(node);

    const linkHeight = (t.expenses / effectiveIncome) * availableHeight;
    links.push({
      source: '_income',
      target: node.id,
      value: t.expenses,
      sourceX: col0X + nodeWidth,
      sourceY: incomeYOffset,
      sourceHeight: linkHeight,
      targetX: col1X,
      targetY: typeY,
      targetHeight: h,
      color: getTypeColor(t.type),
    });

    typeY += h + nodePadding;
    incomeYOffset += linkHeight;
  }

  // Remaining/Savings node
  if (remaining > 0) {
    const h = Math.max(20, (remaining / effectiveIncome) * typeAvailableHeight);
    const node = {
      id: '_remaining',
      label: 'Savings',
      value: remaining,
      x: col1X,
      y: typeY,
      width: nodeWidth,
      height: h,
      color: '#86efac',
      column: 1,
    };
    nodes.push(node);

    const linkHeight = (remaining / effectiveIncome) * availableHeight;
    links.push({
      source: '_income',
      target: '_remaining',
      value: remaining,
      sourceX: col0X + nodeWidth,
      sourceY: incomeYOffset,
      sourceHeight: linkHeight,
      targetX: col1X,
      targetY: typeY,
      targetHeight: h,
      color: '#86efac',
    });
  }

  return { nodes, links };
}

function sankeyLinkPath(link) {
  const { sourceX, sourceY, sourceHeight, targetX, targetY, targetHeight } = link;
  const midX = (sourceX + targetX) / 2;

  return [
    `M ${sourceX} ${sourceY}`,
    `C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`,
    `L ${targetX} ${targetY + targetHeight}`,
    `C ${midX} ${targetY + targetHeight}, ${midX} ${sourceY + sourceHeight}, ${sourceX} ${sourceY + sourceHeight}`,
    'Z',
  ].join(' ');
}

export default function FinanceSankeyView() {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState(null);

  const records = useFinanceStore((s) => s.records);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const currencies = useCurrencyStore((s) => s.currencies);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(350, width * 0.7) });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { nodes, links } = useMemo(() => {
    if (dimensions.width === 0 || records.length === 0) return { nodes: [], links: [] };

    const breakdown = computeBreakdownByType(records);
    let totalIncome = 0;
    for (const r of records) totalIncome += r.income || 0;

    // Only show expense types in the right column (exclude Income type)
    const expenseTypes = breakdown.filter((b) => b.expenses > 0);

    return layoutFinanceSankey(dimensions.width, dimensions.height, totalIncome, expenseTypes);
  }, [records, dimensions]);

  if (records.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600">
        <p className="text-sm text-slate-400 dark:text-slate-500">Add records to see the Sankey diagram</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* SVG Links */}
        <svg
          className="absolute inset-0"
          width={dimensions.width}
          height={dimensions.height}
          style={{ pointerEvents: 'none' }}
        >
          {links.map((link, i) => {
            const isHighlighted = hoveredId === link.source || hoveredId === link.target;
            return (
              <path
                key={`${link.source}-${link.target}-${i}`}
                d={sankeyLinkPath(link)}
                fill={link.color}
                opacity={hoveredId ? (isHighlighted ? 0.5 : 0.1) : 0.3}
                className="transition-opacity duration-200"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isHovered = hoveredId === node.id;
          const showLabel = node.height >= 20;
          const showValue = node.height >= 36;

          return (
            <div
              key={node.id}
              className="absolute flex flex-col items-center justify-center overflow-hidden rounded-lg border border-white/60 transition-all duration-200 cursor-default dark:border-slate-600/60"
              style={{
                left: node.x,
                top: node.y,
                width: Math.max(0, node.width),
                height: Math.max(0, node.height),
                backgroundColor: node.color,
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                zIndex: isHovered ? 10 : 2,
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={`${node.label}: ${formatCurrency(node.value, selectedCurrency, currencies)}`}
            >
              {showLabel && (
                <span className="truncate px-1 text-center text-xs font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  {node.label}
                </span>
              )}
              {showValue && (
                <span className="text-xs leading-tight text-slate-500 dark:text-slate-400">
                  {formatCurrency(node.value, selectedCurrency, currencies)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
