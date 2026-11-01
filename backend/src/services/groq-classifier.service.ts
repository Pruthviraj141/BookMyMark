import { z } from 'zod';

export const aiClassificationSchema = z.object({
  category: z.string().nullable().optional().transform((v) => v || 'Other'),
  topic: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional().transform((v) => v || []),
  content_type: z.string().nullable().optional().transform((v) => v || 'general'),
  summary: z.string().nullable().optional().transform((v) => v || ''),
  confidence: z.number().nullable().optional().transform((v) => (typeof v === 'number' ? Math.min(1, Math.max(0, v)) : 0.8)),
  insufficient_content: z.boolean().nullable().optional().transform((v) => Boolean(v))
});

export type AiClassificationOutput = z.infer<typeof aiClassificationSchema>;

const VALID_CATEGORIES = [
  'Knowledge',
  'Funny',
  'Entertainment',
  'Education',
  'Technology',
  'Programming',
  'Motivation',
  'Lifestyle',
  'Fitness',
  'News',
  'Inspiration',
  'Travel',
  'Other'
];

export interface ClassificationContext {
  title?: string | null;
  description?: string | null;
  sharedText?: string | null;
  extractedText?: string | null;
  authorName?: string | null;
  platform?: string | null;
}

export class GroqClassifierService {
  // In-memory fingerprint cache to prevent duplicate AI calls for identical text
  private static cache = new Map<string, AiClassificationOutput>();

  /**
   * Fast, low-token text-only classifier for SAVR bookmarks.
   * Limits output to ~150 tokens. Uses structured JSON.
   */
  static async classify(
    context: ClassificationContext,
    groqApiKey: string,
    groqModel: string = 'openai/gpt-oss-20b'
  ): Promise<AiClassificationOutput> {
    const textPieces = [
      context.title,
      context.description,
      context.sharedText,
      context.extractedText,
      context.authorName ? `Creator: ${context.authorName}` : null
    ]
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());

    const combinedText = textPieces.join('\n\n');
    // Strip URLs and tracking noise
    const nonUrlText = combinedText.replace(/https?:\/\/[^\s]+/gi, '').trim();

    // If literally no text could be gathered, return a sensible default without marking failure
    if (!nonUrlText || nonUrlText.length < 3) {
      const defaultTag = context.platform
        ? context.platform.charAt(0).toUpperCase() + context.platform.slice(1)
        : 'Bookmark';
      return {
        category: 'Other',
        topic: 'Uncategorized',
        tags: [defaultTag],
        content_type: context.platform === 'instagram' ? 'reel' : 'general',
        summary: `Saved ${context.platform || 'link'}`,
        confidence: 0.5,
        insufficient_content: false
      };
    }

    // Check in-memory fingerprint cache
    const fingerprint = `${context.platform || ''}:${nonUrlText.slice(0, 300)}`;
    const cached = this.cache.get(fingerprint);
    if (cached) {
      return cached;
    }

    if (!groqApiKey) {
      return {
        category: 'Other',
        topic: 'Uncategorized',
        tags: ['Bookmark'],
        content_type: 'general',
        summary: 'Saved bookmark (Groq API key not set).',
        confidence: 0.5,
        insufficient_content: false
      };
    }

    const systemPrompt = `You are a fast, expert JSON classifier for personal bookmarks in BookMyMark. Think concisely.
Analyze the content evidence (including title, creator, captions, hashtags, descriptions, and keywords) and return a valid JSON object matching this exact schema:
{
  "category": "Knowledge | Programming | Technology | Funny | Fitness | Entertainment | Lifestyle | Travel | Motivation | News | Inspiration | Education | Other",
  "topic": "string (specific subject/topic e.g. Boxing, React 19, Quantum Physics, Roman History)",
  "tags": ["3 to 5 string tags without #"],
  "content_type": "reel | tweet | video | article | educational | general",
  "summary": "1 direct, on-point sentence explaining the key point or insight directly.",
  "confidence": 0.9,
  "insufficient_content": false
}
CRITICAL RULES:
1. Always identify SPECIFIC topics (e.g. Boxing, React 19, Quantum Physics, Standup Comedy, Roman Empire) rather than generic category names.
2. Infer topic and category directly from the title, description, and keywords. A clear title or shared note is sufficient evidence for classification.
3. Extract 3 to 5 specific tags (1-2 words each, without '#').
4. For summary: Get directly to the point. NEVER write meta-commentary like 'A tweet saying...', 'A reel saying...', 'A video showing...', 'This reel shows...', or 'The post discusses...'. State the actual insight directly.
5. Only set insufficient_content: true if literally no usable text or subject can be identified.
6. Output pure JSON object only. No markdown formatting.`;

    const userPrompt = `Content evidence:\n${nonUrlText.slice(0, 1200)}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Groq HTTP ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const json: any = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Groq');
      }

      const parsed = JSON.parse(content);
      const validated = aiClassificationSchema.parse(parsed);

      const normalizedCat =
        VALID_CATEGORIES.find(
          (c) => c.toLowerCase() === (validated.category || '').trim().toLowerCase()
        ) || 'Other';

      const cleanTags = Array.from(
        new Set(
          validated.tags
            .map((t) => t.trim().replace(/^#/, ''))
            .filter((t) => t.length > 0 && t.length < 30)
        )
      ).slice(0, 5);

      const result: AiClassificationOutput = {
        category: normalizedCat,
        topic: validated.topic || null,
        tags: cleanTags,
        content_type: validated.content_type || 'general',
        summary: validated.summary || '',
        confidence: Math.min(1, Math.max(0, validated.confidence)),
        insufficient_content: validated.insufficient_content || false
      };

      // Store in memory cache (limit cache size to 100 entries)
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(fingerprint, result);

      return result;
    } catch (err: any) {
      console.error('Groq classification failed:', err?.message || err);
      // Re-throw so worker marks ai_status: 'failed' for safe retry rather than false insufficient_content
      throw err;
    }
  }
}
