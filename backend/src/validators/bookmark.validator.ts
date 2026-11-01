import { z } from 'zod';

export const createBookmarkSchema = z
  .object({
    url: z.string().optional().nullable(),
    sharedText: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  })
  .refine(
    (data) => (data.url && data.url.trim().length > 0) || (data.sharedText && data.sharedText.trim().length > 0),
    {
      message: 'Either url or sharedText must be provided'
    }
  );

export const updateBookmarkSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  thumbnail_url: z.string().optional().nullable()
});

export const listBookmarksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  platform: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  content_type: z.string().optional(),
  ai_status: z.string().optional()
});

export type CreateBookmarkSchemaInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkSchemaInput = z.infer<typeof updateBookmarkSchema>;
export type ListBookmarksQueryInput = z.infer<typeof listBookmarksQuerySchema>;
