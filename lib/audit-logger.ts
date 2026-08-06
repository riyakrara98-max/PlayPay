import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

export function safeSerializeValue(val: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (val === null || val === undefined) return val;
  const type = typeof val;
  if (type === 'boolean' || type === 'number' || type === 'string') return val;
  if (type === 'function') return '[Function]';
  if (type === 'symbol') return String(val);
  if (type === 'bigint') return (val as bigint).toString();

  if (type === 'object') {
    const obj = val as Record<string, unknown>;

    if (seen.has(obj)) return '[Circular]';
    if (depth > 8) return '[Max Depth Exceeded]';

    // Detect DOM Nodes, Elements, Window, Document
    if (
      (typeof Node !== 'undefined' && obj instanceof Node) ||
      (typeof Window !== 'undefined' && obj instanceof Window) ||
      (typeof Document !== 'undefined' && obj instanceof Document) ||
      (typeof Event !== 'undefined' && obj instanceof Event) ||
      obj.nodeType !== undefined ||
      obj.window === obj ||
      obj.self === obj ||
      obj.defaultView !== undefined
    ) {
      return '[DOM/Host Object]';
    }

    // Detect React Synthetic Event / Native Event / React Fiber / React Element / Ref
    if (
      obj.$$typeof !== undefined ||
      obj._reactInternals !== undefined ||
      obj._reactName !== undefined ||
      obj._targetInst !== undefined ||
      obj.nativeEvent !== undefined ||
      (obj.stateNode !== undefined && (obj.child !== undefined || obj.return !== undefined))
    ) {
      return '[React Object/Event]';
    }

    // Detect Ref object holding DOM node
    if ('current' in obj && obj.current && typeof obj.current === 'object' && (obj.current as Record<string, unknown>).nodeType !== undefined) {
      return '[React Ref]';
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      const arr = obj.map((item) => safeSerializeValue(item, depth + 1, seen));
      seen.delete(obj);
      return arr;
    }

    if (obj instanceof Date) {
      seen.delete(obj);
      return obj.toISOString();
    }

    const result: Record<string, unknown> = {};
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (
        key.startsWith('_react') ||
        key.startsWith('__react') ||
        key === '_targetInst' ||
        key === 'stateNode' ||
        key === '_model' ||
        key === '_query' ||
        key === 'db' ||
        key === 'firestore'
      ) {
        continue;
      }
      try {
        result[key] = safeSerializeValue(obj[key], depth + 1, seen);
      } catch {
        result[key] = '[Unserializable]';
      }
    }
    seen.delete(obj);
    return result;
  }

  return String(val);
}

function safeStringifyValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  try {
    const clean = safeSerializeValue(val);
    if (clean === undefined) return 'undefined';
    return JSON.stringify(clean);
  } catch {
    return String(val);
  }
}

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

    if (safeStringifyValue(oldVal) !== safeStringifyValue(newVal)) {
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
      createdAt: serverTimestamp(),
      timestamp: serverTimestamp(),
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

