'use client';

import React from 'react';
import { useAuth } from '@/app/contexts';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui';

export function AuthStatus() {
  const { state, signOut, updateActivity, extendSession, timeUntilExpiry, hasRecentActivity,signInWithGoogle } = useAuth();
  
  if (state.isInitializing) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Initializing...</span>
        </CardContent>
      </Card>
    );
  }
  
  if (!state.isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are not signed in.
          </p>
          <Button 
            onClick={signInWithGoogle}
            disabled={state.isLoading}
            className="w-full"
          >
            {state.isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          {state.error && (
            <p className="text-sm text-destructive">
              Error: {state.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm">
            <strong>User:</strong> {state.user?.displayName || state.user?.email}
          </p>
          <p className="text-sm">
            <strong>Email:</strong> {state.user?.email}
          </p>
          <p className="text-sm">
            <strong>Verified:</strong> {state.user?.emailVerified ? 'Yes' : 'No'}
          </p>
          {timeUntilExpiry && (
            <p className="text-sm">
              <strong>Session expires in:</strong> {timeUntilExpiry} minutes
            </p>
          )}
          <p className="text-sm">
            <strong>Recent activity:</strong> {hasRecentActivity ? 'Yes' : 'No'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={updateActivity}
            variant="outline"
            size="sm"
          >
            Update Activity
          </Button>
          <Button 
            onClick={extendSession}
            variant="outline"
            size="sm"
          >
            Extend Session
          </Button>
        </div>
        
        <Button 
          onClick={signOut}
          disabled={state.isSigningOut}
          variant="destructive"
          className="w-full"
        >
          {state.isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Button>
        
        {state.error && (
          <p className="text-sm text-destructive">
            Error: {state.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}