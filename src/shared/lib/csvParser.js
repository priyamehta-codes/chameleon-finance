/**
 * Parse CSV text into headers and rows
 * Handles quoted fields with commas
 */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  function parseLine(line) {
    const fields = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        insideQuotes = !insideQuotes;
      } else if (ch === "," && !insideQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    const hasData = row.some(cell => cell !== "");
    if (hasData) rows.push(row);
  }

  return { headers, rows };
}

/**
 * Detect recurring transactions from parsed CSV data
 * @param {Array} transactions - Array of {date, description, amount}
 * @returns {{ recurring: Array, other: Array }}
 */
export function detectRecurring(transactions) {
  function normalizeDesc(str) {
    return str
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b(INC|LLC|LTD|CORP|CO|PAYMENT|PURCHASE|POS|ACH|DEBIT)\b/g, "")
      .trim()
      .split(" ")
      .slice(0, 3)
      .join(" ");
  }

  const groups = {};
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    const key = normalizeDesc(txn.description);
    if (!key) continue;

    if (!groups[key]) {
      groups[key] = { txns: [], names: new Set() };
    }
    groups[key].txns.push(txn);
    groups[key].names.add(txn.description);
  }

  const recurring = [];
  const groupKeys = Object.keys(groups);

  for (let g = 0; g < groupKeys.length; g++) {
    const key = groupKeys[g];
    const group = groups[key];

    if (group.txns.length < 2) continue;

    group.txns.sort((a, b) => a.date - b.date);

    let totalDays = 0;
    for (let i = 1; i < group.txns.length; i++) {
      const daysBetween = Math.round((group.txns[i].date - group.txns[i - 1].date) / (1000 * 60 * 60 * 24));
      totalDays += daysBetween;
    }
    const avgDays = totalDays / (group.txns.length - 1);

    let cycle = null;
    if (avgDays >= 6 && avgDays <= 8) cycle = "Weekly";
    else if (avgDays >= 13 && avgDays <= 16) cycle = "Biweekly";
    else if (avgDays >= 25 && avgDays <= 35) cycle = "Monthly";
    else if (avgDays >= 85 && avgDays <= 100) cycle = "Quarterly";
    else if (avgDays >= 355 && avgDays <= 375) cycle = "Yearly";

    if (!cycle) continue;

    let totalAmount = 0;
    for (let i = 0; i < group.txns.length; i++) {
      totalAmount += group.txns[i].amount;
    }
    const avgAmt = totalAmount / group.txns.length;

    let isConsistent = true;
    for (let i = 0; i < group.txns.length; i++) {
      const variance = Math.abs(group.txns[i].amount - avgAmt) / avgAmt;
      if (variance >= 0.2) {
        isConsistent = false;
        break;
      }
    }
    if (!isConsistent) continue;

    const nameCount = {};
    for (const name of group.names) {
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
    let bestName = "";
    let bestCount = 0;
    for (const name in nameCount) {
      if (nameCount[name] > bestCount) {
        bestCount = nameCount[name];
        bestName = name;
      }
    }

    recurring.push({
      name: bestName,
      price: Math.round(avgAmt * 100) / 100,
      cycle: (cycle === "Biweekly" || cycle === "Quarterly") ? "Monthly" : cycle,
      count: group.txns.length,
      selected: true
    });
  }

  recurring.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.price - a.price;
  });

  // Build "other" list (non-recurring transactions)
  const detectedNames = new Set(recurring.map(r => r.name.toUpperCase()));

  const otherMap = {};
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    if (detectedNames.has(txn.description.toUpperCase())) continue;

    if (!otherMap[txn.description]) {
      otherMap[txn.description] = { name: txn.description, price: txn.amount, count: 0 };
    }
    otherMap[txn.description].count++;
    otherMap[txn.description].price = txn.amount;
  }

  const other = [];
  for (const key in otherMap) {
    const item = otherMap[key];
    if (item.price > 0 && item.price < 500) {
      other.push(item);
    }
  }
  other.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return { recurring, other };
}
