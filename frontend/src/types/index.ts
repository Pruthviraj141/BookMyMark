export type Platform =
  | 'instagram'
  | 'x'
  | 'youtube'
  | 'reddit'
  | 'tiktok'
  | 'website'
  | 'unknown';

export type AiStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'insufficient_content';

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  original_url?: string;
  normalized_url: string;
  platform: Platform;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  cover_storage_path?: string | null;
  cover_source?: string | null;
  cover_status?: string | null;
  author_name?: string | null;
  shared_text?: string | null;
  extracted_text?: string | null;
  summary: string | null;
  category: string | null;
  tags: string[];
  content_type?: string | null;
  ai_status: AiStatus;
  ai_confidence?: number | null;
  ai_evidence?: string | null;
  ai_error?: string | null;
  notes?: string | null;
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  is_duplicate?: boolean;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}
