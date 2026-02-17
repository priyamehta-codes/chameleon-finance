import { detectRecurring, parseCSV } from './csvParser';

describe('CSV Parser', () => {
  test('CSV-1: parseCSV returns headers and rows for valid CSV', () => {
    const csv = 'date,description,amount\n2026-01-01,Netflix,15.99\n2026-02-01,Spotify,11.99';
    const parsed = parseCSV(csv);

    expect(parsed.headers).toEqual(['date', 'description', 'amount']);
    expect(parsed.rows).toHaveLength(2);
  });

  test('CSV-2: parseCSV handles quoted values with commas', () => {
    const csv = 'date,description,amount\n2026-01-01,"Amazon, Prime",14.99';
    const parsed = parseCSV(csv);

    expect(parsed.rows[0][1]).toBe('Amazon, Prime');
    expect(parsed.rows[0][2]).toBe('14.99');
  });

  test('CSV-3: parseCSV skips empty rows', () => {
    const csv = 'date,description,amount\n\n2026-01-01,Netflix,15.99\n';
    const parsed = parseCSV(csv);
    expect(parsed.rows).toHaveLength(1);
  });

  test('CSV-4: parseCSV returns empty result for insufficient lines', () => {
    expect(parseCSV('date,description,amount')).toEqual({ headers: [], rows: [] });
  });
});

describe('Recurring Detection', () => {
  test('CSV-5: detects monthly recurring transactions', () => {
    const txns = [
      { date: new Date('2026-01-01'), description: 'Netflix', amount: 15.99 },
      { date: new Date('2026-02-01'), description: 'Netflix', amount: 15.99 },
      { date: new Date('2026-03-01'), description: 'Netflix', amount: 15.99 },
    ];

    const result = detectRecurring(txns);
    expect(result.recurring).toHaveLength(1);
    expect(result.recurring[0].name).toBe('Netflix');
    expect(result.recurring[0].cycle).toBe('Monthly');
  });

  test('CSV-6: maps biweekly cadence to monthly subscription cycle', () => {
    const txns = [
      { date: new Date('2026-01-01'), description: 'Gym Membership', amount: 20 },
      { date: new Date('2026-01-15'), description: 'Gym Membership', amount: 20 },
      { date: new Date('2026-01-29'), description: 'Gym Membership', amount: 20 },
    ];

    const result = detectRecurring(txns);
    expect(result.recurring).toHaveLength(1);
    expect(result.recurring[0].cycle).toBe('Monthly');
  });

  test('CSV-7: excludes recurring candidates with high amount variance', () => {
    const txns = [
      { date: new Date('2026-01-01'), description: 'Cloud Tool', amount: 10 },
      { date: new Date('2026-02-01'), description: 'Cloud Tool', amount: 18 },
      { date: new Date('2026-03-01'), description: 'Cloud Tool', amount: 10 },
    ];

    const result = detectRecurring(txns);
    expect(result.recurring).toHaveLength(0);
  });

  test('CSV-8: returns other transactions and filters out high-value one-offs', () => {
    const txns = [
      { date: new Date('2026-01-01'), description: 'Netflix', amount: 15.99 },
      { date: new Date('2026-02-01'), description: 'Netflix', amount: 15.99 },
      { date: new Date('2026-03-01'), description: 'Netflix', amount: 15.99 },
      { date: new Date('2026-03-04'), description: 'Coffee Shop', amount: 5.2 },
      { date: new Date('2026-03-05'), description: 'Laptop Purchase', amount: 1200 },
    ];

    const result = detectRecurring(txns);
    const otherNames = result.other.map((x) => x.name);
    expect(otherNames).toContain('Coffee Shop');
    expect(otherNames).not.toContain('Laptop Purchase');
  });

  test('CSV-9: sorts recurring entries by count then by price', () => {
    const txns = [
      { date: new Date('2026-01-01'), description: 'Music Pro', amount: 8 },
      { date: new Date('2026-02-01'), description: 'Music Pro', amount: 8 },
      { date: new Date('2026-03-01'), description: 'Music Pro', amount: 8 },
      { date: new Date('2026-01-05'), description: 'Video Pro', amount: 20 },
      { date: new Date('2026-02-05'), description: 'Video Pro', amount: 20 },
      { date: new Date('2026-03-05'), description: 'Video Pro', amount: 20 },
      { date: new Date('2026-04-05'), description: 'Video Pro', amount: 20 },
    ];

    const result = detectRecurring(txns);
    expect(result.recurring[0].name).toBe('Video Pro');
    expect(result.recurring[0].count).toBeGreaterThanOrEqual(result.recurring[1].count);
  });
});
