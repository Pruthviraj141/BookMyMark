import { registerPlugin, Capacitor } from '@capacitor/core';

export interface PendingShareItem {
  id?: string;
  url: string;
  sharedText?: string;
  timestamp: number;
}

export interface NativeBridgePlugin {
  setSessionToken(options: { token: string }): Promise<void>;
  clearSessionToken(): Promise<void>;
  setApiBaseUrl(options: { url: string }): Promise<void>;
  getConnectionConfiguration(): Promise<{ token: string | null; baseUrl: string | null }>;
  getPendingShares(): Promise<{ items: PendingShareItem[] }>;
  clearPendingShares(): Promise<void>;
}

// Register native plugin for Android
const NativeBridge = registerPlugin<NativeBridgePlugin>('NativeBridge');

export class NativeSessionBridge {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static async syncSessionToken(token: string | null): Promise<void> {
    if (this.isNative()) {
      try {
        if (token) {
          await NativeBridge.setSessionToken({ token });
        } else {
          await NativeBridge.clearSessionToken();
        }
      } catch (e) {
        console.warn('NativeBridge setSessionToken failed:', e);
      }
    }
  }

  static async syncApiBaseUrl(url: string): Promise<void> {
    if (this.isNative()) {
      try {
        await NativeBridge.setApiBaseUrl({ url });
      } catch (e) {
        console.warn('NativeBridge setApiBaseUrl failed:', e);
      }
    }
  }

  static async getPendingShares(): Promise<PendingShareItem[]> {
    if (this.isNative()) {
      try {
        const res = await NativeBridge.getPendingShares();
        return res.items || [];
      } catch (e) {
        console.warn('NativeBridge getPendingShares failed:', e);
      }
    }
    // Browser fallback
    const raw = localStorage.getItem('mybookmark_pending_shares');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static async clearPendingShares(): Promise<void> {
    if (this.isNative()) {
      try {
        await NativeBridge.clearPendingShares();
      } catch (e) {
        console.warn('NativeBridge clearPendingShares failed:', e);
      }
    }
    localStorage.removeItem('mybookmark_pending_shares');
  }
}
