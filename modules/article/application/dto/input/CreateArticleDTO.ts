import { z } from 'zod';

export const CreateArticleDto = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  authorId: z.uuid('Author ID must be a valid UUID'),
});

export type CreateArticleDtoType = z.infer<typeof CreateArticleDto>;
