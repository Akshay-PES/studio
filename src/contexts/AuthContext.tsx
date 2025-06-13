
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | AuthError>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ADMIN_EMAIL = "mbaoffice.rr@pes.edu";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("AuthContext: onAuthStateChanged EFFECT RUNNING/SUBSCRIBING");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthContext: onAuthStateChanged CALLBACK FIRED. User email:", user?.email);
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) {
        console.log("AuthContext: User is ADMIN. Setting isAdmin to true.");
        setIsAdmin(true);
      } else {
        console.log("AuthContext: User is NOT ADMIN or no user. Setting isAdmin to false.");
        setIsAdmin(false);
      }
      setLoading(false);
      console.log("AuthContext: setLoading(false). isAdmin state is now:", (user && user.email === ADMIN_EMAIL));
    });

    return () => {
      console.log("AuthContext: onAuthStateChanged unsubscribing");
      unsubscribe();
    };
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount.

  const signIn = async (email: string, pass: string): Promise<FirebaseUser | AuthError> => {
    setLoading(true); // Indicate that a sign-in process has started
    console.log("AuthContext: signIn initiated for", email);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will now handle setting currentUser, isAdmin, and setLoading(false)
        // This ensures all state related to auth is updated consistently.
        console.log("AuthContext: Firebase signInWithEmailAndPassword successful for", userCredential.user.email);
        // setLoading(false) will be called by onAuthStateChanged
        return userCredential.user;
    } catch (error) {
        console.error("AuthContext: Error in signInWithEmailAndPassword:", error);
        setIsAdmin(false); // Ensure isAdmin is false on error
        setLoading(false); // Critical to set loading false on error to unlock UI
        return error as AuthError;
    }
  };

  const signOut = async () => {
    setLoading(true);
    console.log("AuthContext: signOut initiated");
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will fire with user as null.
      // It will set currentUser to null, isAdmin to false, and setLoading(false).
      console.log("AuthContext: Firebase signOut successful");
      router.push('/login');
    } catch (error) {
      console.error("AuthContext: Error signing out: ", error);
      setLoading(false); // Ensure loading is false if signOut fails for some reason
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children immediately. Loading state will gate content in layouts/pages. */}
      {children}
    </AuthContext.Provider>
  );
};
