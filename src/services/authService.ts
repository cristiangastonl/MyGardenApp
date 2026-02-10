import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Required for OAuth redirect
WebBrowser.maybeCompleteAuthSession();

// OAuth redirect URI - use the app's scheme directly
const redirectUri = Linking.createURL('auth/callback');

// Log redirect URI for debugging
console.log('[Auth] Redirect URI:', redirectUri);

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No se recibió URL de autenticación');

    // Open browser for OAuth flow
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    );

    if (result.type === 'success' && result.url) {
      // Extract tokens from callback URL
      const params = new URLSearchParams(result.url.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (sessionError) throw sessionError;

        return {
          success: true,
          user: sessionData.user ?? undefined,
          session: sessionData.session ?? undefined,
        };
      }
    }

    if (result.type === 'cancel') {
      return { success: false, error: 'Cancelado por el usuario' };
    }

    return { success: false, error: 'Error en autenticación' };
  } catch (error) {
    console.error('[Auth] Google sign in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Sign in with Apple OAuth
 */
export async function signInWithApple(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No se recibió URL de autenticación');

    // Open browser for OAuth flow
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    );

    if (result.type === 'success' && result.url) {
      // Extract tokens from callback URL
      const params = new URLSearchParams(result.url.split('#')[1]);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (sessionError) throw sessionError;

        return {
          success: true,
          user: sessionData.user ?? undefined,
          session: sessionData.session ?? undefined,
        };
      }
    }

    if (result.type === 'cancel') {
      return { success: false, error: 'Cancelado por el usuario' };
    }

    return { success: false, error: 'Error en autenticación' };
  } catch (error) {
    console.error('[Auth] Apple sign in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true }; // Nothing to sign out if not configured
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('[Auth] Get session error:', error);
    return null;
  }
}

/**
 * Get the current user
 */
export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  if (!isSupabaseConfigured()) {
    // Return a no-op unsubscribe function
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange(callback);
}

// Export redirect URI for configuration reference
export { redirectUri };
