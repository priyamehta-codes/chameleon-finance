/**
 * Filter finance records by type and date range.
 */
export function filterRecords(records, filters) {
  let result = records;

  if (filters.type && filters.type !== 'all') {
    result = result.filter((r) => r.type === filters.type);
  }

  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    result = result.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return false;

      switch (filters.dateRange) {
        case 'thisMonth':
          return d.getFullYear() === year && d.getMonth() === month;
        case 'lastMonth': {
          const lm = month === 0 ? 11 : month - 1;
          const ly = month === 0 ? year - 1 : year;
          return d.getFullYear() === ly && d.getMonth() === lm;
        }
        case 'thisYear':
          return d.getFullYear() === year;
        default:
          return true;
      }
    });
  }

  return result;
}

/**
 * Compute financial summary from filtered records.
 */
export function computeSummary(records, filters) {
  const filtered = filterRecords(records, filters);

  let totalIncome = 0;
  let totalExpenses = 0;
  let totalMinimumExpenses = 0;

  for (const r of filtered) {
    totalIncome += r.income || 0;
    totalExpenses += r.expenses || 0;
    totalMinimumExpenses += r.minimumExpenses || 0;
  }

  return {
    totalIncome,
    totalExpenses,
    totalMinimumExpenses,
    netBalance: totalIncome - totalExpenses,
    recordCount: filtered.length,
  };
}

/**
 * Export finance records as CSV matching the Google Sheets template.
 */
export function exportFinanceCSV(records) {
  const header = 'Date,Description,Interested Rate,Income,Expenses,Minimum Expenses,Balance,Due Date,Payment Method,How I paid?,Done?,Type,Note\n';
  let csv = header;

  for (const r of records) {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    csv += `${q(r.date)},${q(r.description)},${q(r.interestRate || '')},${q(r.income || '')},${q(r.expenses || '')},${q(r.minimumExpenses || '')},${q(r.balance || '')},${q(r.dueDate || '')},${q(r.paymentMethod || '')},${q(r.howPaid || '')},${q(r.done ? 'TRUE' : 'FALSE')},${q(r.type || '')},${q(r.note || '')}\n`;
  }

  return csv;
}

/**
 * Parse a single CSV row array into a finance record object.
 */
export function parseFinanceCSVRow(row) {
  return {
    date: row[0] || '',
    description: row[1] || '',
    interestRate: parseFloat(row[2]) || 0,
    income: parseFloat(row[3]) || 0,
    expenses: parseFloat(row[4]) || 0,
    minimumExpenses: parseFloat(row[5]) || 0,
    balance: parseFloat(row[6]) || 0,
    dueDate: row[7] || '',
    paymentMethod: row[8] || '',
    howPaid: row[9] || '',
    done: row[10] === 'true' || row[10] === 'TRUE' || row[10] === 'Yes',
    type: row[11] || '',
    note: row[12] || '',
  };
}

/**
 * Validate that a record has at minimum a date and description.
 */
export function isValidRecord(record) {
  return !!(record && record.date && record.description);
}

/**
 * Group records by type and compute totals per type.
 */
export function computeBreakdownByType(records) {
  const map = {};
  for (const r of records) {
    const type = r.type || 'Other';
    if (!map[type]) {
      map[type] = { type, income: 0, expenses: 0, minimumExpenses: 0, count: 0 };
    }
    map[type].income += r.income || 0;
    map[type].expenses += r.expenses || 0;
    map[type].minimumExpenses += r.minimumExpenses || 0;
    map[type].count += 1;
  }
  return Object.values(map).sort((a, b) => (b.income + b.expenses) - (a.income + a.expenses));
}

/**
 * Group records by month and compute income/expenses per month.
 */
export function computeMonthlyTrend(records) {
  const map = {};
  for (const r of records) {
    if (!r.date) continue;
    const d = new Date(r.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) {
      map[key] = { month: key, income: 0, expenses: 0 };
    }
    map[key].income += r.income || 0;
    map[key].expenses += r.expenses || 0;
  }
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}
