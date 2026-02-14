/**
 * Google Sheets Public CSV Reader
 * Reads data from publicly-shared Google Sheets without API key
 */

const SHEETS_CONFIG_KEY = '_sheets_config';

/**
 * Extract spreadsheet ID from Google Sheets URL
 */
export function extractSpreadsheetId(sheetsUrl) {
  try {
    const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch (err) {
    console.warn('Failed to extract spreadsheet ID:', err);
    return null;
  }
}

/**
 * Parse CSV text into 2D array
 * Handles quoted fields with commas and newlines
 */
export function parseSheetCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if (ch === '\n' && !inQuotes) {
      row.push(current.trim());
      if (row.some(cell => cell !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else if (ch === '\r') {
      // skip carriage return
    } else {
      current += ch;
    }
  }
  row.push(current.trim());
  if (row.some(cell => cell !== '')) {
    rows.push(row);
  }

  return rows;
}

/**
 * Fetch a sheet tab as CSV from a public Google Sheet
 */
export async function fetchSheet(spreadsheetId, sheetName) {
  const base = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  const isGidTarget = typeof sheetName === 'string' && sheetName.startsWith('gid:');
  const url = isGidTarget
    ? `${base}&gid=${encodeURIComponent(sheetName.slice(4))}`
    : `${base}&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  return parseSheetCSV(text);
}

/**
 * Set and validate connection (URL only, no API key)
 */
export async function setCredentials(sheetUrl) {
  try {
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return { success: false, error: 'Invalid Google Sheets URL' };
    }

    // Test access
    const testUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&range=A1`;
    const response = await fetch(testUrl);

    if (!response.ok) {
      return { success: false, error: 'Sheet not accessible. Make sure it is shared publicly (Anyone with the link).' };
    }

    localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify({
      spreadsheetId,
      sheetsUrl: sheetUrl,
      connectedAt: new Date().toISOString()
    }));

    return { success: true };
  } catch (err) {
    console.error('Failed to connect to sheet:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get stored connection info
 */
export function getCredentials() {
  try {
    const stored = localStorage.getItem(SHEETS_CONFIG_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (err) {
    console.warn('Failed to retrieve connection:', err);
    return null;
  }
}

/**
 * Clear connection
 */
export function clearCredentials() {
  localStorage.removeItem(SHEETS_CONFIG_KEY);
}

/**
 * Check if currently connected
 */
export function isConnected() {
  return !!getCredentials();
}

/**
 * Read subscriptions from Google Sheet
 */
export async function readSubscriptions(spreadsheetId) {
  const rows = await fetchSheet(spreadsheetId, 'Subscriptions');
  const dataRows = rows.slice(1);

  return dataRows.map(row => ({
    id: row[0] || '',
    name: row[1] || '',
    price: parseFloat(row[2]) || 0,
    currency: row[3] || 'USD',
    cycle: row[4] || 'Monthly',
    category: row[5] || 'other',
    startDate: row[6] || '',
    notificationsEnabled: row[7] === 'true' || row[7] === 'TRUE',
    reminderDays: parseInt(row[8]) || 7,
    url: row[9] || '',
    color: row[10] || 'purple',
    lastModified: row[11] || new Date().toISOString()
  })).filter(s => s.id && s.id !== '[DELETED]');
}

/**
 * Read budget from Google Sheet
 */
export async function readBudget(spreadsheetId) {
  const rows = await fetchSheet(spreadsheetId, 'Budget');
  const row = rows[1];

  if (!row) return null;

  return {
    amount: parseFloat(row[0]) || 0,
    currency: row[1] || 'USD',
    lastModified: row[2] || new Date().toISOString()
  };
}

/**
 * Read trends from Google Sheet
 */
export async function readTrends(spreadsheetId) {
  const rows = await fetchSheet(spreadsheetId, 'Trends');
  const dataRows = rows.slice(1);

  return dataRows.map(row => ({
    month: row[0] || '',
    total: parseFloat(row[1]) || 0,
    subscriptionCount: parseInt(row[2]) || 0,
    currency: row[3] || 'USD',
    lastModified: row[4] || new Date().toISOString()
  }));
}

const FINANCE_COLUMN_ALIASES = {
  date: ['date', 'transactiondate', 'recorddate'],
  description: ['description', 'details', 'item', 'name'],
  interestRate: ['interestrate', 'interestedrate', 'rate'],
  income: ['income', 'incomes', 'incomeamount', 'incomecolumn', 'incomecollumn'],
  expenses: ['expenses', 'expense', 'expenseamount', 'expensescolumn', 'expensescollumn'],
  minimumExpenses: ['minimumexpenses', 'minexpenses', 'minimumexpense', 'minexpense'],
  balance: ['balance', 'netbalance', 'remainingbalance'],
  dueDate: ['duedate', 'due'],
  paymentMethod: ['paymentmethod', 'payment'],
  howPaid: ['howpaid', 'howipaid', 'paidby'],
  done: ['done', 'isdone', 'completed'],
  type: ['type', 'category'],
  note: ['note', 'notes', 'remark', 'remarks'],
};

const FINANCE_FALLBACK_INDEX = {
  date: 0,
  description: 1,
  interestRate: 2,
  income: 3,
  expenses: 4,
  minimumExpenses: 5,
  balance: 6,
  dueDate: 7,
  paymentMethod: 8,
  howPaid: 9,
  done: 10,
  type: 11,
  note: 12,
};

function normalizeHeader(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function parseSheetNumber(value) {
  const raw = (value || '').toString().trim();
  if (!raw) return 0;

  const negative = raw.startsWith('(') && raw.endsWith(')');
  const cleaned = raw.replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;

  let normalized = cleaned;
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');

  if (hasDot && hasComma) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = `${parts[0].replace(/\./g, '')}.${parts[1]}`;
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  }

  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) return 0;
  return negative ? -Math.abs(parsed) : parsed;
}

function parseSheetBoolean(value) {
  const normalized = (value || '').toString().trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 'done', 'paid'].includes(normalized);
}

function findHeaderRowIndex(rows) {
  let bestIndex = 0;
  let bestScore = -1;
  const maxScanRows = Math.min(rows.length, 6);

  for (let i = 0; i < maxScanRows; i++) {
    const normalizedRow = rows[i].map(normalizeHeader).filter(Boolean);
    if (!normalizedRow.length) continue;

    let score = 0;
    if (FINANCE_COLUMN_ALIASES.date.some((alias) => normalizedRow.includes(alias))) score += 1;
    if (FINANCE_COLUMN_ALIASES.description.some((alias) => normalizedRow.includes(alias))) score += 1;
    if (FINANCE_COLUMN_ALIASES.income.some((alias) => normalizedRow.includes(alias))) score += 1;
    if (FINANCE_COLUMN_ALIASES.expenses.some((alias) => normalizedRow.includes(alias))) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  // Require at least two core columns to treat a row as headers.
  return bestScore >= 2 ? bestIndex : 0;
}

function resolveColumnIndex(normalizedHeaders, key) {
  const aliases = FINANCE_COLUMN_ALIASES[key] || [];

  for (const alias of aliases) {
    const exactIdx = normalizedHeaders.indexOf(alias);
    if (exactIdx !== -1) return exactIdx;
  }

  // Fallback for variants like "income column", "expenses column", etc.
  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i];
    if (!header) continue;
    for (const alias of aliases) {
      if (header.includes(alias)) return i;
    }
  }

  return -1;
}

/**
 * Read financial records from Google Sheet using header row for column mapping
 */
export async function readFinancialRecords(spreadsheetId, sheetTab = 'Sheet1') {
  const rows = await fetchSheet(spreadsheetId, sheetTab);
  if (rows.length < 2) return [];

  const headerRowIndex = findHeaderRowIndex(rows);
  const normalizedHeaders = (rows[headerRowIndex] || []).map(normalizeHeader);

  const columnIndex = Object.keys(FINANCE_COLUMN_ALIASES).reduce((acc, key) => {
    acc[key] = resolveColumnIndex(normalizedHeaders, key);
    return acc;
  }, {});

  const dataRows = rows.slice(headerRowIndex + 1);
  const importTimestamp = Date.now();

  return dataRows.map((row, i) => {
    const getValue = (key) => {
      const mappedIndex = columnIndex[key];
      if (mappedIndex >= 0 && mappedIndex < row.length) {
        return row[mappedIndex] || '';
      }

      const fallbackIndex = FINANCE_FALLBACK_INDEX[key];
      if (typeof fallbackIndex === 'number' && fallbackIndex < row.length) {
        return row[fallbackIndex] || '';
      }

      return '';
    };

    return {
      id: `sheet_${i}_${importTimestamp}`,
      date: getValue('date'),
      description: getValue('description'),
      interestRate: parseSheetNumber(getValue('interestRate')),
      income: parseSheetNumber(getValue('income')),
      expenses: parseSheetNumber(getValue('expenses')),
      minimumExpenses: parseSheetNumber(getValue('minimumExpenses')),
      balance: parseSheetNumber(getValue('balance')),
      dueDate: getValue('dueDate'),
      paymentMethod: getValue('paymentMethod'),
      howPaid: getValue('howPaid'),
      done: parseSheetBoolean(getValue('done')),
      type: getValue('type'),
      note: getValue('note'),
      lastModified: new Date().toISOString(),
    };
  }).filter((record) => record.date && record.description);
}
