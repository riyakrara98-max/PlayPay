import { AuthError } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Maps Firebase Auth error codes to user-friendly error messages.
 */
export function mapAuthError(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  const authError = error as Partial<AuthError>;
  const code = authError.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address provided is invalid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account was found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is disabled in your Firebase Console. Please enable Google under Authentication > Sign-in method.';
    case 'auth/unauthorized-domain': {
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'preview domain';
      return `Preview domain (${domain}) is not authorized in Firebase Console. Add it under Authentication > Settings > Authorized domains.`;
    }
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser.';
    case 'auth/requires-recent-login':
      return 'Please re-authenticate and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    default:
      if (error instanceof Error) {
        return error.message;
      }
      return 'An authentication error occurred. Please try again.';
  }
}

/**
 * Structured Firestore error handler per PlayPay system architecture.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  let currentUser = null;
  try {
    currentUser = getFirebaseAuth().currentUser;
  } catch {
    currentUser = null;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || false,
      isAnonymous: currentUser?.isAnonymous || false,
      tenantId: currentUser?.tenantId || null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
  };

  const jsonMessage = JSON.stringify(errInfo);
  console.error('[PlayPay Firestore Error]:', jsonMessage);
  throw new Error(jsonMessage);
}
