// Barrel exports for contexts
export { AuthProvider, useAuth } from './AuthContext';
export type { AuthUser, AuthContextState as AuthState, AuthContextError as AuthError } from './AuthContext';

export { CoreAppDataProvider, useCoreAppData } from './CoreAppDataContext';
export type { Training, Thread, UserProfile, CoreAppState } from './CoreAppDataContext';
