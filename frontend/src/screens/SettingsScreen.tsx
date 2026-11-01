import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Cloud,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_API_URL } from '../config/api.config.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const testConnection = async (urlToTest = apiUrl) => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const cleanUrl = urlToTest.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnectionStatus('success');
      setConnectionMessage(`Connected to ${data.service || 'SAVR'} (Cloudflare: ${data.cloudflare ? 'Yes' : 'No'})`);
    } catch (e: any) {
      setConnectionStatus('failed');
      setConnectionMessage(`Connection failed: ${e.message || 'Server unreachable'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleSaveApiUrl = async () => {
    const clean = apiUrl.trim().replace(/\/+$/, '');
    setApiBaseUrl(clean);
    await NativeSessionBridge.syncApiBaseUrl(clean);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    testConnection(clean);
  };

  const handleResetDefaultUrl = async () => {
    setApiUrl(DEFAULT_API_URL);
    setApiBaseUrl(DEFAULT_API_URL);
    await NativeSessionBridge.syncApiBaseUrl(DEFAULT_API_URL);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    testConnection(DEFAULT_API_URL);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0d0e14]/95 backdrop-blur-md p-4 border-b border-[#1f222e] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="text-base font-bold text-white">Settings</h1>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Google Account Card */}
        <div className="p-4 rounded-2xl bg-[#161822] border border-zinc-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || 'User'}
                className="w-12 h-12 rounded-full border border-violet-500/40 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-violet-950/80 border border-violet-700/50 flex items-center justify-center text-violet-300 font-bold text-lg">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-zinc-100 block">{user?.name || 'SAVR User'}</span>
              <span className="text-xs text-zinc-400 truncate max-w-[200px] block">{user?.email}</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                Google Authenticated
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Architecture status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#161822] border border-zinc-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Cloud className="w-4 h-4" />
              <span>Cloud Backend</span>
            </div>
            <span className="text-zinc-300 font-medium">Cloudflare Workers</span>
            <span className="text-[10px] text-zinc-500">Stateless Hono + Groq AI</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161822] border border-zinc-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>Cloud Storage</span>
            </div>
            <span className="text-zinc-300 font-medium">Supabase Postgres</span>
            <span className="text-[10px] text-zinc-500">RLS User-Isolated</span>
          </div>
        </div>

        {/* Backend API Configuration */}
        <div className="p-5 rounded-2xl bg-[#161822] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Worker Endpoint</h2>
            </div>
            <button
              type="button"
              onClick={() => testConnection()}
              disabled={testingConnection}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              Test
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Deployed API Base URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={DEFAULT_API_URL}
                className="flex-grow bg-[#101117] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleSaveApiUrl}
                className="px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white flex items-center gap-1 flex-shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
            {saveSuccess && (
              <span className="text-[11px] text-emerald-400 mt-1 block">
                Saved & synchronized to Native Android Bridge!
              </span>
            )}
          </div>

          {/* Connection status banner */}
          {connectionStatus === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{connectionMessage}</span>
            </div>
          )}
          {connectionStatus === 'failed' && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{connectionMessage}</span>
            </div>
          )}

          {apiUrl !== DEFAULT_API_URL && (
            <button
              type="button"
              onClick={handleResetDefaultUrl}
              className="text-xs text-zinc-400 hover:text-white underline"
            >
              Reset to default Cloudflare Worker URL
            </button>
          )}
        </div>

        {/* Native Android Share Integration Card */}
        <div className="p-4 rounded-2xl bg-[#161822] border border-zinc-800 space-y-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Instant Android Sharesheet</span>
          </div>
          <p className="leading-relaxed">
            When you share from Instagram, YouTube, X, or Chrome, SAVR's native Android{' '}
            <code className="text-zinc-300">ShareReceiverActivity</code> saves content instantly in the background without needing to keep the laptop running.
          </p>
        </div>

        {/* App Version */}
        <div className="text-center pt-2 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-500">SAVR</span> — v2.0.0
          <br />
          Offline-First AI Bookmark Library
        </div>
      </div>
    </div>
  );
};
