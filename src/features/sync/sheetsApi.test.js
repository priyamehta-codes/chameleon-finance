import {
  extractSpreadsheetId,
  parseSheetCSV,
  fetchSheet,
  setCredentials,
  getCredentials,
  clearCredentials,
  isConnected,
  readSubscriptions,
  readBudget,
  readTrends,
} from './sheetsApi';

describe('Sheets API', () => {
  // --- extractSpreadsheetId ---

  // SA-1
  it('extracts ID from valid Google Sheets URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/abc123XYZ_-/edit';
    expect(extractSpreadsheetId(url)).toBe('abc123XYZ_-');
  });

  // SA-2
  it('returns null for invalid URL without spreadsheets path', () => {
    expect(extractSpreadsheetId('https://example.com')).toBeNull();
  });

  // SA-3
  it('returns null for empty string', () => {
    expect(extractSpreadsheetId('')).toBeNull();
  });

  // SA-4
  it('handles URL with extra path segments', () => {
    const url = 'https://docs.google.com/spreadsheets/d/myId123/edit#gid=0';
    expect(extractSpreadsheetId(url)).toBe('myId123');
  });

  // --- parseSheetCSV ---

  // SA-5
  it('parses simple CSV into 2D array', () => {
    const csv = 'a,b,c\n1,2,3';
    const result = parseSheetCSV(csv);
    expect(result).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  // SA-6
  it('handles quoted fields with commas', () => {
    const csv = '"hello, world",b';
    const result = parseSheetCSV(csv);
    expect(result).toEqual([['hello, world', 'b']]);
  });

  // SA-7
  it('handles escaped quotes (doubled quotes)', () => {
    const csv = '"""quoted"""';
    const result = parseSheetCSV(csv);
    // The parser sees: " -> toggle inQuotes, " followed by " -> literal quote, q-u-o-t-e-d, " followed by " -> literal quote, " -> toggle inQuotes
    expect(result[0][0]).toBe('"quoted"');
  });

  // SA-8
  it('skips empty rows', () => {
    const csv = 'a,b\n\nc,d';
    const result = parseSheetCSV(csv);
    expect(result).toEqual([['a', 'b'], ['c', 'd']]);
  });

  // SA-9
  it('handles carriage returns in CSV', () => {
    const csv = 'a,b\r\n1,2';
    const result = parseSheetCSV(csv);
    expect(result).toEqual([['a', 'b'], ['1', '2']]);
  });

  // --- Credentials management ---

  // SA-10
  it('getCredentials returns null when not set', () => {
    expect(getCredentials()).toBeNull();
  });

  // SA-11
  describe('credentials round-trip', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('setCredentials stores and getCredentials retrieves', async () => {
      global.fetch.mockResolvedValue({ ok: true, text: async () => 'ok' });

      const url = 'https://docs.google.com/spreadsheets/d/testId123/edit';
      const result = await setCredentials(url);

      expect(result.success).toBe(true);

      const creds = getCredentials();
      expect(creds).not.toBeNull();
      expect(creds.spreadsheetId).toBe('testId123');
      expect(creds.sheetsUrl).toBe(url);
      expect(creds.connectedAt).toBeDefined();
    });
  });

  // SA-12
  it('clearCredentials removes stored credentials', () => {
    localStorage.setItem('_sheets_config', JSON.stringify({ spreadsheetId: 'x' }));
    expect(getCredentials()).not.toBeNull();
    clearCredentials();
    expect(getCredentials()).toBeNull();
  });

  // SA-13
  it('isConnected returns false when no credentials', () => {
    expect(isConnected()).toBe(false);
  });

  // SA-14
  it('isConnected returns true when credentials stored', () => {
    localStorage.setItem('_sheets_config', JSON.stringify({ spreadsheetId: 'x' }));
    expect(isConnected()).toBe(true);
  });

  // SA-15
  describe('setCredentials with invalid URL', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects invalid URL', async () => {
      const result = await setCredentials('https://example.com/not-a-sheet');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Google Sheets URL');
    });
  });

  // --- readSubscriptions ---

  describe('readSubscriptions', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // SA-16
    it('parses CSV into subscription objects', async () => {
      const csvText =
        '"id","name","price","currency","cycle","category","startDate","notificationsEnabled","reminderDays","url","color","lastModified"\n' +
        '"sub1","Netflix","15.99","USD","Monthly","entertainment","2024-01-01","true","7","","purple","2024-01-01T00:00:00.000Z"';

      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => csvText,
      });

      const subs = await readSubscriptions('fakeId');
      expect(subs).toHaveLength(1);
      expect(subs[0].id).toBe('sub1');
      expect(subs[0].name).toBe('Netflix');
      expect(subs[0].price).toBe(15.99);
      expect(subs[0].currency).toBe('USD');
      expect(subs[0].cycle).toBe('Monthly');
      expect(subs[0].category).toBe('entertainment');
      expect(subs[0].notificationsEnabled).toBe(true);
      expect(subs[0].reminderDays).toBe(7);
      expect(subs[0].color).toBe('purple');
    });
  });

  // --- readBudget ---

  describe('readBudget', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    // SA-17
    it('parses budget row from CSV', async () => {
      const csvText = '"amount","currency","lastModified"\n"100.50","EUR","2024-06-01T00:00:00.000Z"';

      global.fetch.mockResolvedValue({
        ok: true,
        text: async () => csvText,
      });

      const budget = await readBudget('fakeId');
      expect(budget).not.toBeNull();
      expect(budget.amount).toBe(100.5);
      expect(budget.currency).toBe('EUR');
      expect(budget.lastModified).toBe('2024-06-01T00:00:00.000Z');
    });
  });
});
