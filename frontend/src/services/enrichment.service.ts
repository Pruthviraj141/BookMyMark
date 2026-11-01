import { getApiBaseUrl } from '../config/api.config.js';

export interface EnrichmentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class EnrichmentService {
  /**
   * Calls Cloudflare Worker to trigger background AI classification & metadata extraction.
   * RLS and user ownership are verified by the Worker using the user's Supabase JWT.
   */
  static async triggerEnrichment(
    bookmarkId: string,
    token: string,
    sharedText?: string | null
  ): Promise<EnrichmentResponse> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/bookmarks/${bookmarkId}/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sharedText }),
        signal: AbortSignal.timeout(8000)
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok || res.status === 202) {
        return { success: true, message: json.message };
      }
      return { success: false, error: json.error || `HTTP ${res.status}` };
    } catch (err: any) {
      console.warn('AI enrichment trigger error:', err?.message || err);
      return { success: false, error: err?.message || 'Network error' };
    }
  }
}
