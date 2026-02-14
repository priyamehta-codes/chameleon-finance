import { loadSyncState, saveSyncState, detectConflicts, mergeData } from './syncManager';

describe('Sync Manager', () => {
  // --- loadSyncState / saveSyncState ---

  // SM-1
  it('loadSyncState returns default when empty', () => {
    const state = loadSyncState();
    expect(state).toEqual({ lastSyncTime: null, pendingChanges: [] });
  });

  // SM-2
  it('saveSyncState + loadSyncState round-trip', () => {
    const state = {
      lastSyncTime: '2024-06-01T00:00:00.000Z',
      pendingChanges: [{ id: '1', type: 'subscription_add' }],
    };
    saveSyncState(state);
    const loaded = loadSyncState();
    expect(loaded.lastSyncTime).toBe('2024-06-01T00:00:00.000Z');
    expect(loaded.pendingChanges).toHaveLength(1);
    expect(loaded.pendingChanges[0].id).toBe('1');
  });

  // SM-3
  it('loadSyncState handles corrupted data gracefully', () => {
    localStorage.setItem('_sync_state', '{invalid json!!!');
    const state = loadSyncState();
    expect(state).toEqual({ lastSyncTime: null, pendingChanges: [] });
  });

  // --- detectConflicts ---

  // SM-4
  it('returns empty array when no matching IDs', () => {
    const cloudSubs = [{ id: '1', name: 'Cloud', lastModified: '2024-01-01T00:00:00Z' }];
    const localSubs = [{ id: '2', name: 'Local', lastModified: '2024-01-01T00:00:00Z' }];
    expect(detectConflicts(cloudSubs, localSubs)).toEqual([]);
  });

  // SM-5
  it('returns empty array when timestamps differ by more than 60s', () => {
    const cloudSubs = [{ id: '1', name: 'CloudName', lastModified: '2024-01-01T00:00:00Z' }];
    const localSubs = [{ id: '1', name: 'LocalName', lastModified: '2024-01-01T00:02:00Z' }]; // 120s apart
    expect(detectConflicts(cloudSubs, localSubs)).toEqual([]);
  });

  // SM-6
  it('returns conflict when timestamps close and content differs', () => {
    const now = Date.now();
    const cloudSubs = [{ id: '1', name: 'CloudName', lastModified: new Date(now).toISOString() }];
    const localSubs = [{ id: '1', name: 'LocalName', lastModified: new Date(now + 30000).toISOString() }]; // 30s apart
    const conflicts = detectConflicts(cloudSubs, localSubs);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe('1');
    expect(conflicts[0].local.name).toBe('LocalName');
    expect(conflicts[0].cloud.name).toBe('CloudName');
  });

  // SM-7
  it('returns empty array when timestamps close but content identical', () => {
    const now = Date.now();
    // Both objects must be structurally identical for JSON.stringify comparison
    const sub = { id: '1', name: 'Same', price: 10, lastModified: new Date(now).toISOString() };
    // With identical lastModified, cloudModified === localModified, so the condition fails
    const cloudSubs = [{ ...sub }];
    const localSubs = [{ ...sub }];
    expect(detectConflicts(cloudSubs, localSubs)).toEqual([]);
  });

  // --- mergeData ---

  // SM-8
  it('merges disjoint subscriptions (local has A, cloud has B)', () => {
    const localSubs = [{ id: '1', name: 'A', lastModified: '2024-02-01T00:00:00Z' }];
    const cloudSubs = [{ id: '2', name: 'B', lastModified: '2024-01-01T00:00:00Z' }];
    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(2);
    const ids = merged.subscriptions.map(s => s.id);
    expect(ids).toContain('1');
    expect(ids).toContain('2');
  });

  // SM-9
  it('last-write-wins for overlapping subs (local newer -> local wins)', () => {
    const localSubs = [{ id: '1', name: 'LocalVersion', lastModified: '2024-06-01T00:00:00Z' }];
    const cloudSubs = [{ id: '1', name: 'CloudVersion', lastModified: '2024-01-01T00:00:00Z' }];
    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(1);
    expect(merged.subscriptions[0].name).toBe('LocalVersion');
  });

  // SM-10
  it('cloud-only subs added to result', () => {
    const localSubs = [];
    const cloudSubs = [{ id: '3', name: 'CloudOnly', lastModified: '2024-01-01T00:00:00Z' }];
    const merged = mergeData(localSubs, cloudSubs, null, null, [], []);
    expect(merged.subscriptions).toHaveLength(1);
    expect(merged.subscriptions[0].name).toBe('CloudOnly');
  });
});
