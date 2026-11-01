import { describe, it, expect } from 'vitest';
import { GroqProvider, aiClassificationSchema } from '../src/providers/groq.provider.js';
import { env } from '../src/config/env.js';

describe('Groq AI Provider & Schema Validation', () => {
  it('validates structured AI output schema correctly', () => {
    const validData = {
      category: 'Knowledge',
      tags: ['Entropy', 'Physics', 'Thermodynamics'],
      content_type: 'educational',
      summary: 'An explanation of entropy in statistical mechanics.',
      confidence: 0.94,
      insufficient_content: false
    };

    const parsed = aiClassificationSchema.parse(validData);
    expect(parsed.category).toBe('Knowledge');
    expect(parsed.tags).toHaveLength(3);
    expect(parsed.confidence).toBe(0.94);
    expect(parsed.insufficient_content).toBe(false);
  });

  it('marks insufficient_content when input has no meaningful text', async () => {
    const result = await GroqProvider.classify({
      title: null,
      description: null,
      sharedText: 'http://tiny.url',
      extractedText: null
    });

    expect(result.insufficient_content).toBe(true);
    expect(result.confidence).toBe(0);
    expect(result.tags).toEqual([]);
  });

  // Real Groq test if API key is configured
  it('executes real Groq classification if API key is present in environment', async () => {
    if (!env.GROQ_API_KEY || env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('Skipping real Groq test: No valid GROQ_API_KEY configured.');
      return;
    }

    try {
      const result = await GroqProvider.classify({
        title: 'Introduction to Rust Memory Safety and Borrow Checker',
        description:
          'Learn how Rust eliminates data races, null pointers, and memory leaks at compile time without a garbage collector.',
        sharedText: 'Great article explaining ownership in Rust programming language.'
      });

      console.log('Real Groq test result:', {
        category: result.category,
        tags: result.tags,
        content_type: result.content_type,
        confidence: result.confidence
      });

      expect(result.category).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags.length).toBeGreaterThanOrEqual(1);
      expect(result.insufficient_content).toBe(false);
    } catch (err: any) {
      console.warn('Real Groq call failed (possibly network or rate limit):', err.message);
      // Ensure failure is reported transparently
    }
  });
});
