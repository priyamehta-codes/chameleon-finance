import { useSubscriptionStore } from '@store/subscriptionStore';
import { Analytics } from '@shared/lib/analytics';
import SubscriptionCard from './SubscriptionCard';

export default function SubscriptionList({ onEdit, onOpenModal }) {
  const subs = useSubscriptionStore((s) => s.subs);
  const removeSub = useSubscriptionStore((s) => s.removeSub);

  const handleRemove = (id) => {
    const removed = subs.find(s => s.id === id);
    removeSub(id);
    if (removed) {
      Analytics.track('subscription_removed', { name: removed.name });
    }
  };

  if (subs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm font-semibold text-slate-500">No subscriptions yet</p>
        <p className="mt-1 text-xs text-slate-400">Add your first subscription to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subs.map((sub) => (
        <SubscriptionCard
          key={sub.id}
          sub={sub}
          onEdit={onEdit}
          onRemove={handleRemove}
        />
      ))}
      <button
        onClick={onOpenModal}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 font-bold text-slate-400 transition-all hover:border-indigo-300 hover:bg-white hover:text-indigo-600"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Another
      </button>
    </div>
  );
}
