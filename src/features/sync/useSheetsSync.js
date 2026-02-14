import { useState, useCallback } from 'react';
import * as SheetsAPI from './sheetsApi';
import * as SyncManager from './syncManager';
import * as OfflineQueue from './offlineQueue';
import { useSubscriptionStore } from '@store/subscriptionStore';

export function useSheetsSync() {
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'error' | 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    const state = SyncManager.loadSyncState();
    return state.lastSyncTime;
  });
  const [lastError, setLastError] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  const subs = useSubscriptionStore((s) => s.subs);
  const setSubs = useSubscriptionStore((s) => s.setSubs);

  const isConnected = useCallback(() => SheetsAPI.isConnected(), []);

  const connect = useCallback(async (sheetUrl) => {
    const result = await SheetsAPI.setCredentials(sheetUrl);
    return result;
  }, []);

  const disconnect = useCallback(() => {
    SheetsAPI.clearCredentials();
    setSyncStatus('idle');
    setLastSyncTime(null);
  }, []);

  const pull = useCallback(async () => {
    const creds = SheetsAPI.getCredentials();
    if (!creds) return false;

    try {
      setSyncStatus('syncing');
      setLastError(null);

      const localBudget = (() => {
        try {
          const data = localStorage.getItem('subgrid_budget');
          return data ? JSON.parse(data) : null;
        } catch { return null; }
      })();

      const localTrends = (() => {
        try {
          const data = localStorage.getItem('subgrid_history');
          return data ? JSON.parse(data) : [];
        } catch { return []; }
      })();

      const result = await SyncManager.pullFromSheets(
        creds.spreadsheetId,
        subs,
        localBudget,
        localTrends
      );

      if (result.conflicts.length > 0) {
        setConflicts(result.conflicts);
      }

      if (result.merged.subscriptions) {
        setSubs(result.merged.subscriptions);
      }
      if (result.merged.budget) {
        localStorage.setItem('subgrid_budget', JSON.stringify(result.merged.budget));
      }
      if (result.merged.trends) {
        localStorage.setItem('subgrid_history', JSON.stringify(result.merged.trends));
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      setSyncStatus('idle');
      SyncManager.saveSyncState({ lastSyncTime: now, pendingChanges: [] });

      return true;
    } catch (err) {
      console.error('Pull from Sheets failed:', err);
      setLastError(err.message);
      setSyncStatus('error');
      return false;
    }
  }, [subs, setSubs]);

  const resolveConflicts = useCallback((choice) => {
    if (choice === 'cloud') {
      for (const conflict of conflicts) {
        const index = subs.findIndex(s => s.id === conflict.id);
        if (index !== -1) {
          const updated = [...subs];
          updated[index] = conflict.cloud;
          setSubs(updated);
        }
      }
    }
    setConflicts([]);
  }, [conflicts, subs, setSubs]);

  return {
    syncStatus,
    lastSyncTime,
    lastError,
    conflicts,
    isConnected,
    connect,
    disconnect,
    pull,
    resolveConflicts,
  };
}
