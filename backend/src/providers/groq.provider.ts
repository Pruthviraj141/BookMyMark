import { z } from 'zod';
import { env } from '../config/env.js';
import type { AiClassificationResult } from '../types/index.js';

export const aiClassificationSchema = z.object({
  category: z.string().nullable().optional().transform((v) => v || 'Other'),
  tags: z.array(z.string()).nullable().optional().transform((v) => v || []),
  content_type: z.string().nullable().optional().transform((v) => v || 'general'),
  summary: z.string().nullable().optional().transform((v) => v || ''),
  confidence: z.number().nullable().optional().transform((v) => (typeof v === 'number' ? Math.min(1, Math.max(0, v)) : 0.8)),
  insufficient_content: z.boolean().nullable().optional().transform((v) => Boolean(v))
});

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

export interface ClassificationInput {
  title?: string | null;
  description?: string | null;
  sharedText?: string | null;
  extractedText?: string | null;
  authorName?: string | null;
}

export class GroqProvider {
  /**
   * Classifies content using Groq LLM API.
   * Uses standard fetch for portability and sets an execution timeout.
   */
  static async classify(input: ClassificationInput): Promise<AiClassificationResult> {
    // Check if there is meaningful content
    const textPieces = [
      input.title,
      input.description,
      input.sharedText,
      input.extractedText,
      input.authorName
    ]
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());

    const combinedText = textPieces.join('\n\n');
    const nonUrlText = combinedText.replace(/https?:\/\/[^\s]+/gi, '').trim();

    // Rule: The AI must NOT classify from a URL alone and needs sufficient content.
    if (!nonUrlText || nonUrlText.length < 15) {
      return {
        category: 'Other',
        tags: [],
        content_type: 'general',
        summary: 'Insufficient content provided for AI classification.',
        confidence: 0,
        insufficient_content: true
      };
    }

    if (!env.GROQ_API_KEY) {
      return {
        category: 'Other',
        tags: [],
        content_type: 'general',
        summary: 'Groq API key not configured.',
        confidence: 0,
        insufficient_content: true
      };
    }

    const systemPrompt = `You are the content analyzer for MyBookMark, an intelligent personal bookmark library.
Analyze the provided content evidence (title, description, shared text, or post content) and output a valid JSON object.
NEVER invent or hallucinate facts that are not supported by the evidence.
If there is not enough evidence to determine what the content is about, set "insufficient_content": true.

Allowed Categories (choose the best matching one):
${VALID_CATEGORIES.join(', ')}

Output JSON format strictly:
{
  "category": "one of the allowed categories",
  "tags": ["3 to 6 concise, relevant topic tags"],
  "content_type": "short descriptor like educational, tutorial, news, entertainment, reel, discussion",
  "summary": "1-2 sentence concise neutral summary of what the content is about",
  "confidence": 0.0 to 1.0,
  "insufficient_content": false
}`;

    const userPrompt = `Content evidence to analyze:
${combinedText.slice(0, 4000)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Groq API returned HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
      }

      const json = await response.json();
      const rawContent = json.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error('Groq returned empty response content');
      }

      const parsed = JSON.parse(rawContent);
      const validated = aiClassificationSchema.parse(parsed);

      // Normalize category to allowed list if matched loosely
      const normalizedCat =
        VALID_CATEGORIES.find(
          (c) => c.toLowerCase() === validated.category.trim().toLowerCase()
        ) || 'Other';

      // Clean tags: take at most 6, clean whitespace, remove duplicates
      const cleanTags = Array.from(
        new Set(
          validated.tags
            .map((t) => t.trim().replace(/^#/, ''))
            .filter((t) => t.length > 0 && t.length < 30)
        )
      ).slice(0, 6);

      return {
        category: normalizedCat,
        tags: cleanTags,
        content_type: validated.content_type || 'general',
        summary: validated.summary || '',
        confidence: Math.min(1, Math.max(0, validated.confidence)),
        insufficient_content: validated.insufficient_content || false
      };
    } catch (err: any) {
      console.error('Groq AI classification error:', err.message || err);
      throw err;
    }
  }
}
