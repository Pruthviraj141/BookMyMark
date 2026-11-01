import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import { isValidHttpUrl, isSafePublicUrl } from './utils/url.utils.js';
import { PlatformService } from './services/platform.service.js';
import { ExtractorService } from './services/extractor.service.js';
import { GroqClassifierService } from './services/groq-classifier.service.js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_JWKS_URL: string;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  CORS_ORIGINS?: string;
}

type Variables = {
  userId: string;
  userToken: string;
  supabase: SupabaseClient;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Cache for JWKS to avoid re-fetching on every request
let cachedJWKS: any = null;
let cachedJWKSUrl: string | null = null;

function getJWKS(jwksUrl: string) {
  if (cachedJWKS && cachedJWKSUrl === jwksUrl) {
    return cachedJWKS;
  }
  cachedJWKS = createRemoteJWKSet(new URL(jwksUrl));
  cachedJWKSUrl = jwksUrl;
  return cachedJWKS;
}

// 1. CORS Middleware
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '*';
      if (
        origin.startsWith('http://localhost') ||
        origin.startsWith('capacitor://') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        return origin;
      }
      return c.env.CORS_ORIGINS && c.env.CORS_ORIGINS !== '*' ? c.env.CORS_ORIGINS : origin;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With', 'apikey'],
    exposeHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400
  });
  return corsMiddleware(c, next);
});

// 2. Health check (Public)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'savr-api',
    time: new Date().toISOString(),
    cloudflare: true
  });
});

// 3. Link Preview Endpoint (Display-only, Cloudflare Edge Cached)
app.get('/api/link-preview', async (c) => {
  const url = c.req.query('url');
  if (!url || !isValidHttpUrl(url) || !isSafePublicUrl(url)) {
    return c.json({ success: false, error: 'Invalid URL' }, 400);
  }

  // 1. Construct stable cache key derived from normalized public URL (no auth tokens)
  const cleanUrl = url.trim().replace(/\/$/, '');
  const cacheKeyUrl = new URL(c.req.url);
  cacheKeyUrl.search = `?url=${encodeURIComponent(cleanUrl)}`;
  const cacheKey = new Request(cacheKeyUrl.toString(), { method: 'GET' });

  // 2. Check Cloudflare default edge cache
  let cache: any = null;
  try {
    // @ts-ignore
    cache = typeof caches !== 'undefined' ? caches.default : null;
    if (cache) {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const res = new Response(cachedResponse.body, cachedResponse);
        res.headers.set('X-Cache', 'HIT');
        return res;
      }
    }
  } catch (e) {
    console.warn('Cache lookup error:', e);
  }

  // 3. Extract metadata
  try {
    const metadata = await ExtractorService.extract(url);
    const body = {
      success: true,
      data: {
        platform: metadata.platform,
        title: metadata.title,
        description: metadata.description,
        imageUrl: metadata.thumbnail_url || null
      }
    };

    const response = c.json(body, 200, {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
      'X-Cache': 'MISS'
    });

    if (cache) {
      c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  } catch {
    const fallbackBody = {
      success: true,
      data: {
        platform: PlatformService.detectPlatform(url),
        title: null,
        description: null,
        imageUrl: null
      }
    };
    return c.json(fallbackBody, 200, {
      'Cache-Control': 'public, max-age=300',
      'X-Cache': 'MISS'
    });
  }
});

// 4. Authentication Middleware for protected routes (Enrichment only)
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return c.json({ error: 'Empty bearer token' }, 401);
  }

  try {
    let userId: string | null = null;

    // Verify token with Supabase JWKS
    try {
      const JWKS = getJWKS(c.env.SUPABASE_JWKS_URL);
      const { payload } = await jwtVerify(token, JWKS);
      userId = payload.sub as string;
    } catch {
      // Fallback verification: use Supabase Auth getUser endpoint
      const tempClient = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { data: userData, error: userError } = await tempClient.auth.getUser(token);
      if (userError || !userData?.user) {
        return c.json({ error: 'Invalid or expired authentication token' }, 401);
      }
      userId = userData.user.id;
    }

    if (!userId) {
      return c.json({ error: 'Failed to extract user ID from token' }, 401);
    }

    // Create user-scoped Supabase client that inherits the user's RLS policies
    const userClient = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    c.set('userId', userId);
    c.set('userToken', token);
    c.set('supabase', userClient);

    await next();
  } catch (err: any) {
    return c.json({ error: 'Authentication verification failed: ' + (err?.message || 'unknown') }, 401);
  }
};

// 5. POST /api/bookmarks/:id/enrich - AI Enrichment Endpoint (Only AI processing responsibility)
const enrichSchema = z.object({
  sharedText: z.string().optional().nullable(),
  title: z.string().optional().nullable()
}).optional();

async function handleEnrich(c: any) {
  const supabase = c.get('supabase') as SupabaseClient;
  const userId = c.get('userId') as string;
  const bookmarkId = c.req.param('id');

  const body = await c.req.json().catch(() => ({}));
  const parsed = enrichSchema?.safeParse(body);
  const sharedText = parsed && parsed.success ? parsed.data?.sharedText : undefined;

  // 1. Fetch bookmark under user's RLS context to confirm ownership
  const { data: bookmark, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('id', bookmarkId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !bookmark) {
    return c.json({ error: 'Bookmark not found or unauthorized' }, 404);
  }

  // 2. Return clear accepted response immediately
  const adminClient = c.env.SUPABASE_SECRET_KEY
    ? createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : supabase;

  c.executionCtx.waitUntil(
    enrichBookmark(
      bookmark.id,
      userId,
      bookmark.original_url,
      sharedText || bookmark.shared_text,
      adminClient,
      c.env
    )
  );

  return c.json({
    success: true,
    message: 'AI enrichment accepted and queued',
    bookmarkId: bookmark.id
  }, 202);
}

app.post('/api/bookmarks/:id/enrich', requireAuth, handleEnrich);
// Backward compatibility alias for any existing caller
app.post('/api/bookmarks/:id/reprocess', requireAuth, handleEnrich);

// Helper for background text enrichment (No image storage, text-only Groq, 160 max tokens)
async function enrichBookmark(
  bookmarkId: string,
  userId: string,
  url: string,
  sharedText: string | null | undefined,
  supabase: SupabaseClient,
  env: Env
) {
  try {
    // 1. Mark as processing and check for existing manual edits
    const { data: currentBookmark } = await supabase
      .from('bookmarks')
      .select('category, tags')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .maybeSingle();

    const hasCustomCategory =
      currentBookmark?.category &&
      currentBookmark.category !== 'Other' &&
      currentBookmark.category !== 'Uncategorized';
    const hasCustomTags =
      Array.isArray(currentBookmark?.tags) && currentBookmark.tags.length > 0;

    await supabase
      .from('bookmarks')
      .update({ ai_status: 'processing' })
      .eq('id', bookmarkId)
      .eq('user_id', userId);

    // 2. Extract textual metadata only (no image saving)
    const metadata = await ExtractorService.extract(url, sharedText);

    // 3. Classify with low-token text-only Groq model
    const aiResult = await GroqClassifierService.classify(
      {
        title: metadata.title,
        description: metadata.description || sharedText,
        sharedText: sharedText,
        extractedText: metadata.extracted_text,
        authorName: metadata.author_name,
        platform: metadata.platform
      },
      env.GROQ_API_KEY,
      env.GROQ_MODEL
    );

    // 4. Update bookmark in Supabase, preserving any manual tags/categories
    await supabase
      .from('bookmarks')
      .update({
        title: metadata.title || undefined,
        description: metadata.description || undefined,
        extracted_text: metadata.extracted_text || undefined,
        category: hasCustomCategory ? currentBookmark.category : aiResult.category,
        tags: hasCustomTags ? currentBookmark.tags : aiResult.tags,
        content_type: aiResult.content_type,
        summary: aiResult.summary,
        ai_status: aiResult.insufficient_content ? 'insufficient_content' : 'completed',
        ai_confidence: aiResult.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookmarkId)
      .eq('user_id', userId);
  } catch (err: any) {
    console.error(`Enrichment failed for ${bookmarkId}:`, err?.message || err);
    try {
      await supabase
        .from('bookmarks')
        .update({
          ai_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookmarkId)
        .eq('user_id', userId);
    } catch {
      // Ignore background failure
    }
  }
}

export default app;
