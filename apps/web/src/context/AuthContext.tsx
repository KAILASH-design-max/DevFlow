"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  ConfirmationResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { authApi } from "../lib/api";

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  role: string;
  workspaceUrl?: string | null;
  provider: string;
  createdAt?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string, role?: string, workspaceUrl?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  resetRecaptcha: (containerId?: string) => void;
  sendPhoneVerificationCode: (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ) => Promise<ConfirmationResult>;
  confirmPhoneCode: (
    confirmationResult: ConfirmationResult,
    verificationCode: string,
    displayName?: string
  ) => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sync user profile via Express API (Prisma DB — single source of truth).
   * Replaces the previous direct Firestore users collection sync.
   */
  const syncUserProfile = async (fbUser: FirebaseUser, extraData: Partial<UserProfile> = {}) => {
    try {
      const token = await fbUser.getIdToken();
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
      }

      // Sync user to Prisma DB via the Express API
      const syncRes = await authApi.firebaseSync({
        name: extraData.name || fbUser.displayName || undefined,
        avatar: fbUser.photoURL || undefined,
        role: extraData.role || undefined,
      });

      const apiUser = syncRes?.data || syncRes;
      const profileData: UserProfile = {
        id: apiUser?.id || fbUser.uid,
        uid: fbUser.uid,
        name: apiUser?.name || fbUser.displayName || extraData.name || "DevFlow User",
        email: apiUser?.email || fbUser.email || null,
        phoneNumber: fbUser.phoneNumber || null,
        avatar: apiUser?.avatar || fbUser.photoURL || null,
        role: apiUser?.role || extraData.role || "DEVELOPER",
        workspaceUrl: extraData.workspaceUrl || null,
        provider: fbUser.providerData[0]?.providerId || "password",
      };

      setUser(profileData);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(profileData));
      }
    } catch (err) {
      console.warn("API user sync warning:", err);
      // Fallback profile from Firebase data alone
      const fallbackProfile: UserProfile = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || extraData.name || "DevFlow User",
        email: fbUser.email || null,
        phoneNumber: fbUser.phoneNumber || null,
        avatar: fbUser.photoURL || null,
        role: "DEVELOPER",
        provider: fbUser.providerData[0]?.providerId || "password",
      };
      setUser(fallbackProfile);
      if (typeof window !== "undefined") {
        const token = await fbUser.getIdToken().catch(() => "");
        if (token) localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(fallbackProfile));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncUserProfile(fbUser);
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(cred.user);
      return;
    } catch (fbErr: any) {
      console.warn("Firebase email sign-in notice:", fbErr?.code || fbErr?.message);

      // If user not yet created in Firebase project, auto-create
      if (
        fbErr?.code === "auth/user-not-found" ||
        fbErr?.code === "auth/invalid-credential"
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, password);
          if (newCred.user) {
            const name = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
            await updateProfile(newCred.user, { displayName: name });
            await syncUserProfile(newCred.user, { name });
            return;
          }
        } catch {
          // Continue to fallback
        }
      }

      // Backend API fallback (non-Firebase JWT auth)
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        const { user: apiUser, accessToken } = res.data;
        const profile: UserProfile = {
          id: apiUser.id,
          uid: apiUser.id,
          name: apiUser.name || "DevFlow User",
          email: apiUser.email,
          phoneNumber: null,
          avatar: apiUser.avatar || null,
          role: apiUser.role || "ADMIN",
          provider: "password",
        };
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(profile));
        }
        return;
      }

      throw fbErr;
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string,
    role: string = "DEVELOPER",
    workspaceUrl?: string
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        await syncUserProfile(cred.user, { name, role, workspaceUrl });
      }
    } catch (fbErr: any) {
      console.warn("Firebase sign-up notice:", fbErr?.code || fbErr?.message);

      if (fbErr?.code === "auth/email-already-in-use") {
        try {
          const loginCred = await signInWithEmailAndPassword(auth, email, password);
          await syncUserProfile(loginCred.user, { name, role, workspaceUrl });
          return;
        } catch {
          // Continue to API fallback
        }
      }

      // Backend API fallback
      const res = await authApi.register(name, email, password);
      if (res.success && res.data) {
        const { user: apiUser, accessToken } = res.data;
        const profile: UserProfile = {
          id: apiUser.id,
          uid: apiUser.id,
          name: apiUser.name || name,
          email: apiUser.email,
          phoneNumber: null,
          avatar: null,
          role,
          provider: "password",
        };
        setUser(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(profile));
        }
        return;
      }

      throw fbErr;
    }
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(cred.user);
  };

  const setupRecaptcha = (containerId: string) => {
    return new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {},
    });
  };

  const resetRecaptcha = (containerId?: string) => {
    if (containerId && typeof window !== "undefined") {
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = "";
    }
  };

  const sendPhoneVerificationCode = async (
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ) => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const confirmPhoneCode = async (
    confirmationResult: ConfirmationResult,
    verificationCode: string,
    displayName?: string
  ) => {
    const cred = await confirmationResult.confirm(verificationCode);
    if (cred.user) {
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      await syncUserProfile(cred.user, { name: displayName });
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  };

  const getIdToken = async () => {
    if (firebaseUser) {
      return firebaseUser.getIdToken();
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        setupRecaptcha,
        resetRecaptcha,
        sendPhoneVerificationCode,
        confirmPhoneCode,
        signOutUser,
        getIdToken,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
