'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { mapAuthError, handleFirestoreError, OperationType } from '@/lib/firebase-errors';

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
  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured());
  const [initialized, setInitialized] = useState<boolean>(() => !isFirebaseConfigured());

  // Helper to fetch or initialize user profile document in Firestore
  const syncUserProfile = useCallback(async (firebaseUser: User): Promise<UserDocument | null> => {
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, firebaseUser.uid);
      const snap = await getDoc(userRef);

      const now = new Date().toISOString();

      if (snap.exists()) {
        const data = snap.data() as UserDocument;
        // Update last login timestamp
        const updatedProfile: UserDocument = {
          ...data,
          lastLoginAt: now,
          email: firebaseUser.email || data.email,
          displayName: firebaseUser.displayName || data.displayName,
          photoURL: firebaseUser.photoURL || data.photoURL,
        };

        try {
          await updateDoc(userRef, {
            lastLoginAt: now,
            email: updatedProfile.email,
            displayName: updatedProfile.displayName,
            photoURL: updatedProfile.photoURL,
          });
        } catch {
          // Non-blocking update failure
        }

        return updatedProfile;
      } else {
        // Auto-create missing profile
        const newProfile: UserDocument = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || null,
          photoURL: firebaseUser.photoURL || null,
          role: 'user',
          createdAt: now,
          lastLoginAt: now,
          isActive: true,
          isBanned: false,
        };

        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.GET,
        `${FIRESTORE_COLLECTIONS.USERS}/${firebaseUser.uid}`
      );
      return null;
    }
  }, []);

  // Manual refresh profile trigger
  const refreshProfile = useCallback(async () => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    setLoading(true);
    try {
      const profile = await syncUserProfile(currentUser);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  }, [currentUser, syncUserProfile]);

  // Auth state listener
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
        setInitialized(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('[AuthContext Init Error]', error);
      queueMicrotask(() => {
        setLoading(false);
        setInitialized(true);
      });
    }
  }, [syncUserProfile]);

  // Auth Action Methods
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoading(false);
      throw new Error(mapAuthError(err));
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

      const now = new Date().toISOString();
      const newProfile: UserDocument = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: displayName || cred.user.displayName || null,
        photoURL: cred.user.photoURL || null,
        role: 'user',
        createdAt: now,
        lastLoginAt: now,
        isActive: true,
        isBanned: false,
      };

      const db = getFirebaseDb();
      await setDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, cred.user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (err) {
      setLoading(false);
      throw new Error(mapAuthError(err));
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
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
      if (!isFirebaseConfigured()) {
        const msg = 'Firebase Auth is not configured. Missing required environment variables (NEXT_PUBLIC_FIREBASE_*).';
        console.error('[Google Sign-In Error]:', msg);
        throw new Error(msg);
      }
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      setLoading(false);
      console.error('[Exact Firebase Auth Error during Google Sign-In]:', err);
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
