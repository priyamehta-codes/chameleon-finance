import { useState, useEffect } from 'react';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useCurrencyStore } from '@store/currencyStore';
import { CATEGORIES, suggestCategory } from '@shared/lib/categories';
import { randColor, LOGO_API_TOKEN } from '@shared/lib/constants';
import { Analytics } from '@shared/lib/analytics';
import Modal from '@shared/ui/Modal';
import ColorPicker from '@shared/ui/ColorPicker';

const defaultForm = {
  id: '',
  name: '',
  price: '',
  currency: 'USD',
  cycle: 'Monthly',
  url: '',
  color: '',
  category: 'other',
  startDate: '',
  notificationsEnabled: false,
  reminderDays: 7,
};

export default function AddSubscriptionModal({ isOpen, onClose, editId, preset }) {
  const subs = useSubscriptionStore((s) => s.subs);
  const addSub = useSubscriptionStore((s) => s.addSub);
  const editSub = useSubscriptionStore((s) => s.editSub);
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);

  const [form, setForm] = useState({ ...defaultForm, currency: selectedCurrency });
  const [suggestion, setSuggestion] = useState('');

  useEffect(() => {
    if (editId) {
      const sub = subs.find(s => s.id === editId);
      if (sub) {
        setForm({
          id: sub.id,
          name: sub.name,
          price: sub.price,
          currency: sub.currency || selectedCurrency,
          cycle: sub.cycle,
          url: sub.url || '',
          color: sub.color || randColor().id,
          category: sub.category || 'other',
          startDate: sub.startDate || '',
          notificationsEnabled: sub.notificationsEnabled || false,
          reminderDays: sub.reminderDays || 7,
        });
      }
    } else if (preset) {
      setForm({
        ...defaultForm,
        name: preset.name,
        price: preset.price,
        cycle: preset.cycle,
        color: preset.color || randColor().id,
        currency: selectedCurrency,
        url: preset.domain ? `https://${preset.domain}` : '',
      });
    } else if (isOpen) {
      setForm({ ...defaultForm, currency: selectedCurrency, color: randColor().id });
    }
  }, [editId, preset, isOpen, subs, selectedCurrency]);

  useEffect(() => {
    if (form.name) {
      const cat = suggestCategory(form.name);
      const catObj = Object.values(CATEGORIES).find(c => c.id === cat);
      setSuggestion(catObj ? catObj.name : 'Other');
    } else {
      setSuggestion('');
    }
  }, [form.name]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const subData = {
      ...form,
      price: parseFloat(form.price),
      color: form.color || randColor().id,
      date: new Date().toISOString().split('T')[0],
    };

    if (form.id) {
      editSub(form.id, subData);
      Analytics.track('subscription_edited', { name: subData.name, value: subData.price });
    } else {
      addSub(subData);
      Analytics.track('subscription_added', { name: subData.name, value: subData.price });
    }

    onClose();
  };

  const faviconDomain = form.url
    ? form.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    : null;
  const faviconUrl = faviconDomain && faviconDomain.length > 3
    ? `https://img.logo.dev/${faviconDomain}?token=${LOGO_API_TOKEN}&size=100&retina=true&format=png`
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editId ? 'Edit Subscription' : 'Add Subscription'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g. Netflix"
            required
          />
          {suggestion && (
            <p className="mt-1 text-xs text-slate-400">Suggested: {suggestion}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Price</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="9.99"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {Object.entries(useCurrencyStore.getState().currencies).map(([code, curr]) => (
                <option key={code} value={code}>{curr.symbol} {code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Billing Cycle</label>
            <select
              value={form.cycle}
              onChange={(e) => setForm({ ...form, cycle: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {Object.values(CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Website URL</label>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              {faviconUrl ? (
                <img src={faviconUrl} className="h-full w-full rounded-xl object-cover" crossOrigin="anonymous" alt="" />
              ) : (
                <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              )}
            </div>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="netflix.com"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Start Date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Color</label>
          <ColorPicker value={form.color} onChange={(id) => setForm({ ...form, color: id })} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="notifications"
            checked={form.notificationsEnabled}
            onChange={(e) => setForm({ ...form, notificationsEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <label htmlFor="notifications" className="text-sm text-slate-600">Enable renewal reminders</label>
        </div>

        {form.notificationsEnabled && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Remind me days before</label>
            <input
              type="number"
              min="1"
              max="30"
              value={form.reminderDays}
              onChange={(e) => setForm({ ...form, reminderDays: parseInt(e.target.value) || 7 })}
              className="w-24 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl"
        >
          {editId ? 'Save Changes' : 'Add Subscription'}
        </button>
      </form>
    </Modal>
  );
}
