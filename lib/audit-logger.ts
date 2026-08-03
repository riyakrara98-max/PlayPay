import { collection, addDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
  AuditActivityType,
  AdminActivityDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';

export type LogAuditParams = Omit<AdminActivityDocument, 'id' | 'createdAt'> & {
  createdAt?: string;
  timestamp?: string;
};

/**
 * Computes changed fields between before and after objects.
 * Mandated by Rule 9: Store only changed fields, NOT entire document snapshots.
 */
function computeChangedFields(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
): Record<string, { old: unknown; new: unknown }> | null {
  if (!before && !after) return null;
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  allKeys.forEach((key) => {
    const oldVal = before?.[key];
    const newVal = after?.[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  });

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
  * Logs an admin activity event into the `adminActivity` collection in Firestore.
  */
export async function logAdminActivity(params: LogAuditParams): Promise<string | null> {
  try {
    const db = getFirebaseDb();
    const colRef = collection(db, FIRESTORE_COLLECTIONS.ADMIN_ACTIVITY);

    const userAgent =
      params.userAgent ||
      (typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown');

    const isoNow = params.createdAt || params.timestamp || new Date().toISOString();
    const changedFields =
      params.changedFields || computeChangedFields(params.before, params.after);

    const activityData = {
      action: params.action,
      performedBy: params.performedBy,
      performedByName: params.performedByName || 'Admin',
      performedByEmail: params.performedByEmail || '',
      targetType: params.targetType,
      targetId: params.targetId,
      targetName: params.targetName || '',
      details: params.details || '',
      changedFields: changedFields || null,
      createdAt: isoNow,
      timestamp: isoNow,
      userAgent,
    };

    const docRef = await addDoc(colRef, activityData);
    return docRef.id;
  } catch (error) {
    console.error('[logAdminActivity error]', error);
    // Non-blocking: audit log errors should not crash the primary action
    return null;
  }
}

