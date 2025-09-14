"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAuthState,
  useSignInWithEmailAndPassword,
  useCreateUserWithEmailAndPassword,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";
import { auth } from "@/app/adapters/firebase/firebase.client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface AuthFormData {
  email: string;
  password: string;
}

function AuthPageContent() {
  // Firebase authentication hooks
  const [user, loading, error] = useAuthState(auth);
  const [signInWithEmailAndPassword, , signInLoading, signInError] =
    useSignInWithEmailAndPassword(auth);
  const [createUserWithEmailAndPassword, , createLoading, createError] =
    useCreateUserWithEmailAndPassword(auth);
  const [signInWithGoogle, , googleLoading, googleError] =
    useSignInWithGoogle(auth);

  // Form state management
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
  });
  const [isSignup, setIsSignup] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper function to handle post-authentication redirect
  const handlePostAuthRedirect = useCallback(() => {
    if (!user || isRedirecting) return;
    
    setIsRedirecting(true);
    setRedirectError(null);
    
    // Get redirect URL from search params or default to dashboard
    const redirectTo = searchParams.get('redirect') || '/';
    
    // Validate redirect URL to prevent open redirect vulnerabilities
    const isValidRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//');
    const finalRedirectUrl = isValidRedirect ? redirectTo : '/';
    
    // Small delay to ensure smooth transition and allow loading state to show
    const redirectTimer = setTimeout(() => {
      try {
        router.push(finalRedirectUrl);
      } catch (error) {
        console.error('Redirect failed:', error);
        setRedirectError('Redirect failed. Please click here to continue.');
        
        // Fallback redirect after a longer delay
        const fallbackTimer = setTimeout(() => {
          try {
            router.push('/');
          } catch (fallbackError) {
            console.error('Fallback redirect also failed:', fallbackError);
            setRedirectError('Navigation error. Please refresh the page.');
          }
        }, 2000);
        
        return () => clearTimeout(fallbackTimer);
      }
    }, 150);

    return () => clearTimeout(redirectTimer);
  }, [user, isRedirecting, searchParams, router]);

  // Authentication status checking and redirect logic
  useEffect(() => {
    if (user && !isRedirecting) {
      return handlePostAuthRedirect();
    }
  }, [user, isRedirecting, handlePostAuthRedirect]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Mark that user has interacted with the form
    // This helps with error display timing
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Mark that user has interacted with the form
    setHasUserInteracted(true);

    // Basic client-side validation
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      let result;
      if (isSignup) {
        result = await createUserWithEmailAndPassword(formData.email, formData.password);
      } else {
        result = await signInWithEmailAndPassword(formData.email, formData.password);
      }

      // If authentication was successful, the user state will update
      // and the useEffect will handle the redirect
      if (result?.user) {
        // Clear form data on successful authentication
        setFormData({ email: "", password: "" });
        setHasUserInteracted(false);
      }
    } catch (error) {
      // Error is already handled by the Firebase hooks
      // Just ensure user interaction is marked for error display
      console.error("Authentication error:", error);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      
      // If Google authentication was successful, the user state will update
      // and the useEffect will handle the redirect
      if (result?.user) {
        // Clear any form interaction state on successful authentication
        setHasUserInteracted(false);
      }
    } catch (error) {
      // Error is already handled by the Firebase hooks
      console.error("Google sign-in error:", error);
    }
  };

  // Handle mode toggle
  const toggleMode = () => {
    setIsSignup(!isSignup);
    // Clear form data and interaction state when switching modes
    setFormData({ email: "", password: "" });
    setHasUserInteracted(false);
  };

  // Get user-friendly error message with comprehensive Firebase error handling
  const getErrorMessage = (error: unknown) => {
    if (!error) return null;

    const errorCode = (error as { code?: string })?.code;
    const errorMessage = (error as { message?: string })?.message;

    switch (errorCode) {
      // Email validation errors
      case "auth/invalid-email":
        return "Please enter a valid email address";
      case "auth/missing-email":
        return "Email address is required";
      
      // Password validation errors
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/missing-password":
        return "Password is required";
      
      // Account existence errors
      case "auth/email-already-in-use":
        return "An account with this email already exists";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email. Please sign in using your original method";
      
      // Authentication errors
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
      case "auth/user-disabled":
        return "Invalid email or password";
      case "auth/invalid-login-credentials":
        return "Invalid email or password";
      
      // Rate limiting and security
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please contact support";
      
      // Network and connectivity errors
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again";
      case "auth/timeout":
        return "Request timed out. Please try again";
      
      // Google OAuth specific errors
      case "auth/popup-blocked":
        return "Please allow popups and try again";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled";
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for Google sign-in";
      
      // Token and session errors
      case "auth/expired-action-code":
        return "This link has expired. Please request a new one";
      case "auth/invalid-action-code":
        return "Invalid or expired link. Please request a new one";
      case "auth/user-token-expired":
        return "Your session has expired. Please sign in again";
      
      // Configuration errors (should not expose technical details)
      case "auth/api-key-not-valid":
      case "auth/invalid-api-key":
      case "auth/app-not-authorized":
        return "Authentication service is temporarily unavailable. Please try again later";
      
      // Quota and limits
      case "auth/quota-exceeded":
        return "Service temporarily unavailable. Please try again later";
      
      // Generic fallback
      default:
        // Log the actual error for debugging but don't expose it to users
        console.error("Authentication error:", errorCode, errorMessage);
        return "An unexpected error occurred. Please try again";
    }
  };

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Checking authentication status...
          </p>
        </div>
      </div>
    );
  }

  // Show redirecting state when user is authenticated and redirect is in progress
  if (user && isRedirecting) {
    const redirectTo = searchParams.get('redirect');
    const redirectMessage = redirectTo && redirectTo !== '/' 
      ? 'Redirecting...' 
      : 'Redirecting to dashboard...';
      
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          {!redirectError ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm sm:text-base text-muted-foreground animate-pulse">
                {redirectMessage}
              </p>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground/70">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span>Authentication successful</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-destructive break-words">
                {redirectError}
              </p>
              <Button
                onClick={() => {
                  setRedirectError(null);
                  setIsRedirecting(false);
                  router.push('/');
                }}
                variant="outline"
                size="sm"
                className="theme-transition"
              >
                Continue to Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Don't render the form if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  // Determine if any authentication process is loading
  const isLoading = signInLoading || createLoading || googleLoading;

  // Get current error to display
  const currentError = signInError || createError || googleError || error;
  
  // Determine if we should show the error
  // Show errors immediately for authentication failures, or after user interaction for validation errors
  const shouldShowError = currentError && (
    hasUserInteracted || 
    googleError || 
    signInError || 
    createError ||
    error // Show auth state errors immediately
  );
  
  // Get error type for styling purposes
  const getErrorType = (error: unknown) => {
    if (!error) return null;
    
    const errorCode = (error as { code?: string })?.code;
    
    // Network and service errors are more severe
    if (errorCode?.includes('network') || errorCode?.includes('quota') || errorCode?.includes('api-key')) {
      return 'service';
    }
    
    // Authentication failures are user errors
    if (errorCode?.includes('invalid') || errorCode?.includes('wrong') || errorCode?.includes('not-found')) {
      return 'auth';
    }
    
    // Default to user error
    return 'user';
  };

  // Get loading text based on current operation
  const getLoadingText = () => {
    if (signInLoading) return "Signing in...";
    if (createLoading) return "Creating account...";
    if (googleLoading) return "Signing in with Google...";
    return "Processing...";
  };

  // Get button text based on mode and loading state
  const getButtonText = () => {
    if (isLoading) return getLoadingText();
    return isSignup ? "Create Account" : "Sign In";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
      <div className="w-full max-w-md relative">
        {/* Loading overlay for authentication processes */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground font-medium">
                {getLoadingText()}
              </p>
            </div>
          </div>
        )}

        <Card className="theme-transition">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Welcome to AI Training Simulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {/* Mode toggle */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 theme-transition"
                >
                  {isSignup
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </Button>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground theme-transition"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    aria-invalid={shouldShowError ? "true" : "false"}
                    className={cn(
                      "theme-transition",
                      shouldShowError && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground theme-transition"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    disabled={isLoading}
                    aria-invalid={shouldShowError ? "true" : "false"}
                    className={cn(
                      "theme-transition",
                      shouldShowError && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </div>

                {/* Error display */}
                {shouldShowError && (
                  <div 
                    className="p-3 sm:p-4 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center animate-in fade-in-0 slide-in-from-top-1 duration-200 theme-transition"
                    role="alert"
                    aria-live="polite"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-center">
                        <svg 
                          className="h-4 w-4 flex-shrink-0" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        <span className="break-words">{getErrorMessage(currentError)}</span>
                      </div>
                      
                      {/* Show retry button for network and service errors */}
                      {getErrorType(currentError) === 'service' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Clear the error state and allow retry
                            setHasUserInteracted(false);
                            // Trigger form resubmission if form data is valid
                            if (formData.email && formData.password) {
                              handleSubmit();
                            }
                          }}
                          disabled={isLoading}
                          className="text-xs h-7 px-3 border-destructive/30 text-destructive hover:bg-destructive/5 theme-transition"
                        >
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full theme-transition"
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {signInLoading || createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      {getLoadingText()}
                    </>
                  ) : (
                    getButtonText()
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border theme-transition" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground theme-transition">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-in Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full theme-transition"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {googleLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Signing in with Google...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading component for Suspense
function AuthPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
      <div className="w-full max-w-md">
        <Card className="theme-transition">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Welcome to AI Training Simulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Default export with Suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
}
