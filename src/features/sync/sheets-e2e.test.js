import {
  extractSpreadsheetId,
  parseSheetCSV,
  getCredentials,
  clearCredentials,
  isConnected,
  setCredentials,
} from './sheetsApi';
import {
  getQueue,
  addChange,
  clearQueue,
  processPendingQueue,
  getQueueStats,
  removeChange,
} from './offlineQueue';
import {
  loadSyncState,
  saveSyncState,
  detectConflicts,
  mergeData,
} from './syncManager';

describe('Sheets E2E Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Connection flow ---

  // E2E-1
  it('connect, verify isConnected, disconnect, verify not connected', async () => {
    global.fetch.mockResolvedValue({ ok: true, text: async () => 'ok' });

    const url = 'https://docs.google.com/spreadsheets/d/testSheet123/edit';
    await setCredentials(url);
    expect(isConnected()).toBe(true);

    clearCredentials();
    expect(isConnected()).toBe(false);
  });

  // E2E-2
  it('setCredentials with valid URL stores correct spreadsheetId', async () => {
    global.fetch.mockResolvedValue({ ok: true, text: async () => 'ok' });

    const url = 'https://docs.google.com/spreadsheets/d/mySpreadsheet456/edit#gid=0';
    const result = await setCredentials(url);
    expect(result.success).toBe(true);

    const creds = getCredentials();
    expect(creds.spreadsheetId).toBe('mySpreadsheet456');
  });

  // --- CSV parsing pipeline ---

  // E2E-3
  it('parse simple CSV', () => {
    const result = parseSheetCSV('name,price\nNetflix,15.99');
    expect(result).toEqual([['name', 'price'], ['Netflix', '15.99']]);
  });

  // E2E-4
  it('parse CSV with quoted commas', () => {
    const result = parseSheetCSV('"name, with comma",value');
    expect(result).toEqual([['name, with comma', 'value']]);
  });

  // E2E-5
  it('parse CSV with escaped quotes', () => {
    const result = parseSheetCSV('"""hello"""');
    expect(result[0][0]).toBe('"hello"');
  });

  // E2E-6
  it('parse empty CSV returns empty array', () => {
    const result = parseSheetCSV('');
    expect(result).toEqual([]);
  });

  // E2E-7
  it('parse CSV with only header row', () => {
    const result = parseSheetCSV('id,name,price');
    expect(result).toEqual([['id', 'name', 'price']]);
  });

  // --- URL validation ---

  // E2E-8
  it('valid spreadsheet URL extracts ID', () => {
    const id = extractSpreadsheetId('https://docs.google.com/spreadsheets/d/abc123/edit');
    expect(id).toBe('abc123');
  });

  // E2E-9
  it('URL without spreadsheets path returns null', () => {
    expect(extractSpreadsheetId('https://docs.google.com/document/d/abc123/edit')).toBeNull();
  });

  // E2E-10
  it('URL with query params still extracts ID', () => {
    const id = extractSpreadsheetId('https://docs.google.com/spreadsheets/d/xyz789/edit?usp=sharing');
    expect(id).toBe('xyz789');
  });

  // --- Offline queue lifecycle ---

  // E2E-11
  it('add -> verify stats -> clear -> verify empty', () => {
    addChange('subscription_add', { name: 'Spotify' }, Date.now());
    addChange('subscription_add', { name: 'Netflix' }, Date.now());

    const stats = getQueueStats();
    expect(stats.total).toBe(2);
    expect(stats.byType['subscription_add']).toBe(2);

    clearQueue();
    expect(getQueue()).toEqual([]);
    expect(getQueueStats().total).toBe(0);
  });

  // E2E-12
  it('multiple adds of different types -> stats.byType correct', () => {
    addChange('subscription_add', {}, Date.now());
    addChange('subscription_edit', {}, Date.now());
    addChange('subscription_delete', {}, Date.now());
    addChange('budget_set', {}, Date.now());

    const stats = getQueueStats();
    expect(stats.total).toBe(4);
    expect(stats.byType['subscription_add']).toBe(1);
    expect(stats.byType['subscription_edit']).toBe(1);
    expect(stats.byType['subscription_delete']).toBe(1);
    expect(stats.byType['budget_set']).toBe(1);
  });

  // E2E-13
  it('removeChange removes specific item from queue', () => {
    addChange('subscription_add', { name: 'A' }, Date.now());
    addChange('subscription_edit', { name: 'B' }, Date.now());
    addChange('budget_set', { amount: 100 }, Date.now());

    const queue = getQueue();
    const targetId = queue[1].id;
    removeChange(targetId);

    const updated = getQueue();
    expect(updated).toHaveLength(2);
    expect(updated.find(c => c.id === targetId)).toBeUndefined();
  });

  // E2E-14
  it('processPendingQueue with subscription changes processes all', async () => {
    const mockPull = vi.fn().mockResolvedValue(undefined);
    const mockConnected = vi.fn().mockReturnValue(true);

    addChange('subscription_add', { name: 'A' }, Date.now());
    addChange('subscription_edit', { name: 'B' }, Date.now());
    addChange('budget_set', { amount: 50 }, Date.now());

    const result = await processPendingQueue(mockPull, mockConnected);
    expect(result.processed).toBe(3);
    expect(result.failed).toBe(0);
    expect(getQueue()).toHaveLength(0);
  });

  // --- Sync state persistence ---

  // E2E-15
  it('save and load sync state', () => {
    const state = {
      lastSyncTime: '2024-07-15T12:00:00Z',
      pendingChanges: [{ id: 'c1', type: 'subscription_add' }],
    };
    saveSyncState(state);

    const loaded = loadSyncState();
    expect(loaded.lastSyncTime).toBe('2024-07-15T12:00:00Z');
    expect(loaded.pendingChanges).toHaveLength(1);
  });

  // E2E-16
  it('sync state survives clear of other localStorage keys', () => {
    saveSyncState({ lastSyncTime: '2024-01-01T00:00:00Z', pendingChanges: [] });

    // Clear unrelated keys
    localStorage.removeItem('_sheets_config');
    localStorage.removeItem('_offline_queue');

    const loaded = loadSyncState();
    expect(loaded.lastSyncTime).toBe('2024-01-01T00:00:00Z');
  });

  // --- Conflict detection ---

  // E2E-17
  it('no conflicts when timestamps far apart', () => {
    const cloudSubs = [{ id: '1', name: 'Cloud', lastModified: '2024-01-01T00:00:00Z' }];
    const localSubs = [{ id: '1', name: 'Local', lastModified: '2024-06-01T00:00:00Z' }];
    expect(detectConflicts(cloudSubs, localSubs)).toEqual([]);
  });

  // E2E-18
  it('conflict detected when close timestamps + different data', () => {
    const now = Date.now();
    const cloudSubs = [{ id: '1', name: 'CloudVersion', lastModified: new Date(now).toISOString() }];
    const localSubs = [{ id: '1', name: 'LocalVersion', lastModified: new Date(now + 20000).toISOString() }];

    const conflicts = detectConflicts(cloudSubs, localSubs);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe('1');
  });

  // E2E-19
  it('no conflict when close timestamps + same data', () => {
    const now = Date.now();
    // Same lastModified means cloudModified === localModified, condition fails
    const ts = new Date(now).toISOString();
    const cloudSubs = [{ id: '1', name: 'Same', lastModified: ts }];
    const localSubs = [{ id: '1', name: 'Same', lastModified: ts }];
    expect(detectConflicts(cloudSubs, localSubs)).toEqual([]);
  });

  // E2E-20
  it('no conflicts when IDs do not match', () => {
    const now = Date.now();
    const cloudSubs = [{ id: 'A', name: 'Cloud', lastModified: new Date(now).toISOString() }];
    const localSubs = [{ id: 'B', name: 'Local', lastModified: new Date(now + 5000).toISOString() }];
    expect(detectConflicts(cloudSubs, localSubs)).toEqual([]);
  });

  // --- Merge strategy ---

  // E2E-21
  it('disjoint subs merged', () => {
    const localSubs = [{ id: '1', name: 'Local', lastModified: '2024-01-01T00:00:00Z' }];
    const cloudSubs = [{ id: '2', name: 'Cloud', lastModified: '2024-01-01T00:00:00Z' }];

    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(2);
  });

  // E2E-22
  it('overlapping sub with newer local wins', () => {
    const localSubs = [{ id: '1', name: 'NewLocal', lastModified: '2024-06-01T00:00:00Z' }];
    const cloudSubs = [{ id: '1', name: 'OldCloud', lastModified: '2024-01-01T00:00:00Z' }];

    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(1);
    expect(merged.subscriptions[0].name).toBe('NewLocal');
  });

  // E2E-23
  it('overlapping sub with newer cloud wins', () => {
    const localSubs = [{ id: '1', name: 'OldLocal', lastModified: '2024-01-01T00:00:00Z' }];
    const cloudSubs = [{ id: '1', name: 'NewCloud', lastModified: '2024-06-01T00:00:00Z' }];

    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(1);
    expect(merged.subscriptions[0].name).toBe('NewCloud');
  });

  // E2E-24
  it('cloud-only budget used when no local budget', () => {
    const cloudBudget = { amount: 200, currency: 'USD', lastModified: '2024-01-01T00:00:00Z' };
    const merged = mergeData([], [], null, cloudBudget, [], []);
    expect(merged.budget).toEqual(cloudBudget);
  });

  // E2E-25
  it('newer local budget wins over cloud budget', () => {
    const localBudget = { amount: 300, currency: 'USD', lastModified: '2024-06-01T00:00:00Z' };
    const cloudBudget = { amount: 200, currency: 'USD', lastModified: '2024-01-01T00:00:00Z' };

    const merged = mergeData([], [], localBudget, cloudBudget, [], []);
    expect(merged.budget.amount).toBe(300);
  });

  // E2E-26
  it('trends merged by month without duplicates', () => {
    const localTrends = [
      { month: '2024-01', total: 50, lastModified: '2024-02-01T00:00:00Z' },
      { month: '2024-02', total: 60, lastModified: '2024-03-01T00:00:00Z' },
    ];
    const cloudTrends = [
      { month: '2024-02', total: 65, lastModified: '2024-04-01T00:00:00Z' }, // newer cloud
      { month: '2024-03', total: 70, lastModified: '2024-04-01T00:00:00Z' }, // cloud-only
    ];

    const merged = mergeData([], [], null, null, localTrends, cloudTrends);
    expect(merged.trends).toHaveLength(3);

    const feb = merged.trends.find(t => t.month === '2024-02');
    expect(feb.total).toBe(65); // cloud was newer

    const mar = merged.trends.find(t => t.month === '2024-03');
    expect(mar.total).toBe(70);
  });

  // E2E-27
  it('full pipeline: parse CSV -> detect conflicts -> merge', () => {
    // Parse subscription CSV
    const csvText =
      '"id","name","price","lastModified"\n' +
      '"sub1","Netflix","15.99","2024-06-01T00:00:00Z"\n' +
      '"sub2","Spotify","9.99","2024-05-01T00:00:00Z"';
    const rows = parseSheetCSV(csvText);
    const header = rows[0];
    const dataRows = rows.slice(1);

    // Convert parsed CSV to subscription-like objects
    const cloudSubs = dataRows.map(row => ({
      id: row[0],
      name: row[1],
      price: parseFloat(row[2]),
      lastModified: row[3],
    }));

    // Local subs with one overlapping (sub1) and one unique (sub3)
    const localSubs = [
      { id: 'sub1', name: 'Netflix Premium', price: 22.99, lastModified: '2024-07-01T00:00:00Z' },
      { id: 'sub3', name: 'Disney+', price: 7.99, lastModified: '2024-06-15T00:00:00Z' },
    ];

    // Detect conflicts -- timestamps are > 60s apart, so no conflicts
    const conflicts = detectConflicts(cloudSubs, localSubs);
    expect(conflicts).toHaveLength(0);

    // Merge
    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(3); // sub1 (local wins), sub3 (local only), sub2 (cloud only)

    const sub1 = merged.subscriptions.find(s => s.id === 'sub1');
    expect(sub1.name).toBe('Netflix Premium'); // local is newer
    expect(sub1.price).toBe(22.99);

    const sub2 = merged.subscriptions.find(s => s.id === 'sub2');
    expect(sub2.name).toBe('Spotify');

    const sub3 = merged.subscriptions.find(s => s.id === 'sub3');
    expect(sub3.name).toBe('Disney+');
  });

  // E2E-28
  it('credentials not set -> isConnected false -> getCredentials null', () => {
    expect(isConnected()).toBe(false);
    expect(getCredentials()).toBeNull();
  });
});
