import { useCallback, useState } from 'react';
import Modal from '@shared/ui/Modal';
import CurrencySelect from '@shared/ui/CurrencySelect';
import BudgetSettings from '@features/budget/BudgetSettings';
import ThemeToggle from '@features/settings/ThemeToggle';
import GoogleSheetsSettings from '@features/sync/GoogleSheetsSettings';
import { useCurrencyStore } from '@store/currencyStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useFinanceStore } from '@store/financeStore';
import {
  backupToServer,
  getServerToken,
  isValidServerToken,
  restoreFromServer,
  saveServerToken,
} from '@shared/lib/serverStorage';

export default function SettingsModal({ isOpen, onClose }) {
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const subs = useSubscriptionStore((s) => s.subs);
  const setSubs = useSubscriptionStore((s) => s.setSubs);
  const income = useSubscriptionStore((s) => s.income);
  const setIncome = useSubscriptionStore((s) => s.setIncome);
  const records = useFinanceStore((s) => s.records);
  const setRecords = useFinanceStore((s) => s.setRecords);

  const [serverToken, setServerToken] = useState(() => getServerToken());
  const [serverBusy, setServerBusy] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const handleExport = useCallback(() => {
    const data = JSON.stringify(subs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chameleon-export-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [subs]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (Array.isArray(imported)) {
            setSubs(imported);
          }
        } catch (err) {
          console.error('Failed to import:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setSubs]);

  const handleServerTokenChange = (value) => {
    setServerToken(value);
    saveServerToken(value);
    if (!value) {
      setServerMessage('');
    }
  };

  const handleBackupToCloud = useCallback(async () => {
    try {
      setServerBusy(true);
      setServerMessage('');

      const budgetRaw = localStorage.getItem('subgrid_budget');
      const trendsRaw = localStorage.getItem('subgrid_history');
      const budget = budgetRaw ? JSON.parse(budgetRaw) : null;
      const trends = trendsRaw ? JSON.parse(trendsRaw) : [];

      const payload = {
        version: 2,
        backupDate: new Date().toISOString(),
        subscriptions: subs,
        budget,
        trends,
        financeRecords: records,
        income,
      };

      const result = await backupToServer(serverToken, payload);
      setServerMessage(`Cloud backup complete (${result.backupDate || 'ok'})`);
    } catch (err) {
      setServerMessage(`Cloud backup failed: ${err.message}`);
    } finally {
      setServerBusy(false);
    }
  }, [income, records, serverToken, subs]);

  const handleRestoreFromCloud = useCallback(async () => {
    try {
      setServerBusy(true);
      setServerMessage('');

      const data = await restoreFromServer(serverToken);

      if (Array.isArray(data.subscriptions)) {
        setSubs(data.subscriptions);
      }
      if (Array.isArray(data.financeRecords)) {
        setRecords(data.financeRecords);
      }
      if (typeof data.income === 'number') {
        setIncome(data.income);
      }

      if (data.budget) {
        localStorage.setItem('subgrid_budget', JSON.stringify(data.budget));
      } else {
        localStorage.removeItem('subgrid_budget');
      }

      if (Array.isArray(data.trends)) {
        localStorage.setItem('subgrid_history', JSON.stringify(data.trends));
      } else {
        localStorage.removeItem('subgrid_history');
      }

      setServerMessage('Cloud restore complete');
    } catch (err) {
      setServerMessage(`Cloud restore failed: ${err.message}`);
    } finally {
      setServerBusy(false);
    }
  }, [serverToken, setIncome, setRecords, setSubs]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Theme */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Appearance</label>
          <ThemeToggle />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Display Currency</label>
          <CurrencySelect value={selectedCurrency} onChange={setCurrency} className="w-full" />
        </div>

        {/* Monthly Income */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Income</label>
          <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">Used in the Sankey diagram to show income vs expenses</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 5000"
              value={income || ''}
              onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedCurrency}</span>
          </div>
        </div>

        {/* Budget */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <BudgetSettings />
        </div>

        {/* Google Sheets */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <GoogleSheetsSettings />
        </div>

        {/* Import / Export */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">Data</label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import JSON
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Secure Cloud Backup (Optional)
          </label>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
            Uses server-side R2 storage via `/api/r2/backup`. Your user token stays local to this browser.
          </p>
          <input
            type="password"
            value={serverToken}
            onChange={(e) => handleServerTokenChange(e.target.value)}
            placeholder="64-char user token"
            className="mb-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          />
          <div className="mb-2 text-xs text-slate-400 dark:text-slate-500">
            {serverToken ? (isValidServerToken(serverToken) ? 'Token format looks valid' : 'Token format invalid') : 'No token set'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackupToCloud}
              disabled={serverBusy || !isValidServerToken(serverToken)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Backup to Cloud
            </button>
            <button
              onClick={handleRestoreFromCloud}
              disabled={serverBusy || !isValidServerToken(serverToken)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Restore from Cloud
            </button>
          </div>
          {serverMessage && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{serverMessage}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
