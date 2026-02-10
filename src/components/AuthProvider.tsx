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

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Re-export helper functions
export { getUserDisplayName, getUserAvatarUrl };
