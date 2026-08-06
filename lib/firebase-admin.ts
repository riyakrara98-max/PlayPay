import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import config from '@/firebase-applet-config.json';

let adminApp: App;

if (getApps().length === 0) {
  try {
    adminApp = initializeApp({
      projectId: config.projectId,
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error', error);
    // fallback
    adminApp = getApp();
  }
} else {
  adminApp = getApp();
}

export const getAdminDb = (): Firestore => {
  try {
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      return getFirestore(adminApp, config.firestoreDatabaseId);
    }
    return getFirestore(adminApp);
  } catch (e) {
    return getFirestore(adminApp);
  }
};
