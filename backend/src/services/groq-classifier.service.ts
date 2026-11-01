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

    // Insufficient evidence check: do not hallucinate or guess from URL alone
    if (!nonUrlText || nonUrlText.length < 15) {
      return {
        category: 'Other',
        topic: null,
        tags: [],
        content_type: 'general',
        summary: 'Insufficient content provided for AI classification.',
        confidence: 0,
        insufficient_content: true
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
        topic: null,
        tags: [],
        content_type: 'general',
        summary: 'Groq API key not configured.',
        confidence: 0,
        insufficient_content: true
      };
    }

    const systemPrompt = `You are a high-speed, token-efficient text classifier for SAVR personal bookmarks.
Analyze the provided text and output strict JSON with NO Markdown or explanation.
Allowed Categories: ${VALID_CATEGORIES.join(', ')}.

Output JSON:
{
  "category": "one of the allowed categories",
  "topic": "specific topic name",
  "tags": ["3 to 5 concise topic tags"],
  "content_type": "short descriptor e.g. educational, reel, news, tutorial",
  "summary": "1 concise sentence summary of what this content is about",
  "confidence": 0.0 to 1.0,
  "insufficient_content": false
}

If the text contains no meaningful subject, return {"insufficient_content": true, "category": "Other", "tags": [], "summary": "Insufficient content", "confidence": 0}`;

    const userPrompt = `Content evidence:\n${nonUrlText.slice(0, 1000)}`;

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
          max_tokens: 160
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Groq HTTP ${response.status}: ${errorText.slice(0, 150)}`);
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
      return {
        category: 'Other',
        topic: null,
        tags: [],
        content_type: 'general',
        summary: 'Classification could not be completed.',
        confidence: 0,
        insufficient_content: true
      };
    }
  }
}
