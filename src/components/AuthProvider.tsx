import React, { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuth, AuthState, AuthActions, getUserDisplayName, getUserAvatarUrl } from '../hooks/useAuth';

interface AuthContextType extends AuthState, AuthActions {
  displayName: string | null;
  avatarUrl: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  const value: AuthContextType = {
    ...auth,
    displayName: getUserDisplayName(auth.user),
    avatarUrl: getUserAvatarUrl(auth.user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

const noopAuthResult = async () => ({ success: false as const, error: 'Auth not available' });

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: false,
  isAuthenticated: false,
  isConfigured: false,
  displayName: null,
  avatarUrl: null,
  signInWithGoogle: noopAuthResult,
  signInWithApple: noopAuthResult,
  signOut: async () => ({ success: false, error: 'Auth not available' }),
  skipAuth: () => {},
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  // Return safe defaults when used outside AuthProvider (e.g. MVP mode with AUTH flag off)
  if (context === undefined) {
    return defaultAuthContext;
  }
  return context;
}

// Re-export helper functions
export { getUserDisplayName, getUserAvatarUrl };
