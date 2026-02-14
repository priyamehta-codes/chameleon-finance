import {
  getQueue,
  saveQueue,
  addChange,
  clearQueue,
  processPendingQueue,
  getQueueStats,
  getQueueStatusText,
  removeChange,
} from './offlineQueue';

describe('Offline Queue', () => {
  // OQ-1
  it('getQueue returns empty array when nothing stored', () => {
    expect(getQueue()).toEqual([]);
  });

  // OQ-2
  it('saveQueue + getQueue round-trip', () => {
    const items = [
      { id: 1, type: 'subscription_add', data: { name: 'A' }, timestamp: 1000, retries: 0, lastError: null },
    ];
    saveQueue(items);
    expect(getQueue()).toEqual(items);
  });

  // OQ-3
  it('addChange adds item to queue', () => {
    addChange('subscription_add', { name: 'Netflix' }, Date.now());
    const queue = getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('subscription_add');
    expect(queue[0].data.name).toBe('Netflix');
  });

  // OQ-4
  it('addChange generates unique ids', () => {
    addChange('subscription_add', { name: 'A' }, Date.now());
    addChange('subscription_edit', { name: 'B' }, Date.now());
    const queue = getQueue();
    expect(queue[0].id).not.toBe(queue[1].id);
  });

  // OQ-5
  it('addChange stores type, data, timestamp, retries=0, lastError=null', () => {
    const ts = 1700000000000;
    addChange('budget_set', { amount: 50 }, ts);
    const item = getQueue()[0];
    expect(item.type).toBe('budget_set');
    expect(item.data).toEqual({ amount: 50 });
    expect(item.timestamp).toBe(ts);
    expect(item.retries).toBe(0);
    expect(item.lastError).toBeNull();
  });

  // OQ-6
  it('clearQueue empties queue', () => {
    addChange('subscription_add', { name: 'A' }, Date.now());
    expect(getQueue()).toHaveLength(1);
    clearQueue();
    expect(getQueue()).toEqual([]);
  });

  // OQ-7
  it('getQueueStats returns total and byType', () => {
    addChange('subscription_add', {}, Date.now());
    addChange('subscription_add', {}, Date.now());
    addChange('budget_set', {}, Date.now());

    const stats = getQueueStats();
    expect(stats.total).toBe(3);
    expect(stats.byType['subscription_add']).toBe(2);
    expect(stats.byType['budget_set']).toBe(1);
  });

  // OQ-8
  it('getQueueStatusText returns "No pending changes" when empty', () => {
    expect(getQueueStatusText()).toBe('No pending changes');
  });

  // OQ-9
  it('getQueueStatusText returns descriptive text with counts', () => {
    addChange('subscription_add', {}, Date.now());
    addChange('budget_set', {}, Date.now());

    const text = getQueueStatusText();
    expect(text).toContain('2 pending');
    expect(text).toContain('subscription_add');
    expect(text).toContain('budget_set');
  });

  // OQ-10
  it('removeChange removes specific item by id', () => {
    addChange('subscription_add', { name: 'A' }, Date.now());
    addChange('subscription_edit', { name: 'B' }, Date.now());

    const queue = getQueue();
    const idToRemove = queue[0].id;
    removeChange(idToRemove);

    const updated = getQueue();
    expect(updated).toHaveLength(1);
    expect(updated[0].type).toBe('subscription_edit');
  });

  // OQ-11
  it('removeChange does nothing for non-existent id', () => {
    addChange('subscription_add', { name: 'A' }, Date.now());
    removeChange(999999);
    expect(getQueue()).toHaveLength(1);
  });

  // --- processPendingQueue ---

  // OQ-12
  it('returns {processed:0, failed:0} for empty queue', async () => {
    const result = await processPendingQueue(vi.fn(), vi.fn());
    expect(result).toEqual({ processed: 0, failed: 0 });
  });

  // OQ-13
  it('processes subscription_add type (returns true, counts as processed)', async () => {
    const mockPull = vi.fn().mockResolvedValue(undefined);
    const mockConnected = vi.fn().mockReturnValue(true);

    addChange('subscription_add', { name: 'test' }, Date.now());

    const result = await processPendingQueue(mockPull, mockConnected);
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    // Queue should be empty after processing
    expect(getQueue()).toHaveLength(0);
  });

  // OQ-14
  it('processes sync_failed type when connected (calls pullFromSheetsFn)', async () => {
    const mockPull = vi.fn().mockResolvedValue(undefined);
    const mockConnected = vi.fn().mockReturnValue(true);

    addChange('sync_failed', { reason: 'network' }, Date.now());

    const result = await processPendingQueue(mockPull, mockConnected);
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockConnected).toHaveBeenCalled();
    expect(mockPull).toHaveBeenCalled();
    expect(getQueue()).toHaveLength(0);
  });
});
