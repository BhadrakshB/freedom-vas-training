"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/adapters/firebase/firebase.client";

// Auth-specific types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
}

export interface AuthError {
  code: string;
  message: string;
  type: "auth" | "network" | "validation" | "service";
}

export interface AuthState {
  // User state
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  isSigningIn: boolean;
  isSigningOut: boolean;
  isCreatingAccount: boolean;

  // Error state
  error: AuthError | null;

  // Session state
  sessionExpiry: Date | null;
  lastActivity: Date | null;

  // Auth method tracking
  lastSignInMethod: string | null;

  // Preferences
  rememberMe: boolean;
  autoSignOut: boolean;
  sessionTimeout: number; // in minutes
}

// Action types
type AuthAction =
  | { type: "SET_USER"; payload: AuthUser | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_INITIALIZING"; payload: boolean }
  | { type: "SET_SIGNING_IN"; payload: boolean }
  | { type: "SET_SIGNING_OUT"; payload: boolean }
  | { type: "SET_CREATING_ACCOUNT"; payload: boolean }
  | { type: "SET_ERROR"; payload: AuthError | null }
  | { type: "SET_SESSION_EXPIRY"; payload: Date | null }
  | { type: "UPDATE_LAST_ACTIVITY" }
  | { type: "SET_LAST_SIGN_IN_METHOD"; payload: string | null }
  | { type: "SET_REMEMBER_ME"; payload: boolean }
  | { type: "SET_AUTO_SIGN_OUT"; payload: boolean }
  | { type: "SET_SESSION_TIMEOUT"; payload: number }
  | { type: "CLEAR_AUTH_STATE" };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  isSigningIn: false,
  isSigningOut: false,
  isCreatingAccount: false,
  error: null,
  sessionExpiry: null,
  lastActivity: null,
  lastSignInMethod: null,
  rememberMe: true,
  autoSignOut: false,
  sessionTimeout: 60, // 60 minutes default
};

// Reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isInitializing: false,
        error: null, // Clear errors on successful auth
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_INITIALIZING":
      return { ...state, isInitializing: action.payload };

    case "SET_SIGNING_IN":
      return { ...state, isSigningIn: action.payload };

    case "SET_SIGNING_OUT":
      return { ...state, isSigningOut: action.payload };

    case "SET_CREATING_ACCOUNT":
      return { ...state, isCreatingAccount: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_SESSION_EXPIRY":
      return { ...state, sessionExpiry: action.payload };

    case "UPDATE_LAST_ACTIVITY":
      return { ...state, lastActivity: new Date() };

    case "SET_LAST_SIGN_IN_METHOD":
      return { ...state, lastSignInMethod: action.payload };

    case "SET_REMEMBER_ME":
      return { ...state, rememberMe: action.payload };

    case "SET_AUTO_SIGN_OUT":
      return { ...state, autoSignOut: action.payload };

    case "SET_SESSION_TIMEOUT":
      return { ...state, sessionTimeout: action.payload };

    case "CLEAR_AUTH_STATE":
      return {
        ...initialState,
        isInitializing: false,
        rememberMe: state.rememberMe,
        autoSignOut: state.autoSignOut,
        sessionTimeout: state.sessionTimeout,
      };

    default:
      return state;
  }
}

// Helper function to convert Firebase User to AuthUser
function convertFirebaseUser(firebaseUser: User | null): AuthUser | null {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    isAnonymous: firebaseUser.isAnonymous,
    metadata: {
      creationTime: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime,
    },
    providerData: firebaseUser.providerData.map((provider) => ({
      providerId: provider.providerId,
      uid: provider.uid,
      displayName: provider.displayName,
      email: provider.email,
      photoURL: provider.photoURL,
    })),
  };
}

// Helper function to categorize Firebase auth errors
function categorizeAuthError(error: any): AuthError {
  const code = error?.code || "unknown";
  const message = error?.message || "An unknown error occurred";

  let type: AuthError["type"] = "auth";

  if (code.includes("network") || code.includes("timeout")) {
    type = "network";
  } else if (
    code.includes("invalid") ||
    code.includes("weak") ||
    code.includes("missing")
  ) {
    type = "validation";
  } else if (
    code.includes("quota") ||
    code.includes("api-key") ||
    code.includes("app-not-authorized")
  ) {
    type = "service";
  }

  return { code, message, type };
}

// Sign-in credentials interfaces
export interface EmailSignInCredentials {
  email: string;
  password: string;
}

export interface EmailSignUpCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  photoURL?: string;
}

// Context interface
interface AuthContextType {
  state: AuthState;

  // Sign-in methods
  signInWithEmail: (credentials: EmailSignInCredentials) => Promise<void>;
  signUpWithEmail: (credentials: EmailSignUpCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;

  // Password management
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  updateUserPassword: (request: PasswordUpdateRequest) => Promise<void>;

  // Profile management
  updateUserProfile: (request: ProfileUpdateRequest) => Promise<void>;

  // User actions
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  storeUserProfile: (user : AuthUser) => Promise<void>;

  // Session management
  updateActivity: () => void;
  extendSession: () => void;
  checkSessionExpiry: () => boolean;

  // Settings
  setRememberMe: (remember: boolean) => void;
  setAutoSignOut: (autoSignOut: boolean) => void;
  setSessionTimeout: (minutes: number) => void;

  // Error handling
  clearError: () => void;

  // Computed properties
  isSessionExpired: boolean;
  timeUntilExpiry: number | null; // in minutes
  hasRecentActivity: boolean;
  signInMethods: string[];
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Use Firebase auth state hook
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);

  // Sync Firebase user with local state
  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: firebaseLoading });

    if (firebaseError) {
      dispatch({
        type: "SET_ERROR",
        payload: categorizeAuthError(firebaseError),
      });
    } else {
      dispatch({ type: "SET_ERROR", payload: null });
    }

    const authUser = convertFirebaseUser(firebaseUser || null);
    dispatch({ type: "SET_USER", payload: authUser });

    // Set session expiry when user signs in
    if (authUser && !state.sessionExpiry) {
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + state.sessionTimeout);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: expiry });
      dispatch({ type: "UPDATE_LAST_ACTIVITY" });
    }
  }, [
    firebaseUser,
    firebaseLoading,
    firebaseError,
    state.sessionTimeout,
    state.sessionExpiry,
  ]);

  // Sign-in methods
  const signInWithEmail = useCallback(
    async (credentials: EmailSignInCredentials) => {
      dispatch({ type: "SET_SIGNING_IN", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
        dispatch({ type: "SET_LAST_SIGN_IN_METHOD", payload: "email" });

        // Store user profile in database
        setTimeout(() => {
          const input = convertFirebaseUser(userCredential.user);
          if (input == null) return;
          storeUserProfile(input);
        }, 100);
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
        throw error;
      } finally {
        dispatch({ type: "SET_SIGNING_IN", payload: false });
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (credentials: EmailSignUpCredentials) => {
      dispatch({ type: "SET_CREATING_ACCOUNT", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );

        // Update profile with display name if provided
        if (credentials.displayName && userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: credentials.displayName,
          });
        }

        dispatch({ type: "SET_LAST_SIGN_IN_METHOD", payload: "email" });

        // Store user profile in database
        setTimeout(() => {
          const input = convertFirebaseUser(userCredential.user);
          if (input == null) return;
          storeUserProfile(input);
        }, 100);
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
        throw error;
      } finally {
        dispatch({ type: "SET_CREATING_ACCOUNT", payload: false });
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: "SET_SIGNING_IN", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");

      const userCredential = await signInWithPopup(auth, provider);
      dispatch({ type: "SET_LAST_SIGN_IN_METHOD", payload: "google.com" });

      // Store user profile in database
      setTimeout(() => {
        const input = convertFirebaseUser(userCredential.user);
          if (input == null) return;
          storeUserProfile(input);
      }, 100);
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
      throw error;
    } finally {
      dispatch({ type: "SET_SIGNING_IN", payload: false });
    }
  }, []);

  const signInAsGuest = useCallback(async () => {
    dispatch({ type: "SET_SIGNING_IN", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const userCredential = await signInAnonymously(auth);
      dispatch({ type: "SET_LAST_SIGN_IN_METHOD", payload: "anonymous" });

      // Store user profile in database
      setTimeout(() => {
        const input = convertFirebaseUser(userCredential.user);
          if (input == null) return;
          storeUserProfile(input);
      }, 100);
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
      throw error;
    } finally {
      dispatch({ type: "SET_SIGNING_IN", payload: false });
    }
  }, []);

  // Password management
  const resetPassword = useCallback(async (request: PasswordResetRequest) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      await sendPasswordResetEmail(auth, request.email);
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const updateUserPassword = useCallback(
    async (request: PasswordUpdateRequest) => {
      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        // Re-authenticate user before password update
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          request.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        // Update password
        await updatePassword(auth.currentUser, request.newPassword);
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  // Profile management
  const updateUserProfile = useCallback(
    async (request: ProfileUpdateRequest) => {
      if (!auth.currentUser) {
        throw new Error("No authenticated user");
      }

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        await updateProfile(auth.currentUser, {
          displayName: request.displayName,
          photoURL: request.photoURL,
        });

        // Refresh user data
        await refreshUser();
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    []
  );

  // Action creators
  const signOut = useCallback(async () => {
    dispatch({ type: "SET_SIGNING_OUT", payload: true });
    try {
      await auth.signOut();
      dispatch({ type: "CLEAR_AUTH_STATE" });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
    } finally {
      dispatch({ type: "SET_SIGNING_OUT", payload: false });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const refreshedUser = convertFirebaseUser(auth.currentUser);
        dispatch({ type: "SET_USER", payload: refreshedUser });
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
      }
    }
  }, []);

  const updateActivity = useCallback(() => {
    dispatch({ type: "UPDATE_LAST_ACTIVITY" });

    // Extend session if auto-extend is enabled
    if (state.user && state.sessionExpiry) {
      const now = new Date();
      const expiry = new Date(state.sessionExpiry);
      const timeLeft = expiry.getTime() - now.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      // Extend session if less than 15 minutes remaining
      if (timeLeft < fifteenMinutes) {
        const newExpiry = new Date();
        newExpiry.setMinutes(newExpiry.getMinutes() + state.sessionTimeout);
        dispatch({ type: "SET_SESSION_EXPIRY", payload: newExpiry });
      }
    }
  }, [state.user, state.sessionExpiry, state.sessionTimeout]);

  const extendSession = useCallback(() => {
    if (state.user) {
      const newExpiry = new Date();
      newExpiry.setMinutes(newExpiry.getMinutes() + state.sessionTimeout);
      dispatch({ type: "SET_SESSION_EXPIRY", payload: newExpiry });
      dispatch({ type: "UPDATE_LAST_ACTIVITY" });
    }
  }, [state.user, state.sessionTimeout]);

  const checkSessionExpiry = useCallback(() => {
    if (!state.sessionExpiry) return false;
    return new Date() > new Date(state.sessionExpiry);
  }, [state.sessionExpiry]);

  const setRememberMe = useCallback((remember: boolean) => {
    dispatch({ type: "SET_REMEMBER_ME", payload: remember });
  }, []);

  const setAutoSignOut = useCallback((autoSignOut: boolean) => {
    dispatch({ type: "SET_AUTO_SIGN_OUT", payload: autoSignOut });
  }, []);

  const setSessionTimeout = useCallback((minutes: number) => {
    dispatch({ type: "SET_SESSION_TIMEOUT", payload: minutes });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  // Computed properties
  const isSessionExpired = React.useMemo(() => {
    return checkSessionExpiry();
  }, [checkSessionExpiry]);

  const timeUntilExpiry = React.useMemo(() => {
    if (!state.sessionExpiry) return null;
    const now = new Date();
    const expiry = new Date(state.sessionExpiry);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60))); // in minutes
  }, [state.sessionExpiry]);

  const hasRecentActivity = React.useMemo(() => {
    if (!state.lastActivity) return false;
    const now = new Date();
    const lastActivity = new Date(state.lastActivity);
    const diff = now.getTime() - lastActivity.getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  }, [state.lastActivity]);

  const signInMethods = React.useMemo(() => {
    if (!state.user) return [];
    return state.user.providerData.map((provider) => provider.providerId);
  }, [state.user]);

  // Auto sign-out effect
  useEffect(() => {
    if (state.autoSignOut && isSessionExpired && state.user) {
      signOut();
    }
  }, [state.autoSignOut, isSessionExpired, state.user, signOut]);

  // Activity tracking effect
  useEffect(() => {
    if (!state.user) return;

    const handleActivity = () => {
      updateActivity();
    };

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [state.user, updateActivity]);

  // Session expiry warning effect
  useEffect(() => {
    if (!state.user || !timeUntilExpiry) return;

    // Show warning when 5 minutes left
    if (timeUntilExpiry === 5) {
      console.warn("Session will expire in 5 minutes");
      // You could dispatch a notification here
    }

    // Show final warning when 1 minute left
    if (timeUntilExpiry === 1) {
      console.warn("Session will expire in 1 minute");
      // You could show a modal here
    }
  }, [timeUntilExpiry, state.user]);

const storeUserProfile = useCallback(async (user: AuthUser) => {
    console.log("storeUserProfile: Starting user profile storage process");
    
    const userToStore = user || state.user;
    if (!userToStore) {
      console.log("storeUserProfile: No user found, exiting early");
      return;
    }

    console.log("storeUserProfile: Processing user", { 
      uid: userToStore.uid, 
      email: userToStore.email,
      providerCount: userToStore.providerData.length 
    });

    try {
      console.log("storeUserProfile: Importing database actions");
      // Import database actions dynamically to avoid circular dependencies
      const { getUserById, createUser, getUserAuthByProvider, createUserAuth } =
        await import("@/app/lib/db/actions");

      console.log("storeUserProfile: Checking if user exists in database");
      // Check if user exists in our database
      let dbAuthUser = await getUserAuthByProvider('google', userToStore.uid);
      let dbUser = await getUserById(dbAuthUser.userId);

      // Create user if doesn't exist
      if (!dbUser) {
        console.log("storeUserProfile: User not found in database, creating new user");
        dbUser = await createUser({
          deletedAt: null,
        });
        console.log("storeUserProfile: New user created", { id: dbUser.id });
      } else {
        console.log("storeUserProfile: Existing user found", { id: dbUser.id });
      }

      console.log("storeUserProfile: Processing authentication records for providers");
      // Handle authentication records for each provider
      for (const provider of userToStore.providerData) {
        console.log("storeUserProfile: Processing provider", { 
          providerId: provider.providerId, 
          providerUid: provider.uid 
        });
        
        const existingAuth = await getUserAuthByProvider(
          provider.providerId,
          provider.uid
        );

        if (!existingAuth) {
          console.log("storeUserProfile: Creating new auth record for provider", provider.providerId);
          await createUserAuth({
            userId: dbUser.id,
            provider: provider.providerId,
            providerUserId: provider.uid,
            email: provider.email || userToStore.email,
            password: null, // Firebase handles auth, we don't store passwords
          });
          console.log("storeUserProfile: Auth record created for provider", provider.providerId);
        } else {
          console.log("storeUserProfile: Auth record already exists for provider", provider.providerId);
      }
      }

      console.log("storeUserProfile: User profile stored successfully");
    } catch (error) {
      console.error("storeUserProfile: Error storing user profile:", error);
      dispatch({ type: "SET_ERROR", payload: categorizeAuthError(error) });
    }
  }, [state.user]);

  const contextValue: AuthContextType = {
    state,
    // Sign-in methods
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsGuest,
    // Password management
    resetPassword,
    updateUserPassword,
    // Profile management
    updateUserProfile,
    // User actions
    signOut,
    refreshUser,
    storeUserProfile,
    // Session management
    updateActivity,
    extendSession,
    checkSessionExpiry,
    // Settings
    setRememberMe,
    setAutoSignOut,
    setSessionTimeout,
    // Error handling
    clearError,
    // Computed properties
    isSessionExpired,
    timeUntilExpiry,
    hasRecentActivity,
    signInMethods,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Custom hook to use the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export types for use in other components
export type { AuthState as AuthContextState, AuthError as AuthContextError };
