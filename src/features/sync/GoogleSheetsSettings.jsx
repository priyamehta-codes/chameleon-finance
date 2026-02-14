import { useState } from 'react';
import { useSheetsSync } from '@features/sync/useSheetsSync';

export default function GoogleSheetsSettings() {
  const { syncStatus, lastSyncTime, lastError, isConnected, connect, disconnect, pull } = useSheetsSync();
  const [sheetUrl, setSheetUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const connected = isConnected();

  const handleConnect = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const result = await connect(sheetUrl.trim());
      if (!result.success) {
        setError(result.error || 'Failed to connect');
      }
    } catch (err) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    await pull();
  };

  const formatSyncTime = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Google Sheets Sync</label>

      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-700">Connected</span>
          </div>

          <div className="text-xs text-slate-400">
            Last sync: {formatSyncTime(lastSyncTime)}
          </div>

          {lastError && (
            <p className="text-xs text-red-500">{lastError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={disconnect}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-500"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Connect a published Google Sheets CSV URL to sync your subscriptions.
          </p>

          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => {
              setSheetUrl(e.target.value);
              setError('');
            }}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      )}
    </div>
  );
}
