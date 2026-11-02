export type CaptureSourceType = 'page' | 'link' | 'video';

export type PlatformType = 'youtube' | 'x' | 'reddit' | 'instagram' | 'website';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  original_url: string;
  normalized_url: string;
  platform: PlatformType | string;
  title: string | null;
  description?: string | null;
  shared_text?: string | null;
  extracted_text?: string | null;
  summary?: string | null;
  category?: string | null;
  tags?: string[];
  content_type?: string | null;
  thumbnail_url?: string | null;
  ai_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'insufficient_content';
  ai_confidence?: number | null;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
  is_favorite?: boolean;
  notes?: string | null;
}

export interface LocalCaptureDraft {
  id: string;
  url: string;
  title: string;
  sourceType: CaptureSourceType;
  sourcePageUrl?: string;
  platform: PlatformType;
  faviconUrl?: string;
  domain: string;
  capturedAt: number;
}

export interface CaptureResult {
  success: boolean;
  capture?: LocalCaptureDraft;
  isDuplicate?: boolean;
  error?: string;
}

export interface PendingSaveOperation {
  id: string;
  url: string;
  title?: string;
  sourceType: CaptureSourceType;
  sourcePageUrl?: string;
  faviconUrl?: string;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface SaveBookmarkResponse {
  success: boolean;
  isDuplicate?: boolean;
  bookmark?: Bookmark;
  error?: string;
  enrichmentTriggered?: boolean;
  isPendingOffline?: boolean;
}

export interface ActiveTabInfo {
  url: string;
  title: string;
  faviconUrl?: string;
  domain: string;
  isValid: boolean;
  invalidReason?: string;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user: AppUser | null;
  token?: string | null;
}

// Runtime message types
export type ExtensionMessage =
  | { type: 'AUTH_GET_STATUS' }
  | { type: 'AUTH_SIGN_IN' }
  | { type: 'AUTH_SIGN_OUT' }
  | {
      type: 'BOOKMARK_SAVE';
      payload: {
        url: string;
        title?: string;
        sourceType: CaptureSourceType;
        sourcePageUrl?: string;
        faviconUrl?: string;
      };
    }
  | { type: 'BOOKMARK_LIST_RECENT'; payload?: { limit?: number } }
  | { type: 'PENDING_GET_COUNT' }
  | { type: 'PENDING_PROCESS_ALL' };
