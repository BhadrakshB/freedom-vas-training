'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth',
  requireEmailVerification = false,
  fallback 
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Don't redirect while initializing
    if (state.isInitializing) return;
    
    // Redirect if not authenticated
    if (!state.isAuthenticated) {
      router.push(redirectTo);
      return;
    }
    
    // Redirect if email verification is required but not verified
    if (requireEmailVerification && !state.user?.emailVerified) {
      router.push('/verify-email');
      return;
    }
  }, [state.isAuthenticated, state.isInitializing, state.user?.emailVerified, requireEmailVerification, router, redirectTo]);
  
  // Show loading while initializing
  if (state.isInitializing) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render children if not authenticated
  if (!state.isAuthenticated) {
    return null;
  }
  
  // Don't render children if email verification is required but not verified
  if (requireEmailVerification && !state.user?.emailVerified) {
    return null;
  }
  
  return <>{children}</>;
}