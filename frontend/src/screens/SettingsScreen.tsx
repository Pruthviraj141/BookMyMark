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
  Database,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../theme/ThemeProvider.js';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_API_URL } from '../config/api.config.js';
import { NativeSessionBridge } from '../services/nativeBridge.js';
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter } from '../components/ui/AlertDialog.js';
import { useToast } from '../components/ui/Toast.js';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const testConnection = async (urlToTest = apiUrl) => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const cleanUrl = urlToTest.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnectionStatus('success');
      setConnectionMessage(`Connected to ${data.service || 'BookMyMark'} (Cloudflare Edge: ${data.cloudflare ? 'Yes' : 'No'})`);
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
    toast({
      title: 'Worker URL Updated',
      description: 'Synchronized with Android Native Bridge',
      variant: 'success'
    });
    testConnection(clean);
  };

  const handleResetDefaultUrl = async () => {
    setApiUrl(DEFAULT_API_URL);
    setApiBaseUrl(DEFAULT_API_URL);
    await NativeSessionBridge.syncApiBaseUrl(DEFAULT_API_URL);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    toast({
      title: 'Reset to Default URL',
      variant: 'default'
    });
    testConnection(DEFAULT_API_URL);
  };

  const handleThemeChange = async (mode: 'light' | 'dark' | 'system') => {
    await setTheme(mode);
    toast({
      title: `Theme: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
      variant: 'default',
      duration: 1500
    });
  };

  return (
    <>
      <div className="flex flex-col min-h-screen pb-24 bg-background transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl px-4 py-3 border-b border-border pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h1 className="text-base font-bold text-foreground">Settings</h1>
        </header>

        <div className="p-4 space-y-5 max-w-lg mx-auto w-full">
          {/* Google Account Card */}
          <div className="p-4 rounded-3xl bg-card border border-border flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  className="w-12 h-12 rounded-2xl border border-primary/30 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-lg">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="text-sm font-bold text-foreground block">{user?.name || 'BookMyMark User'}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px] block font-mono">{user?.email}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Google Verified Session
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-colors cursor-pointer active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Selector Section */}
          <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Appearance</h2>
                <p className="text-[11px] text-muted-foreground">Choose light, dark, or system default</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-muted p-1.5 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-4 h-4 text-primary" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Cloud Architecture status */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-3xl bg-card border border-border flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Cloud className="w-4 h-4" />
                <span>Cloud Edge</span>
              </div>
              <span className="text-foreground font-semibold">Cloudflare Workers</span>
              <span className="text-[10px] text-muted-foreground">Stateless Hono + Groq AI</span>
            </div>

            <div className="p-3.5 rounded-3xl bg-card border border-border flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Database className="w-4 h-4" />
                <span>Cloud Vault</span>
              </div>
              <span className="text-foreground font-semibold">Supabase Postgres</span>
              <span className="text-[10px] text-muted-foreground">User-Isolated RLS</span>
            </div>
          </div>

          {/* Backend API Configuration */}
          <div className="p-5 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Worker API Endpoint</h2>
              </div>
              <button
                type="button"
                onClick={() => testConnection()}
                disabled={testingConnection}
                className="text-xs text-primary hover:opacity-80 flex items-center gap-1 font-semibold disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                Test
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                API Base URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder={DEFAULT_API_URL}
                  className="flex-grow bg-muted/60 border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-xs font-semibold text-primary-foreground flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
              {saveSuccess && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
                  Saved & synchronized to Native Android Bridge!
                </span>
              )}
            </div>

            {/* Connection status banner */}
            {connectionStatus === 'success' && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="font-medium">{connectionMessage}</span>
              </div>
            )}
            {connectionStatus === 'failed' && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/25 text-xs text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-destructive" />
                <span className="font-medium">{connectionMessage}</span>
              </div>
            )}

            {apiUrl !== DEFAULT_API_URL && (
              <button
                type="button"
                onClick={handleResetDefaultUrl}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Reset to default Cloudflare Worker URL
              </button>
            )}
          </div>

          {/* Native Android Share Integration Card */}
          <div className="p-4 rounded-3xl bg-card border border-border space-y-2 text-xs text-muted-foreground shadow-xs">
            <div className="flex items-center gap-2 text-foreground font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Instant Android Share Sheet</span>
            </div>
            <p className="leading-relaxed">
              When you share links from Instagram, YouTube, X, or Chrome, BookMyMark's native Android{' '}
              <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">ShareReceiverActivity</code> captures them in background without pulling you away.
            </p>
          </div>

          {/* App Version */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">BookMyMark</span> — v2.0.0
            <br />
            Everything worth keeping.
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog isOpen={isLogoutDialogOpen} onClose={() => setIsLogoutDialogOpen(false)}>
        <AlertDialogBackdrop onClick={() => setIsLogoutDialogOpen(false)} />
        <AlertDialogContent>
          <AlertDialogHeader>Sign Out of BookMyMark</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to sign out? Your bookmarks remain safely preserved in your cloud vault.
          </AlertDialogBody>
          <AlertDialogFooter>
            <button
              type="button"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogoutDialogOpen(false);
                logout();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all cursor-pointer shadow-sm"
            >
              Sign Out
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
