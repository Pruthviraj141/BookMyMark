import React, { useState, useEffect } from 'react';
import {
  User,
  LogOut,
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Save,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { getApiBaseUrl, setApiBaseUrl } from '../config/api.config.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import { api } from '../services/api.js';

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
      setConnectionMessage(`Connected to ${data.data?.app || 'MyBookMark'} (Status: ${data.data?.status || 'ok'})`);
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

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0d0e14]/95 backdrop-blur-md p-4 border-b border-[#1f222e] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="text-base font-bold text-white">Settings</h1>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Account Info Card */}
        <div className="p-4 rounded-2xl bg-[#161822] border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-950/80 border border-violet-700/50 flex items-center justify-center text-violet-300 font-bold text-lg">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-semibold text-zinc-100 block">{user?.username}</span>
              <span className="text-xs text-zinc-500">Authenticated Account</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Backend API Configuration */}
        <div className="p-5 rounded-2xl bg-[#161822] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Backend Connection</h2>
            </div>
            <button
              type="button"
              onClick={() => testConnection()}
              disabled={testingConnection}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              API Base URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://192.168.1.10:3000"
                className="flex-grow bg-[#101117] border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleSaveApiUrl}
                className="px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white flex items-center gap-1 flex-shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
            {saveSuccess && (
              <span className="text-[11px] text-emerald-400 mt-1 block">
                Saved & synchronized to Native Bridge!
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

          {/* Fedora Wi-Fi LAN hint */}
          <div className="p-3 rounded-xl bg-[#111219] border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-300">Testing on physical Android:</strong> Find your computer's Wi-Fi IP on Fedora with{' '}
              <code className="text-violet-300 bg-zinc-900 px-1 rounded">ip route get 1</code> and enter{' '}
              <code className="text-violet-300 bg-zinc-900 px-1 rounded">http://&lt;YOUR_IP&gt;:3000</code>.
            </div>
          </div>
        </div>

        {/* Security & Architecture */}
        <div className="p-4 rounded-2xl bg-[#161822] border border-zinc-800 space-y-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Native Share Integration</span>
          </div>
          <p>
            When sharing from Instagram or X, MyBookMark's native <code className="text-zinc-300">ShareReceiverActivity</code> saves content directly via the configured backend without opening the main UI.
          </p>
        </div>

        {/* App Version */}
        <div className="text-center pt-4 text-xs text-zinc-600">
          <span className="font-semibold text-zinc-500">MyBookMark</span> — v1.0.0
          <br />
          Android-first Personal Visual Library
        </div>
      </div>
    </div>
  );
};
