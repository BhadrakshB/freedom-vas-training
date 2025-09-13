'use client';

import { useCallback } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '@/app/adapters/firebase/firebase.client';
import { useAuth } from './AuthContext';

// Custom hook for authentication operations
export function useAuthOperations() {
  const { state, clearError } = useAuth();
  
  // Sign in with email and password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    clearError();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Create account with email and password
  const createAccount = useCallback(async (email: string, password: string, displayName?: string) => {
    clearError();
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    clearError();
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error: any) {
      // Handle specific Google auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Send password reset email
  const resetPassword = useCallback(async (email: string) => {
    clearError();
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Send email verification
  const sendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) {
      return { success: false, error: 'No user signed in' };
    }
    
    clearError();
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Update user profile
  const updateUserProfile = useCallback(async (updates: { displayName?: string; photoURL?: string }) => {
    if (!auth.currentUser) {
      return { success: false, error: 'No user signed in' };
    }
    
    clearError();
    try {
      await updateProfile(auth.currentUser, updates);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Update user email
  const updateUserEmail = useCallback(async (newEmail: string) => {
    if (!auth.currentUser) {
      return { success: false, error: 'No user signed in' };
    }
    
    clearError();
    try {
      await updateEmail(auth.currentUser, newEmail);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Update user password
  const updateUserPassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) {
      return { success: false, error: 'No user signed in' };
    }
    
    clearError();
    try {
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Reauthenticate user (required for sensitive operations)
  const reauthenticate = useCallback(async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      return { success: false, error: 'No user signed in or email not available' };
    }
    
    clearError();
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, [clearError]);
  
  // Check if email is available
  const checkEmailAvailability = useCallback(async (email: string) => {
    try {
      // This is a workaround since Firebase doesn't have a direct method
      // We try to create a user and catch the specific error
      await createUserWithEmailAndPassword(auth, email, 'temp-password-check');
      return { available: true };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { available: false };
      }
      // For other errors, we can't determine availability
      return { available: null, error: error.code || error.message };
    }
  }, []);
  
  // Get user's sign-in methods
  const getUserSignInMethods = useCallback(async (email: string) => {
    try {
      const { fetchSignInMethodsForEmail } = await import('firebase/auth');
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return { success: true, methods };
    } catch (error: any) {
      return { success: false, error: error.code || error.message };
    }
  }, []);
  
  return {
    // Auth operations
    signInWithEmail,
    createAccount,
    signInWithGoogle,
    resetPassword,
    sendVerificationEmail,
    
    // Profile operations
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    reauthenticate,
    
    // Utility operations
    checkEmailAvailability,
    getUserSignInMethods,
    
    // State
    isLoading: state.isLoading || state.isSigningIn || state.isCreatingAccount,
    error: state.error,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  };
}