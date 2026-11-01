const STORAGE_KEY = 'savr_api_base_url';
export const DEFAULT_API_URL = 'https://savr-api.markyourday.workers.dev';

export function getApiBaseUrl(): string {
  // 1. Check user-configured override in localStorage
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved.trim()) {
    const clean = saved.trim().replace(/\/+$/, '');
    // Ignore legacy local IPs
    if (!clean.includes('192.168.') && !clean.includes('10.0.2.2')) {
      return clean;
    }
  }

  // 2. Check environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, clean);
}
