const STORAGE_KEY = 'mybookmark_api_base_url';

export function getApiBaseUrl(): string {
  // 1. Check user-configured override in localStorage
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved.trim()) {
    const clean = saved.trim().replace(/\/+$/, '');
    if (clean.includes('localhost') || clean.includes('127.0.0.1') || clean.includes('10.0.2.2')) {
      return 'http://192.168.1.11:3000';
    }
    return clean;
  }

  // 2. Check environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Sensible defaults based on runtime environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Android Emulator host loopback
    if (hostname === '10.0.2.2') {
      return 'http://10.0.2.2:3000';
    }
    // If accessed via LAN IP directly
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000`;
    }
  }

  return 'http://192.168.1.11:3000';
}

export function setApiBaseUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, clean);
}
