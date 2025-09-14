"use client";

import React from "react";
import { useAuth } from "@/app/contexts";
import { Button } from "./ui/button";

export function AuthStatus() {
  const { state, signOut, signInWithGoogle } = useAuth();

  if (state.isInitializing) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm">Initializing...</span>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            You are not signed in.
          </p>
          <Button
            onClick={signInWithGoogle}
            disabled={state.isLoading}
            size="sm"
            className="w-full"
          >
            {state.isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </div>
        {state.error && (
          <p className="text-xs text-destructive text-center">
            Error: {state.error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* List tile format with name as title and email as subtitle */}
      <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground text-xs font-medium">
            {(state.user?.displayName || state.user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {state.user?.displayName || "User"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {state.user?.email}
          </p>
        </div>
      </div>

      {/* Sign out button */}
      <Button
        onClick={signOut}
        disabled={state.isSigningOut}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {state.isSigningOut ? "Signing out..." : "Sign Out"}
      </Button>

      {state.error && (
        <p className="text-xs text-destructive text-center">
          Error: {state.error.message}
        </p>
      )}
    </div>
  );
}
