'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/firebase/config';
import { UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { mapAuthError, logFirestoreError, OperationType } from '@/lib/firebase-errors';

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserDocument | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // Helper to fetch or initialize user profile document in Firestore
  const syncUserProfile = useCallback(async (firebaseUser: User): Promise<UserDocument | null> => {
    try {
      if (!firebaseUser || !firebaseUser.uid) {
        return null;
      }

      const auth = getFirebaseAuth();
      // Ensure Firebase client auth currentUser exists and matches uid before making client-side Firestore calls
      if (!auth.currentUser || auth.currentUser.uid !== firebaseUser.uid) {
        return null;
      }

      const db = getFirebaseDb();
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid);
      const snap = await getDoc(userRef);

      const now = new Date().toISOString();

      if (snap.exists()) {
        const data = snap.data() as UserDocument;
        // Construct updated profile
        const updatedProfile: UserDocument = {
          ...data,
          memberType: data.memberType ?? 'direct',
          leaderId: data.leaderId ?? '',
          leaderCode: data.leaderCode ?? '',
          profileCompleted: data.profileCompleted ?? true,
          lastLoginAt: now,
          email: firebaseUser.email || data.email,
          displayName: firebaseUser.displayName || data.displayName,
          photoURL: firebaseUser.photoURL || data.photoURL,
        };

        // Safely update lastLoginAt after current microtask/call-stack to avoid racing auth transitions
        setTimeout(() => {
          const currentAuth = getFirebaseAuth();
          if (currentAuth.currentUser && currentAuth.currentUser.uid === firebaseUser.uid) {
            updateDoc(userRef, {
              lastLoginAt: serverTimestamp(),
              email: updatedProfile.email,
              displayName: updatedProfile.displayName,
              photoURL: updatedProfile.photoURL,
            }).catch(() => {});
          }
        }, 1000);

        return updatedProfile;
      } else {
        // Auto-create missing profile
        const newProfile: Record<string, unknown> = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || null,
          photoURL: firebaseUser.photoURL || null,
          role: 'user',
          memberType: 'pending',
          leaderId: '',
          leaderCode: '',
          profileCompleted: false,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isActive: true,
          isBanned: false,
        };

        await setDoc(userRef, newProfile);
        return newProfile as unknown as UserDocument;
      }
    } catch (error) {
      logFirestoreError(
        error,
        OperationType.GET,
        `${FIRESTORE_COLLECTIONS.USERS}/${firebaseUser?.uid || 'unknown'}`
      );
      if (!firebaseUser?.uid) return null;
      // Construct fallback profile when offline or network error occurs
      const now = new Date().toISOString();
      const fallbackProfile: UserDocument = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || null,
        photoURL: firebaseUser.photoURL || null,
        role: 'user',
        memberType: 'direct',
        leaderId: '',
        leaderCode: '',
        profileCompleted: true,
        createdAt: now,
        lastLoginAt: now,
        isActive: true,
        isBanned: false,
      };
      return fallbackProfile;
    }
  }, []);

  // Manual refresh profile trigger with deduplication
  const refreshProfile = useCallback(async (): Promise<void> => {
    const auth = getFirebaseAuth();
    const activeAuthUser = auth.currentUser || currentUser;

    if (!activeAuthUser || !auth.currentUser) {
      if (!activeAuthUser) {
        setUserProfile(null);
      }
      return;
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      setLoading(true);
      try {
        const profile = await syncUserProfile(activeAuthUser);
        if (profile) {
          setUserProfile(profile);
        }
      } catch (err) {
        console.warn('[refreshProfile] Error during profile refresh:', err);
      } finally {
        setLoading(false);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [currentUser, syncUserProfile]);

  // Helper to sync session cookie with server
  const syncServerSession = useCallback(async (user: User | null, profile: UserDocument | null) => {
    if (!user) {
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
      return;
    }
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: profile?.role || 'user',
        memberType: profile?.memberType || 'pending',
      }),
    }).catch(() => {});
  }, []);

  // Auth state listener
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const fallbackTimer = setTimeout(() => {
        setLoading(false);
        setInitialized(true);
      }, 1000);
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(fallbackTimer);
        setCurrentUser(user);
        if (user) {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
          await syncServerSession(user, profile);
        } else {
          setUserProfile(null);
          await syncServerSession(null, null);
        }
        setLoading(false);
        setInitialized(true);
      });

      return () => {
        clearTimeout(fallbackTimer);
        unsubscribe();
      };
    } catch (error) {
      console.error('[AuthContext Init Error]', error);
      queueMicrotask(() => {
        setLoading(false);
        setInitialized(true);
      });
    }
  }, [syncUserProfile, syncServerSession]);

  // Auth Action Methods
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(cred.user);
      const profile = await syncUserProfile(cred.user);
      setUserProfile(profile);
      await syncServerSession(cred.user, profile);
      setLoading(false);
      setInitialized(true);
    } catch (err) {
      setLoading(false);
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName && cred.user) {
        await firebaseUpdateProfile(cred.user, { displayName });
      }

      const newProfile: Record<string, unknown> = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: displayName || cred.user.displayName || null,
        photoURL: cred.user.photoURL || null,
        role: 'user',
        memberType: 'pending',
        leaderId: '',
        leaderCode: '',
        profileCompleted: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        isBanned: false,
      };

      const db = getFirebaseDb();
      await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, cred.user.uid), newProfile);
      const typedProfile = newProfile as unknown as UserDocument;
      setCurrentUser(cred.user);
      setUserProfile(typedProfile);
      await syncServerSession(cred.user, typedProfile);
      setLoading(false);
      setInitialized(true);
    } catch (err) {
      setLoading(false);
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      throw new Error(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('No authenticated user found.');
    }
    try {
      await firebaseUpdatePassword(currentUser, newPassword);
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        setCurrentUser(cred.user);
        const profile = await syncUserProfile(cred.user);
        setUserProfile(profile);
        await syncServerSession(cred.user, profile);
        setLoading(false);
        setInitialized(true);
      }
    } catch (err: unknown) {
      setLoading(false);
      console.error('[Firebase Auth Error during Google Sign-In]:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        initialized,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        refreshProfile,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

