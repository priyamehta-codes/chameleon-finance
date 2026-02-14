import { useState, useEffect } from 'react';
import { useFinanceStore } from '@store/financeStore';
import { FINANCE_TYPES, PAYMENT_METHODS, HOW_PAID_OPTIONS } from '@shared/lib/financeConstants';
import Modal from '@shared/ui/Modal';

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200';
const selectClass = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200';
const labelClass = 'mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300';

const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  interestRate: '',
  income: '',
  expenses: '',
  minimumExpenses: '',
  balance: '',
  dueDate: '',
  paymentMethod: '',
  howPaid: '',
  done: false,
  type: 'Utility',
  note: '',
};

export default function FinanceRecordModal({ isOpen, onClose, editId }) {
  const records = useFinanceStore((s) => s.records);
  const addRecord = useFinanceStore((s) => s.addRecord);
  const editRecord = useFinanceStore((s) => s.editRecord);

  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (editId) {
      const existing = records.find((r) => r.id === editId);
      if (existing) {
        setForm({
          date: existing.date || '',
          description: existing.description || '',
          interestRate: existing.interestRate || '',
          income: existing.income || '',
          expenses: existing.expenses || '',
          minimumExpenses: existing.minimumExpenses || '',
          balance: existing.balance || '',
          dueDate: existing.dueDate || '',
          paymentMethod: existing.paymentMethod || '',
          howPaid: existing.howPaid || '',
          done: existing.done || false,
          type: existing.type || 'Utility',
          note: existing.note || '',
        });
      }
    } else if (isOpen) {
      setForm({ ...defaultForm });
    }
  }, [editId, isOpen, records]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...form,
      interestRate: parseFloat(form.interestRate) || 0,
      income: parseFloat(form.income) || 0,
      expenses: parseFloat(form.expenses) || 0,
      minimumExpenses: parseFloat(form.minimumExpenses) || 0,
      balance: parseFloat(form.balance) || 0,
    };

    if (editId) {
      editRecord(editId, data);
    } else {
      addRecord(data);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editId ? 'Edit Record' : 'Add Record'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={selectClass}
            >
              {FINANCE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
            placeholder="e.g. Monthly Salary, Water Bill"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Income</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.income}
              onChange={(e) => setForm({ ...form, income: e.target.value })}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Expenses</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.expenses}
              onChange={(e) => setForm({ ...form, expenses: e.target.value })}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Minimum Expenses</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.minimumExpenses}
              onChange={(e) => setForm({ ...form, minimumExpenses: e.target.value })}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Interest Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.interestRate}
              onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Balance</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Payment Method</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className={selectClass}
            >
              <option value="">Select...</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>How I paid?</label>
            <select
              value={form.howPaid}
              onChange={(e) => setForm({ ...form, howPaid: e.target.value })}
              className={selectClass}
            >
              <option value="">Select...</option>
              {HOW_PAID_OPTIONS.map((hp) => (
                <option key={hp} value={hp}>{hp}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Note</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className={inputClass + ' resize-none'}
            rows={2}
            placeholder="Optional note..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="finance-done"
            checked={form.done}
            onChange={(e) => setForm({ ...form, done: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600"
          />
          <label htmlFor="finance-done" className="text-sm text-slate-600 dark:text-slate-400">Mark as done</label>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl"
        >
          {editId ? 'Save Changes' : 'Add Record'}
        </button>
      </form>
    </Modal>
  );
}
