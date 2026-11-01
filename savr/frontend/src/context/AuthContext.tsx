import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import { getApiBaseUrl } from '../config/api.config.js';
import type { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Sync token to Native Bridge and fetch user profile
  useEffect(() => {
    async function initAuth() {
      // Sync API base URL to Native Bridge
      await NativeSessionBridge.syncApiBaseUrl(getApiBaseUrl());

      const savedToken = getAuthToken();
      if (!savedToken) {
        await NativeSessionBridge.syncSessionToken(null);
        setLoading(false);
        return;
      }

      try {
        await NativeSessionBridge.syncSessionToken(savedToken);
        const { user: profile } = await api.auth.getMe();
        setUser(profile);

        // Process any pending offline shares that were waiting for auth/network
        processPendingShares();
      } catch (err) {
        console.warn('Session expired or unreachable:', err);
        setAuthToken(null);
        setTokenState(null);
        setUser(null);
        await NativeSessionBridge.syncSessionToken(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const processPendingShares = async () => {
    try {
      const pending = await NativeSessionBridge.getPendingShares();
      if (pending && pending.length > 0) {
        console.log(`Processing ${pending.length} pending shares from Sharesheet...`);
        for (const item of pending) {
          try {
            await api.bookmarks.create({
              url: item.url,
              sharedText: item.sharedText
            });
          } catch (e) {
            console.error('Failed to sync pending item:', item.url, e);
          }
        }
        await NativeSessionBridge.clearPendingShares();
      }
    } catch (e) {
      console.warn('Error processing pending shares:', e);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    await NativeSessionBridge.syncSessionToken(res.token);
    await NativeSessionBridge.syncApiBaseUrl(getApiBaseUrl());
    await processPendingShares();
  };

  const register = async (username: string, password: string) => {
    const res = await api.auth.register(username, password);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    await NativeSessionBridge.syncSessionToken(res.token);
    await NativeSessionBridge.syncApiBaseUrl(getApiBaseUrl());
    await processPendingShares();
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    await NativeSessionBridge.syncSessionToken(null);
  };

  const refreshUser = async () => {
    try {
      const { user: profile } = await api.auth.getMe();
      setUser(profile);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser
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
