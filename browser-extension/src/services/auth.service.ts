import { browser } from 'wxt/browser';
import type { User as SupabaseAuthUser, Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase-client.js';
import type { AppUser, AuthStatusResponse } from '../types/index.js';

export class AuthService {
  /**
   * Format Supabase User into client-safe AppUser
   */
  static formatUser(sbUser: SupabaseAuthUser): AppUser {
    return {
      id: sbUser.id,
      email: sbUser.email,
      name:
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'BookMyMark User',
      avatar_url: sbUser.user_metadata?.avatar_url
    };
  }

  /**
   * Get current auth status and session
   */
  static async getAuthStatus(): Promise<AuthStatusResponse> {
    try {
      const supabase = getSupabase();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return {
          isAuthenticated: false,
          user: null,
          token: null
        };
      }

      return {
        isAuthenticated: true,
        user: this.formatUser(session.user),
        token: session.access_token
      };
    } catch (err) {
      console.warn('[BookMyMark] Error getting auth status:', err);
      return {
        isAuthenticated: false,
        user: null,
        token: null
      };
    }
  }

  /**
   * Get active token (handles auto-refresh internally in Supabase client)
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Sign In via Email OTP / Verification Code (Instant & 100% reliable)
   */
  static async sendOtpCode(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send verification code.' };
    }
  }

  /**
   * Verify the OTP code sent to user email
   */
  static async verifyOtpCode(email: string, token: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email'
      });

      if (error || !data.session?.user) {
        return {
          success: false,
          error: error?.message || 'Invalid or expired verification code.'
        };
      }

      return {
        success: true,
        user: this.formatUser(data.session.user)
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Verification failed.'
      };
    }
  }

  /**
   * Safely parse tokens or authorization codes from redirect URLs, Location headers,
   * or custom protocol schemes (com.mybookmark.app://...)
   */
  private static parseAuthRedirect(rawUrl: string): {
    accessToken?: string;
    refreshToken?: string;
    code?: string;
    error?: string;
  } {
    try {
      // Normalise custom protocol schemes so standard URL parser doesn't throw
      const normalized = rawUrl.replace(/^com\.mybookmark\.app:\/\/[^#?]*/i, 'https://auth.internal/');
      const parsed = new URL(normalized);
      const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const searchParams = parsed.searchParams;

      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') || undefined;
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || undefined;
      const code = searchParams.get('code') || hashParams.get('code') || undefined;
      const error =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error') ||
        undefined;

      return { accessToken, refreshToken, code, error };
    } catch {
      const accessMatch = rawUrl.match(/[#?&]access_token=([^&]+)/);
      const refreshMatch = rawUrl.match(/[#?&]refresh_token=([^&]+)/);
      const codeMatch = rawUrl.match(/[#?&]code=([^&]+)/);
      const errMatch = rawUrl.match(/[#?&](error_description|error)=([^&]+)/);

      return {
        accessToken: accessMatch ? decodeURIComponent(accessMatch[1]) : undefined,
        refreshToken: refreshMatch ? decodeURIComponent(refreshMatch[1]) : undefined,
        code: codeMatch ? decodeURIComponent(codeMatch[1]) : undefined,
        error: errMatch ? decodeURIComponent(errMatch[2]) : undefined
      };
    }
  }

  /**
   * Launch OAuth in an authentic top-level browser tab and intercept tokens before browser halts on com.mybookmark.app://
   */
  private static async launchTabAuth(authUrl: string): Promise<{ code?: string; accessToken?: string; refreshToken?: string }> {
    return new Promise(async (resolve, reject) => {
      let authTabId: number | undefined;
      let isResolved = false;

      const finishAuth = (payload: { code?: string; accessToken?: string; refreshToken?: string; error?: Error }) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        if (payload.error) {
          reject(payload.error);
        } else {
          resolve({
            code: payload.code,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken
          });
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        try {
          if ((browser.webRequest as any)?.onHeadersReceived?.removeListener && onHeadersReceived) {
            (browser.webRequest as any).onHeadersReceived.removeListener(onHeadersReceived);
          }
        } catch {}
        try {
          if (browser.webNavigation?.onErrorOccurred?.removeListener && onErrorOccurred) {
            browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
          }
        } catch {}
        try {
          if (browser.webNavigation?.onBeforeNavigate?.removeListener && onBeforeNavigate) {
            browser.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
          }
        } catch {}
        try {
          if (browser.tabs?.onUpdated?.removeListener) {
            browser.tabs.onUpdated.removeListener(onTabUpdated);
          }
        } catch {}
        try {
          if (browser.tabs?.onRemoved?.removeListener) {
            browser.tabs.onRemoved.removeListener(onTabRemoved);
          }
        } catch {}
        try {
          if (authTabId) {
            browser.tabs.remove(authTabId).catch(() => {});
          }
        } catch {}
      };

      const timeout = setTimeout(() => {
        finishAuth({ error: new Error('Sign in timed out.') });
      }, 180000);

      // 1. Intercept HTTP 302/303 redirect from Supabase callback before browser halts on unknown protocol
      const onHeadersReceived = (details: any) => {
        if (isResolved) return;
        if (authTabId && details.tabId !== authTabId && details.tabId !== -1) return;

        const locationHeader = details.responseHeaders?.find(
          (h: any) => h.name?.toLowerCase() === 'location'
        );
        if (!locationHeader?.value) return;

        const loc = locationHeader.value;
        if (
          loc.includes('access_token=') ||
          loc.includes('code=') ||
          loc.includes('error=') ||
          loc.includes('com.mybookmark.app')
        ) {
          const parsed = AuthService.parseAuthRedirect(loc);
          if (parsed.error) {
            finishAuth({ error: new Error(parsed.error) });
          } else if (parsed.code || parsed.accessToken) {
            finishAuth({
              code: parsed.code,
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken
            });
          }
          return { cancel: true };
        }
      };

      // 2. Catch Firefox unknown protocol error if navigation is prevented
      const onErrorOccurred = (details: any) => {
        if (isResolved) return;
        if (authTabId && details.tabId !== authTabId) return;

        const url = details.url;
        if (url && (url.includes('access_token=') || url.includes('code=') || url.includes('com.mybookmark.app'))) {
          const parsed = AuthService.parseAuthRedirect(url);
          if (parsed.error) {
            finishAuth({ error: new Error(parsed.error) });
          } else if (parsed.code || parsed.accessToken) {
            finishAuth({
              code: parsed.code,
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken
            });
          }
        }
      };

      // 3. Catch custom protocol navigation start
      const onBeforeNavigate = (details: any) => {
        if (isResolved) return;
        if (authTabId && details.tabId !== authTabId) return;

        const url = details.url;
        if (url && (url.includes('access_token=') || url.includes('code=') || url.includes('com.mybookmark.app'))) {
          const parsed = AuthService.parseAuthRedirect(url);
          if (parsed.error) {
            finishAuth({ error: new Error(parsed.error) });
          } else if (parsed.code || parsed.accessToken) {
            finishAuth({
              code: parsed.code,
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken
            });
          }
        }
      };

      // 4. Standard Tab URL listener
      const onTabUpdated = (tabId: number, changeInfo: any, tab: any) => {
        if (isResolved) return;
        if (authTabId && tabId !== authTabId) return;

        const url = changeInfo.url || tab?.url;
        if (!url) return;

        if (
          url.includes('access_token=') ||
          url.includes('code=') ||
          url.includes('error=') ||
          url.includes('com.mybookmark.app')
        ) {
          const parsed = AuthService.parseAuthRedirect(url);
          if (parsed.error) {
            finishAuth({ error: new Error(parsed.error) });
          } else if (parsed.code || parsed.accessToken) {
            finishAuth({
              code: parsed.code,
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken
            });
          }
        }
      };

      // 5. Early exit if user closes tab
      const onTabRemoved = (tabId: number) => {
        if (authTabId && tabId === authTabId && !isResolved) {
          finishAuth({ error: new Error('Sign in tab was closed.') });
        }
      };

      // Register listeners safely
      try {
        if ((browser.webRequest as any)?.onHeadersReceived?.addListener) {
          (browser.webRequest as any).onHeadersReceived.addListener(
            onHeadersReceived,
            { urls: ['*://ycaenlslaoiqnyopmytx.supabase.co/auth/v1/callback*'] },
            ['blocking', 'responseHeaders']
          );
        }
      } catch {}

      try {
        if (browser.webNavigation?.onErrorOccurred?.addListener) {
          browser.webNavigation.onErrorOccurred.addListener(onErrorOccurred);
        }
      } catch {}

      try {
        if (browser.webNavigation?.onBeforeNavigate?.addListener) {
          browser.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
        }
      } catch {}

      try {
        if (browser.tabs?.onUpdated?.addListener) {
          browser.tabs.onUpdated.addListener(onTabUpdated);
        }
      } catch {}

      try {
        if (browser.tabs?.onRemoved?.addListener) {
          browser.tabs.onRemoved.addListener(onTabRemoved);
        }
      } catch {}

      // Launch auth tab
      try {
        const tab = await browser.tabs.create({ url: authUrl, active: true });
        authTabId = tab.id;
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  }

  /**
   * Sign in with Google using top-level browser tab + Supabase PKCE
   */
  static async signInWithGoogle(): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    try {
      const supabase = getSupabase();

      // 1. Initiate OAuth without blocking redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error || !data?.url) {
        return {
          success: false,
          error: error?.message || 'Failed to initiate Google OAuth with Supabase.'
        };
      }

      // 2. Launch top-level tab
      const { code, accessToken, refreshToken } = await this.launchTabAuth(data.url);

      let session: Session | null = null;

      if (accessToken && refreshToken) {
        const { data: setData, error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (setError) throw setError;
        session = setData.session;
      } else if (code) {
        // Exchange PKCE Code
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        session = exchangeData.session;
      }

      if (!session?.user) {
        return {
          success: false,
          error: 'Failed to extract valid user session.'
        };
      }

      return {
        success: true,
        user: this.formatUser(session.user)
      };
    } catch (err: any) {
      console.error('[BookMyMark] Sign-in error:', err);
      return {
        success: false,
        error: err?.message || 'An error occurred during authentication.'
      };
    }
  }

  /**
   * Direct Sign In with Email & Password
   */
  static async signInWithPassword(email: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Invalid email or password.'
        };
      }

      return {
        success: true,
        user: this.formatUser(data.user)
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Sign in failed.'
      };
    }
  }

  /**
   * Sign out the active user session
   */
  static async signOut(): Promise<boolean> {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      return true;
    } catch (err) {
      console.warn('[BookMyMark] Sign out failed:', err);
      return false;
    }
  }

  /**
   * Subscribe to Supabase auth state transitions
   */
  static onAuthStateChange(callback: (status: AuthStatusResponse) => void): () => void {
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        callback({
          isAuthenticated: true,
          user: this.formatUser(session.user),
          token: session.access_token
        });
      } else {
        callback({
          isAuthenticated: false,
          user: null,
          token: null
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}
