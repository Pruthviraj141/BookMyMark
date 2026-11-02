import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Mail, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthService } from '../services/auth.service.js';

import { browser } from 'wxt/browser';

interface SignInSectionProps {
  onSignInSuccess: () => Promise<void>;
  pendingCount?: number;
}

export const SignInSection: React.FC<SignInSectionProps> = ({ onSignInSuccess, pendingCount = 0 }) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'options' | 'otp' | 'password'>('options');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      // Delegate to background script so popup closing doesn't abort tab interception
      let res: any;
      try {
        res = await browser.runtime.sendMessage({ type: 'AUTH_SIGN_IN' });
      } catch {
        res = await AuthService.signInWithGoogle();
      }

      if (res?.success) {
        await onSignInSuccess();
      } else {
        setError(res?.error || 'Failed to sign in with Google');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.sendOtpCode(email);
      if (res.success) {
        setOtpSent(true);
      } else {
        setError(res.error || 'Failed to send verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.verifyOtpCode(email, otpCode);
      if (res.success) {
        await onSignInSuccess();
      } else {
        setError(res.error || 'Invalid or expired code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.signInWithPassword(email, password);
      if (res.success) {
        await onSignInSuccess();
      } else {
        setError(res.error || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 flex flex-col items-center text-center bg-[var(--bg-primary)]">
      {/* Brand Emblem */}
      <div className="w-11 h-11 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-xs mb-2.5">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-[var(--text-primary)]"
        >
          <rect x="8" y="4" width="32" height="40" rx="5" fill="currentColor" />
          <path d="M17 4H31V25L24 19.5L17 25V4Z" fill="var(--bg-primary)" />
          <rect x="16" y="30" width="16" height="2.5" rx="1.25" fill="var(--bg-primary)" />
          <rect x="16" y="35.5" width="10" height="2.5" rx="1.25" fill="var(--bg-primary)" />
        </svg>
      </div>

      <h2 className="text-[14px] font-bold text-[var(--text-primary)] tracking-tight">
        BookMyMark
      </h2>
      <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 max-w-[260px] leading-relaxed">
        Everything worth keeping. Save on desktop, access instantly on your Android phone.
      </p>

      {mode === 'options' && (
        <div className="w-full mt-4 space-y-2.5">
          {/* Main Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:opacity-90 active:scale-[0.99] font-medium text-[12.5px] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            {googleLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Opening Google in tab...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Email OTP Button */}
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setError(null);
            }}
            className="w-full py-2 px-4 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[12px] font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Sign in with Email Code (OTP)</span>
          </button>
        </div>
      )}

      {/* Mode: Email OTP Verification */}
      {mode === 'otp' && (
        <div className="w-full mt-3 text-left">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Enter your BookMyMark account email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3 py-1.5 rounded-md text-[12px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] outline-none text-[var(--text-primary)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Send 6-Digit Code</span>}
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verification code sent to {email}</span>
              </div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                className="w-full text-center tracking-widest font-mono text-[16px] px-3 py-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] outline-none text-[var(--text-primary)]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Verify & Log In</span>}
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setMode('options');
              setOtpSent(false);
              setError(null);
            }}
            className="w-full mt-2.5 text-center text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            ← Back to sign-in options
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex items-start gap-1.5 text-left p-2 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10.5px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {pendingCount > 0 && (
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          <strong className="text-[var(--text-secondary)]">{pendingCount} bookmarks</strong> queued locally will sync automatically upon sign-in.
        </p>
      )}
    </div>
  );
};
