'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import type { AuthUser } from '@/app/contexts/AuthContext';

interface UseAuthListenerOptions {
  onSignIn?: (user: AuthUser) => void;
  onSignOut?: () => void;
  onUserChange?: (user: AuthUser | null) => void;
  onError?: (error: any) => void;
  storeProfile?: boolean; // Auto-store user profile on sign in
}

export function useAuthListener(options: UseAuthListenerOptions = {}) {
  const { state, storeUserProfile } = useAuth();
  const previousUser = useRef<AuthUser | null>(null);
  const { onSignIn, onSignOut, onUserChange, onError, storeProfile = true } = options;

  useEffect(() => {
    const currentUser = state.user;
    const wasAuthenticated = !!previousUser.current;
    const isNowAuthenticated = !!currentUser;

    // User signed in
    if (!wasAuthenticated && isNowAuthenticated && currentUser) {
      console.log('User signed in:', currentUser.email);
      onSignIn?.(currentUser);
      
      // Auto-store user profile if enabled
      if (storeProfile) {
        storeUserProfile().catch(console.error);
      }
    }
    
    // User signed out
    if (wasAuthenticated && !isNowAuthenticated) {
      console.log('User signed out');
      onSignOut?.();
    }
    
    // Any user change
    if (previousUser.current !== currentUser) {
      onUserChange?.(currentUser);
    }
    
    // Update reference
    previousUser.current = currentUser;
  }, [state.user, onSignIn, onSignOut, onUserChange, storeProfile, storeUserProfile]);

  // Handle errors
  useEffect(() => {
    if (state.error) {
      console.error('Auth error:', state.error);
      onError?.(state.error);
    }
  }, [state.error, onError]);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading || state.isInitializing,
    error: state.error
  };
}