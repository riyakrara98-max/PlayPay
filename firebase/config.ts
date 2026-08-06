import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Extracts Firebase configuration from explicit environment variable property accesses.
 * Explicit accesses (process.env.NEXT_PUBLIC_*) are required for Next.js static bundler inlining.
 * Also supports non-prefixed environment variable fallbacks and JSON config strings.
 */
function getEnvConfig(): FirebaseConfig {
  let jsonConfig: Partial<FirebaseConfig> = {};
  const rawJson =
    process.env.NEXT_PUBLIC_FIREBASE_CONFIG ||
    process.env.FIREBASE_CONFIG ||
    process.env.NEXT_PUBLIC_FIREBASE_WEB_CONFIG;
  if (rawJson) {
    try {
      jsonConfig = JSON.parse(rawJson);
    } catch {
      // ignore parse error
    }
  }

  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      jsonConfig.apiKey ||
      '',
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      process.env.FIREBASE_AUTH_DOMAIN ||
      jsonConfig.authDomain ||
      '',
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      jsonConfig.projectId ||
      '',
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      jsonConfig.storageBucket ||
      '',
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      jsonConfig.messagingSenderId ||
      '',
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      process.env.FIREBASE_APP_ID ||
      jsonConfig.appId ||
      '',
  };
}

/**
 * Validates that all required Firebase environment variables are defined.
 * Throws a descriptive error listing any missing variables.
 */
export function validateFirebaseConfig(): FirebaseConfig {
  const config = getEnvConfig();
  const missing: string[] = [];

  if (!config.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!config.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!config.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!config.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!config.messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!config.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missing.length > 0) {
    throw new Error(
      `[PlayPay Firebase Error] Missing required Firebase environment variables:\n` +
        missing.map((key) => ` - ${key}`).join('\n') +
        `\nPlease configure these variables in your environment or .env file.`
    );
  }

  return config;
}

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firebaseDbInstance: Firestore | null = null;

/**
 * Returns the singleton FirebaseApp instance.
 * Initializes if not already created.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!firebaseAppInstance) {
    if (getApps().length > 0) {
      firebaseAppInstance = getApp();
    } else {
      const config = validateFirebaseConfig();
      firebaseAppInstance = initializeApp(config);
    }
  }
  return firebaseAppInstance;
}

/**
 * Returns the singleton Auth instance.
 */
export function getFirebaseAuth(): Auth {
  if (!firebaseAuthInstance) {
    const app = getFirebaseApp();
    firebaseAuthInstance = getAuth(app);
  }
  return firebaseAuthInstance;
}

export const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
  process.env.FIREBASE_DATABASE_ID ||
  'ai-studio-playpaydesignsys-e3954cab-cc50-4eeb-a127-2a8cdf0fdbf7';

/**
 * Returns the singleton Firestore instance.
 */
export function getFirebaseDb(): Firestore {
  if (!firebaseDbInstance) {
    const app = getFirebaseApp();
    firebaseDbInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
  }
  return firebaseDbInstance;
}

/**
 * Checks if Firebase environment variables are configured.
 */
export function isFirebaseConfigured(): boolean {
  const config = getEnvConfig();
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}
