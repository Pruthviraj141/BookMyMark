import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Sparkles, Loader2, LogIn, Lock, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0e14]">
      <div className="w-full max-w-sm bg-[#161822] border border-[#272a38] rounded-3xl p-6 shadow-2xl flex flex-col space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-violet-900/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Welcome to MyBookMark</h1>
          <p className="text-xs text-zinc-400">Sign in to sync your saved bookmarks</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Username</label>
            <div className="relative flex items-center">
              <UserIcon className="absolute left-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-[#101117] border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-[#101117] border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-98 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Sign In
          </button>
        </form>

        {/* Navigation to Register */}
        <div className="text-center pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-violet-400 hover:text-violet-300 font-semibold"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
