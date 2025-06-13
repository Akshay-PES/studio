
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
  isAdmin: boolean; // Added for admin check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Define your admin email here. For production, use custom claims or a roles system.
const ADMIN_EMAIL = "admin@example.com";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const signIn = async (email: string, pass: string): Promise<FirebaseUser | AuthError> => {
    setLoading(true);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        if (userCredential.user.email === ADMIN_EMAIL) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
            // Optional: Sign out non-admin users immediately or handle as needed
            // await firebaseSignOut(auth); 
            // throw new Error("Access denied. Not an admin user.");
        }
        setLoading(false);
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in:", error);
        setIsAdmin(false);
        setLoading(false);
        return error as AuthError;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setLoading(false);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
