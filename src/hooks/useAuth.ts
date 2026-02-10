import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  signInWithGoogle as authSignInWithGoogle,
  signInWithApple as authSignInWithApple,
  signOut as authSignOut,
  getSession,
  onAuthStateChange,
  AuthResult,
} from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
}

export interface AuthActions {
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  skipAuth: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Initialize auth state
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setSkipped(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setLoading(true);
    const result = await authSignInWithGoogle();
    if (result.success) {
      setUser(result.user ?? null);
      setSession(result.session ?? null);
    }
    setLoading(false);
    return result;
  }, []);

  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    setLoading(true);
    const result = await authSignInWithApple();
    if (result.success) {
      setUser(result.user ?? null);
      setSession(result.session ?? null);
    }
    setLoading(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const result = await authSignOut();
    if (result.success) {
      setUser(null);
      setSession(null);
      setSkipped(false);
    }
    setLoading(false);
    return result;
  }, []);

  const skipAuth = useCallback(() => {
    setSkipped(true);
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user || skipped,
    isConfigured,
    signInWithGoogle,
    signInWithApple,
    signOut,
    skipAuth,
  };
}

// Helper to get display name from user object
export function getUserDisplayName(user: User | null): string | null {
  if (!user) return null;

  // Try different metadata fields
  const metadata = user.user_metadata;
  return (
    metadata?.full_name ||
    metadata?.name ||
    metadata?.preferred_username ||
    user.email?.split('@')[0] ||
    null
  );
}

// Helper to get avatar URL from user object
export function getUserAvatarUrl(user: User | null): string | null {
  if (!user) return null;

  const metadata = user.user_metadata;
  return metadata?.avatar_url || metadata?.picture || null;
}
