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
  username: string;
  password_hash: string;
  created_at: string;
}

export interface UserResponse {
  id: string;
  username: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  normalized_url: string;
  platform: Platform;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  author_name: string | null;
  shared_text: string | null;
  extracted_text: string | null;
  summary: string | null;
  category: string | null;
  tags_json: string; // JSON encoded string array
  content_type: string | null;
  ai_status: AiStatus;
  ai_confidence: number | null;
  ai_error: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookmarkResponse extends Omit<Bookmark, 'tags_json'> {
  tags: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  is_duplicate?: boolean;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AiClassificationResult {
  category: string;
  tags: string[];
  content_type: string;
  summary: string;
  confidence: number;
  insufficient_content: boolean;
}

export interface ExtractedMetadata {
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  author_name?: string | null;
  extracted_text?: string | null;
  canonical_url?: string | null;
}

export interface AppVariables {
  userId: string;
  username: string;
}

export interface AppEnv {
  Variables: AppVariables;
}

