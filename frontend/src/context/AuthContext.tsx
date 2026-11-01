import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase.js';
import { setAuthToken } from '../services/api.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import { getApiBaseUrl } from '../config/api.config.js';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const formatUser = (sbUser: SupabaseAuthUser): AppUser => ({
    id: sbUser.id,
    email: sbUser.email,
    name:
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      sbUser.email?.split('@')[0] ||
      'BookMyMark User',
    avatar_url: sbUser.user_metadata?.avatar_url
  });

  useEffect(() => {
    // 1. Initial URL & Native sync
    const sbUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ycaenlslaoiqnyopmytx.supabase.co';
    const sbKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    NativeSessionBridge.syncApiBaseUrl(getApiBaseUrl()).catch(() => {});
    NativeSessionBridge.syncSupabaseConfig(sbUrl, sbKey).catch(() => {});

    // 2. Fetch initial session from Supabase
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session && !error) {
        const accessToken = session.access_token;
        setTokenState(accessToken);
        setAuthToken(accessToken);
        setUser(formatUser(session.user));
        NativeSessionBridge.syncSessionToken(accessToken).catch(() => {});
      } else {
        setTokenState(null);
        setAuthToken(null);
        setUser(null);
        NativeSessionBridge.syncSessionToken(null).catch(() => {});
      }
      setLoading(false);
    });

    // 3. Listen to auth state changes (login, token refresh, logout)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        const accessToken = session.access_token;
        setTokenState(accessToken);
        setAuthToken(accessToken);
        setUser(formatUser(session.user));
        await NativeSessionBridge.syncSessionToken(accessToken).catch(() => {});
        await NativeSessionBridge.syncApiBaseUrl(getApiBaseUrl()).catch(() => {});
      } else {
        setTokenState(null);
        setAuthToken(null);
        setUser(null);
        await NativeSessionBridge.syncSessionToken(null).catch(() => {});
      }
      setLoading(false);
    });

    // 4. Handle deep-link callback from Chrome Custom Tab / System Browser on Android
    let appUrlListener: any = null;
    if (Capacitor.isNativePlatform()) {
      appUrlListener = CapApp.addListener('appUrlOpen', async ({ url }) => {
        try {
          await Browser.close();
        } catch {}

        if (url && (url.includes('#access_token') || url.includes('?access_token') || url.includes('code='))) {
          const rawParams = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
          const searchParams = new URLSearchParams(rawParams);
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          const code = searchParams.get('code');

          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          } else if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
          }
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (appUrlListener?.remove) {
        appUrlListener.remove();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'com.mybookmark.app://google-auth',
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });
        if (error) throw error;
        if (data?.url) {
          await Browser.open({ url: data.url, windowName: '_system' });
        }
      } else {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign-out error:', err);
    }
    setTokenState(null);
    setAuthToken(null);
    setUser(null);
    await NativeSessionBridge.syncSessionToken(null).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
