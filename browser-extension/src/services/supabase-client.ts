import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { browser } from 'wxt/browser';
import { CONFIG } from '../config/env.config.js';

/**
 * Custom browser.storage.local adapter for Supabase Auth session persistence
 */
const extensionStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const data = await browser.storage.local.get(key);
      const val = data[key];
      return typeof val === 'string' ? val : (val ? JSON.stringify(val) : null);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch (e) {
      console.warn('[BookMyMark] Storage setItem failed:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await browser.storage.local.remove(key);
    } catch (e) {
      console.warn('[BookMyMark] Storage removeItem failed:', e);
    }
  }
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: extensionStorageAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  });

  return supabaseInstance;
}
