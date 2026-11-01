import { GroqProvider } from '../providers/groq.provider.js';
import { BookmarkRepository } from '../repositories/bookmark.repository.js';
import type { Bookmark, AiClassificationResult } from '../types/index.js';

export class AiService {
  /**
   * Processes a bookmark with Groq AI classification and updates SQLite record.
   */
  static async processBookmark(
    bookmarkId: string,
    userId: string,
    customProvider?: typeof GroqProvider
  ): Promise<Bookmark | null> {
    const current = BookmarkRepository.findById(bookmarkId, userId);
    if (!current) return null;

    // Set status to processing
    BookmarkRepository.update(bookmarkId, userId, {
      ai_status: 'processing',
      ai_error: null
    });

    const provider = customProvider || GroqProvider;

    try {
      const result: AiClassificationResult = await provider.classify({
        title: current.title,
        description: current.description,
        sharedText: current.shared_text,
        extractedText: current.extracted_text,
        authorName: current.author_name
      });

      if (result.insufficient_content) {
        return BookmarkRepository.update(bookmarkId, userId, {
          ai_status: 'insufficient_content',
          ai_confidence: 0,
          summary: current.summary || result.summary || 'Insufficient content for AI analysis.'
        });
      }

      // Check current tags to preserve if already manually edited
      let finalTagsJson = current.tags_json;
      if (!current.tags_json || current.tags_json === '[]') {
        finalTagsJson = JSON.stringify(result.tags);
      } else {
        // Merge without duplicates
        try {
          const existingTags: string[] = JSON.parse(current.tags_json);
          const merged = Array.from(new Set([...existingTags, ...result.tags]));
          finalTagsJson = JSON.stringify(merged);
        } catch {
          finalTagsJson = JSON.stringify(result.tags);
        }
      }

      return BookmarkRepository.update(bookmarkId, userId, {
        category: current.category || result.category,
        tags_json: finalTagsJson,
        content_type: current.content_type || result.content_type,
        summary: current.summary || result.summary,
        ai_status: 'completed',
        ai_confidence: result.confidence,
        ai_error: null
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to classify bookmark';
      return BookmarkRepository.update(bookmarkId, userId, {
        ai_status: 'failed',
        ai_error: errorMessage
      });
    }
  }
}
