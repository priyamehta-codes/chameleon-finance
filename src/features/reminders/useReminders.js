import { useMemo } from 'react';
import { useSubscriptionStore } from '@store/subscriptionStore';

export function calculateNextRenewal(startDate, cycle) {
  if (!startDate) return null;

  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;

    const today = new Date();
    const nextRenewal = new Date(start);

    while (nextRenewal <= today) {
      if (cycle === 'Weekly') {
        nextRenewal.setDate(nextRenewal.getDate() + 7);
      } else if (cycle === 'Yearly') {
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      } else {
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      }
    }

    return nextRenewal.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export function getDaysUntilRenewal(renewalDate) {
  if (!renewalDate) return 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renewal = new Date(renewalDate);
    renewal.setHours(0, 0, 0, 0);

    const timeDiff = renewal - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return Math.max(0, daysDiff);
  } catch {
    return 0;
  }
}

export function getRenewalBadgeText(daysUntil) {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  return `${daysUntil}d`;
}

export function getRenewalBadgeClass(daysUntil) {
  if (daysUntil <= 3) return 'renewal-badge-urgent';
  if (daysUntil <= 7) return 'renewal-badge-warning';
  return 'renewal-badge-normal';
}

export function getUpcomingRenewals(subs, daysAhead = 30) {
  const result = [];
  const today = new Date();
  const cutoffDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    if (!sub.startDate) continue;

    const renewalDate = calculateNextRenewal(sub.startDate, sub.cycle);
    if (!renewalDate) continue;

    const renewal = new Date(renewalDate);
    if (renewal > today && renewal <= cutoffDate) {
      result.push({
        ...sub,
        renewalDate,
        daysUntilRenewal: getDaysUntilRenewal(renewalDate)
      });
    }
  }

  result.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  return result;
}

export function useReminders() {
  const subs = useSubscriptionStore((s) => s.subs);

  const upcoming = useMemo(() => {
    return getUpcomingRenewals(subs, 30);
  }, [subs]);

  return {
    upcoming,
    calculateNextRenewal,
    getDaysUntilRenewal,
    getRenewalBadgeText,
    getRenewalBadgeClass,
  };
}
