import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Loader2 } from 'lucide-react';
import { BookMyMarkLogo } from '../components/BookMyMarkLogo.js';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Failed to start Google sign-in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden transition-colors pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm flex flex-col items-center text-center px-4 space-y-10 relative z-10">
        {/* 1. BookMyMark Brand Identity */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
            <BookMyMarkLogo className="w-9 h-9 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            BookMyMark
          </h1>
          {/* 2. Exact Tagline */}
          <p className="text-sm text-muted-foreground font-normal tracking-normal">
            Everything worth keeping.
          </p>
        </div>

        {/* Error message if login failed */}
        {error && (
          <div className="w-full p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-xs text-destructive text-center">
            {error}
          </div>
        )}

        {/* 3. Clean Google Sign-in Button */}
        <div className="w-full max-w-xs">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-foreground hover:opacity-90 active:scale-[0.985] text-xs font-semibold text-background flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-background" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            )}
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
