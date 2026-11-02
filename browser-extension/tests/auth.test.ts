import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSession: any = null;

vi.mock('../src/services/supabase-client.js', () => ({
  getSupabase: () => ({
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: mockSession },
        error: null
      })),
      signInWithOAuth: vi.fn(async () => ({
        data: { url: 'https://ycaenlslaoiqnyopmytx.supabase.co/auth/v1/authorize?provider=google' },
        error: null
      })),
      signInWithPassword: vi.fn(async ({ email }) => ({
        data: {
          user: { id: 'pwd-user-123', email },
          session: { access_token: 'pwd-jwt-token' }
        },
        error: null
      })),
      signInWithOtp: vi.fn(async () => ({
        data: {},
        error: null
      })),
      exchangeCodeForSession: vi.fn(async (_code: string) => ({
        data: {
          session: {
            access_token: 'valid-jwt-token',
            user: { id: 'oauth-user-123', email: 'google@bookmymark.app' }
          }
        },
        error: null
      })),
      signOut: vi.fn(async () => {
        mockSession = null;
        return { error: null };
      }),
      onAuthStateChange: vi.fn((_cb) => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  })
}));

let tabListener: any = null;

vi.mock('wxt/browser', () => ({
  browser: {
    identity: {
      getRedirectURL: vi.fn(() => 'https://mock-extension-id.chromiumapp.org/'),
      launchWebAuthFlow: vi.fn(async () => 'https://mock-extension-id.chromiumapp.org/?code=valid-auth-code')
    },
    runtime: {
      id: 'mock-extension-id'
    },
    windows: {
      create: vi.fn(async () => {
        setTimeout(() => {
          if (tabListener) {
            tabListener(1, { url: 'https://mock-extension-id.chromiumapp.org/?code=valid-auth-code' }, { id: 1 });
          }
        }, 10);
        return { id: 100, tabs: [{ id: 1 }] };
      }),
      remove: vi.fn(async () => {})
    },
    tabs: {
      create: vi.fn(async () => {
        setTimeout(() => {
          if (tabListener) {
            tabListener(1, { url: 'https://mock-extension-id.chromiumapp.org/?code=valid-auth-code' }, { id: 1 });
          }
        }, 10);
        return { id: 1 };
      }),
      remove: vi.fn(async () => {}),
      onUpdated: {
        addListener: vi.fn((fn) => { tabListener = fn; }),
        removeListener: vi.fn(() => { tabListener = null; })
      }
    }
  }
}));

import { AuthService } from '../src/services/auth.service.js';

describe('Auth Service', () => {
  beforeEach(() => {
    mockSession = null;
    tabListener = null;
    vi.clearAllMocks();
  });

  it('should format Supabase users cleanly', () => {
    const rawUser: any = {
      id: 'user-id-5678',
      email: 'alex@example.com',
      user_metadata: {
        full_name: 'Alex Mercer',
        avatar_url: 'https://example.com/avatar.png'
      }
    };

    const formatted = AuthService.formatUser(rawUser);
    expect(formatted.id).toBe('user-id-5678');
    expect(formatted.name).toBe('Alex Mercer');
    expect(formatted.email).toBe('alex@example.com');
    expect(formatted.avatar_url).toBe('https://example.com/avatar.png');
  });

  it('should return unauthenticated status when no session exists', async () => {
    const status = await AuthService.getAuthStatus();
    expect(status.isAuthenticated).toBe(false);
    expect(status.user).toBeNull();
    expect(status.token).toBeNull();
  });

  it('should return authenticated status when active session exists', async () => {
    mockSession = {
      access_token: 'test-jwt',
      user: {
        id: 'usr-999',
        email: 'logged@example.com',
        user_metadata: { name: 'Logged User' }
      }
    };

    const status = await AuthService.getAuthStatus();
    expect(status.isAuthenticated).toBe(true);
    expect(status.user?.id).toBe('usr-999');
    expect(status.token).toBe('test-jwt');
  });

  it('should complete Google OAuth flow via interactive browser window and PKCE', async () => {
    const res = await AuthService.signInWithGoogle();
    expect(res.success).toBe(true);
    expect(res.user?.id).toBe('oauth-user-123');
    expect(res.user?.email).toBe('google@bookmymark.app');
  });

  it('should support email and password sign in', async () => {
    const res = await AuthService.signInWithPassword('test@bookmymark.app', 'password123');
    expect(res.success).toBe(true);
    expect(res.user?.id).toBe('pwd-user-123');
  });

  it('should correctly parse tokens from custom protocol scheme redirects', () => {
    const rawCustomScheme =
      'com.mybookmark.app://google-auth#access_token=test_access_jwt&refresh_token=test_refresh_jwt&token_type=bearer&type=recovery';
    const parsed = (AuthService as any).parseAuthRedirect(rawCustomScheme);

    expect(parsed.accessToken).toBe('test_access_jwt');
    expect(parsed.refreshToken).toBe('test_refresh_jwt');
    expect(parsed.error).toBeUndefined();
  });

  it('should correctly parse error from Supabase custom scheme redirect', () => {
    const rawErrorScheme =
      'com.mybookmark.app:?error=invalid_request&error_description=OAuth+failed';
    const parsed = (AuthService as any).parseAuthRedirect(rawErrorScheme);

    expect(parsed.error).toBe('OAuth failed');
  });

  it('should sign out active user and clear session', async () => {
    mockSession = { access_token: 'token', user: { id: 'u1' } };
    const signedOut = await AuthService.signOut();
    expect(signedOut).toBe(true);

    const status = await AuthService.getAuthStatus();
    expect(status.isAuthenticated).toBe(false);
  });
});
