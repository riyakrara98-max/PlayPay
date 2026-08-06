import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  QueryConstraint,
  DocumentData,
  SetOptions,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { logFirestoreError, OperationType } from '@/lib/firebase-errors';

/**
 * Fetches a single document by ID from Firestore with strict typing.
 */
export async function getTypedDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const path = `${collectionName}/${docId}`;

  try {
    const db = getFirebaseDb();
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as unknown as T;
  } catch (error) {
    logFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Sets a single document by ID in Firestore with options.
 */
export async function setTypedDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
  options?: SetOptions
): Promise<void> {
  const path = `${collectionName}/${docId}`;

  try {
    const db = getFirebaseDb();
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, options || {});
  } catch (error) {
    logFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Updates an existing document in Firestore with strict partial data.
 */
export async function updateTypedDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const path = `${collectionName}/${docId}`;

  try {
    const db = getFirebaseDb();
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data as DocumentData);
  } catch (error) {
    logFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a document from Firestore.
 */
export async function deleteTypedDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const path = `${collectionName}/${docId}`;

  try {
    const db = getFirebaseDb();
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    logFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Queries a collection with constraints and returns typed array of documents.
 */
export async function getTypedCollection<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const db = getFirebaseDb();
    const colRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T));
  } catch (error) {
    logFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

