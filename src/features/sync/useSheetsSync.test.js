import { act, renderHook, waitFor } from '@testing-library/react';
import { useSubscriptionStore } from '@store/subscriptionStore';
import * as SheetsAPI from './sheetsApi';
import * as SyncManager from './syncManager';
import { useSheetsSync } from './useSheetsSync';

describe('useSheetsSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useSubscriptionStore.setState({
      subs: [],
      step: 1,
      currentView: 'bar',
      income: 0,
    });
  });

  test('USS-1: initializes lastSyncTime from saved sync state', () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: '2026-02-15T10:00:00.000Z',
      pendingChanges: [],
    });

    const { result } = renderHook(() => useSheetsSync());
    expect(result.current.lastSyncTime).toBe('2026-02-15T10:00:00.000Z');
  });

  test('USS-2: connect delegates to Sheets API setCredentials', async () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: null,
      pendingChanges: [],
    });
    const setCredentialsSpy = vi
      .spyOn(SheetsAPI, 'setCredentials')
      .mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSheetsSync());
    let connectResult;

    await act(async () => {
      connectResult = await result.current.connect(
        'https://docs.google.com/spreadsheets/d/abc123/edit',
      );
    });

    expect(setCredentialsSpy).toHaveBeenCalledTimes(1);
    expect(connectResult.success).toBe(true);
  });

  test('USS-3: disconnect clears credentials and resets sync state', () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: '2026-02-15T10:00:00.000Z',
      pendingChanges: [],
    });
    const clearCredentialsSpy = vi.spyOn(SheetsAPI, 'clearCredentials').mockImplementation(() => {});

    const { result } = renderHook(() => useSheetsSync());

    act(() => {
      result.current.disconnect();
    });

    expect(clearCredentialsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.lastSyncTime).toBeNull();
  });

  test('USS-4: pull returns false when not connected', async () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: null,
      pendingChanges: [],
    });
    vi.spyOn(SheetsAPI, 'getCredentials').mockReturnValue(null);
    const pullFromSheetsSpy = vi
      .spyOn(SyncManager, 'pullFromSheets')
      .mockResolvedValue({ merged: {}, conflicts: [] });

    const { result } = renderHook(() => useSheetsSync());
    let pullOk = true;

    await act(async () => {
      pullOk = await result.current.pull();
    });

    expect(pullOk).toBe(false);
    expect(pullFromSheetsSpy).not.toHaveBeenCalled();
  });

  test('USS-5: pull merges cloud data and persists sync metadata', async () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: null,
      pendingChanges: [],
    });
    vi.spyOn(SheetsAPI, 'getCredentials').mockReturnValue({
      spreadsheetId: 'sheet_123',
    });
    const saveSyncStateSpy = vi
      .spyOn(SyncManager, 'saveSyncState')
      .mockImplementation(() => {});

    useSubscriptionStore.setState({
      subs: [{ id: 'local-1', name: 'Local', price: 9.99 }],
    });
    localStorage.setItem('subgrid_budget', JSON.stringify({ amount: 50, currency: 'USD' }));
    localStorage.setItem('subgrid_history', JSON.stringify([{ month: '2026-01', total: 10 }]));

    vi.spyOn(SyncManager, 'pullFromSheets').mockResolvedValue({
      merged: {
        subscriptions: [{ id: 'cloud-1', name: 'Cloud Sub', price: 19.99 }],
        budget: { amount: 120, currency: 'USD', lastModified: '2026-02-01T00:00:00.000Z' },
        trends: [{ month: '2026-02', total: 120, lastModified: '2026-02-01T00:00:00.000Z' }],
      },
      conflicts: [],
    });

    const { result } = renderHook(() => useSheetsSync());
    let pullOk = false;

    await act(async () => {
      pullOk = await result.current.pull();
    });

    expect(pullOk).toBe(true);
    expect(useSubscriptionStore.getState().subs).toEqual([
      { id: 'cloud-1', name: 'Cloud Sub', price: 19.99 },
    ]);
    expect(JSON.parse(localStorage.getItem('subgrid_budget'))).toEqual({
      amount: 120,
      currency: 'USD',
      lastModified: '2026-02-01T00:00:00.000Z',
    });
    expect(JSON.parse(localStorage.getItem('subgrid_history'))).toEqual([
      { month: '2026-02', total: 120, lastModified: '2026-02-01T00:00:00.000Z' },
    ]);
    expect(saveSyncStateSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.syncStatus).toBe('idle'));
    expect(result.current.lastSyncTime).not.toBeNull();
  });

  test('USS-6: pull surfaces error state on sync failure', async () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: null,
      pendingChanges: [],
    });
    vi.spyOn(SheetsAPI, 'getCredentials').mockReturnValue({
      spreadsheetId: 'sheet_123',
    });
    vi.spyOn(SyncManager, 'pullFromSheets').mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useSheetsSync());
    let pullOk = true;

    await act(async () => {
      pullOk = await result.current.pull();
    });

    expect(pullOk).toBe(false);
    expect(result.current.syncStatus).toBe('error');
    expect(result.current.lastError).toBe('Network down');
  });

  test('USS-7: resolveConflicts("cloud") applies cloud winner into local store', async () => {
    vi.spyOn(SyncManager, 'loadSyncState').mockReturnValue({
      lastSyncTime: null,
      pendingChanges: [],
    });
    vi.spyOn(SheetsAPI, 'getCredentials').mockReturnValue({
      spreadsheetId: 'sheet_123',
    });

    useSubscriptionStore.setState({
      subs: [{ id: '1', name: 'Local Name', price: 10 }],
    });

    vi.spyOn(SyncManager, 'pullFromSheets').mockResolvedValue({
      merged: {
        subscriptions: [{ id: '1', name: 'Local Name', price: 10 }],
        budget: null,
        trends: [],
      },
      conflicts: [
        {
          id: '1',
          local: { id: '1', name: 'Local Name', price: 10 },
          cloud: { id: '1', name: 'Cloud Name', price: 10 },
        },
      ],
    });

    const { result } = renderHook(() => useSheetsSync());

    await act(async () => {
      await result.current.pull();
    });

    expect(result.current.conflicts).toHaveLength(1);

    act(() => {
      result.current.resolveConflicts('cloud');
    });

    expect(useSubscriptionStore.getState().subs[0].name).toBe('Cloud Name');
    expect(result.current.conflicts).toHaveLength(0);
  });
});
