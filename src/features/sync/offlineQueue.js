/**
 * Offline Queue Manager
 * Tracks and persists changes made while offline
 */

const QUEUE_KEY = '_offline_queue';

export function getQueue() {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn('Failed to load queue:', err);
    return [];
  }
}

export function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save queue:', err);
  }
}

export function addChange(type, data, timestamp) {
  try {
    const queue = getQueue();

    const change = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp,
      retries: 0,
      lastError: null
    };

    queue.push(change);
    saveQueue(queue);

    console.log(`Queued: ${type} (${queue.length} items total)`);
  } catch (err) {
    console.error('Failed to add change to queue:', err);
  }
}

export function clearQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
    console.log('Offline queue cleared');
  } catch (err) {
    console.error('Failed to clear queue:', err);
  }
}

/**
 * Process a single change based on its type
 */
async function processChange(change, pullFromSheetsFn, isConnectedFn) {
  try {
    switch (change.type) {
      case 'subscription_add':
      case 'subscription_edit':
      case 'subscription_delete':
      case 'budget_set':
      case 'budget_clear':
      case 'data_modified':
        // In read-only mode, local changes are tracked but not pushed
        return true;

      case 'sync_failed':
        if (isConnectedFn()) {
          await pullFromSheetsFn();
          return true;
        }
        return false;

      default:
        console.warn(`Unknown change type: ${change.type}`);
        return false;
    }
  } catch (err) {
    console.error(`Failed to process change of type ${change.type}:`, err);
    return false;
  }
}

/**
 * Process pending queue items
 */
export async function processPendingQueue(pullFromSheetsFn, isConnectedFn) {
  const queue = getQueue();

  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  console.log(`Processing ${queue.length} queued changes...`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const change = queue[i];

    try {
      const success = await processChange(change, pullFromSheetsFn, isConnectedFn);

      if (success) {
        processed++;
        queue.splice(i, 1);
        i--;
      } else {
        failed++;
        change.retries++;

        if (change.retries >= 3) {
          console.warn(`Max retries exceeded for: ${change.type}`);
          queue.splice(i, 1);
          i--;
        }
      }
    } catch (err) {
      console.error(`Error processing change: ${err.message}`);
      failed++;
      change.lastError = err.message;
      change.retries++;

      if (change.retries >= 3) {
        queue.splice(i, 1);
        i--;
      }
    }
  }

  saveQueue(queue);

  console.log(`Queue processed: ${processed} successful, ${failed} failed`);
  return { processed, failed };
}

export function getQueueStats() {
  const queue = getQueue();
  const stats = { total: queue.length, byType: {} };

  for (let change of queue) {
    if (!stats.byType[change.type]) {
      stats.byType[change.type] = 0;
    }
    stats.byType[change.type]++;
  }

  return stats;
}

export function getQueueStatusText() {
  const stats = getQueueStats();

  if (stats.total === 0) {
    return 'No pending changes';
  }

  const types = Object.entries(stats.byType)
    .map(([type, count]) => `${count}x ${type}`)
    .join(', ');

  return `${stats.total} pending: ${types}`;
}

export function removeChange(changeId) {
  const queue = getQueue();
  const index = queue.findIndex(c => c.id === changeId);

  if (index !== -1) {
    queue.splice(index, 1);
    saveQueue(queue);
  }
}
