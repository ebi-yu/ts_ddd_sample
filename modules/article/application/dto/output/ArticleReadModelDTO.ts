import { z } from 'zod';

export const ArticleReadModelDtoSchema = z.object({
  id: z.uuid(),
  title: z.string().nullable(),
  content: z.string().nullable(),
  authorId: z.uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  version: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
});

export type ArticleReadModelDTO = z.infer<typeof ArticleReadModelDtoSchema>;
