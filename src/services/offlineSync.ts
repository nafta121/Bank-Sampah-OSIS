import { WasteTransaction, ClassProfile } from '../types/index.ts';
import { saveTransactionToFirestore } from './firebase.ts';

const OFFLINE_QUEUE_KEY = 'bank_sampah_offline_transactions';
const LOCAL_CLASSES_CACHE = 'bank_sampah_local_classes';

export interface OfflineQueueItem {
  transaction: WasteTransaction;
  classSnapshot: ClassProfile;
  enqueuedAt: string;
}

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineQueueItem[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
}

export function enqueueOfflineTransaction(
  transaction: WasteTransaction,
  classSnapshot: ClassProfile
): OfflineQueueItem[] {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    transaction: {
      ...transaction,
      status: 'pending',
      isOfflineQueue: true,
    },
    classSnapshot,
    enqueuedAt: new Date().toISOString(),
  };

  queue.push(newItem);
  saveOfflineQueue(queue);

  // Update local cache of class balance so user sees optimistic offline balance
  updateLocalClassCache(classSnapshot, transaction);

  return queue;
}

export function getLocalClassesCache(): ClassProfile[] | null {
  try {
    const data = localStorage.getItem(LOCAL_CLASSES_CACHE);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setLocalClassesCache(classes: ClassProfile[]) {
  try {
    localStorage.setItem(LOCAL_CLASSES_CACHE, JSON.stringify(classes));
  } catch (e) {
    console.error('Error setting local classes cache:', e);
  }
}

function updateLocalClassCache(cls: ClassProfile, tx: WasteTransaction) {
  const classes = getLocalClassesCache() || [];
  const idx = classes.findIndex((c) => c.classId === cls.classId);
  const updatedCls: ClassProfile = {
    ...cls,
    points: (cls.points || 0) + tx.pointsEarned,
    balance: (cls.balance || 0) + tx.cashEarned,
    totalWeightKg: Number(((cls.totalWeightKg || 0) + tx.weightKg).toFixed(2)),
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    classes[idx] = updatedCls;
  } else {
    classes.push(updatedCls);
  }
  setLocalClassesCache(classes);
}

export async function processOfflineSync(
  onProgress?: (current: number, total: number) => void
): Promise<{ successCount: number; errors: any[] }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { successCount: 0, errors: [] };
  }

  const remaining: OfflineQueueItem[] = [];
  const errors: any[] = [];
  let successCount = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      const txToSync: WasteTransaction = {
        ...item.transaction,
        status: 'synced',
        isOfflineQueue: false,
      };
      await saveTransactionToFirestore(txToSync, item.classSnapshot);
      successCount++;
      if (onProgress) {
        onProgress(successCount, queue.length);
      }
    } catch (err) {
      console.error('Failed syncing transaction item:', item.transaction.transactionId, err);
      remaining.push(item);
      errors.push({ id: item.transaction.transactionId, error: err });
    }
  }

  saveOfflineQueue(remaining);
  return { successCount, errors };
}
