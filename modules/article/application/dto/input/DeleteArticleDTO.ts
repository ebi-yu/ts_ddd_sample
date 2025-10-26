import { z } from 'zod';

export const DeleteArticleDto = z.object({
  id: z.string().uuid('Article ID must be a valid UUID'),
});

export type DeleteArticleDtoType = z.infer<typeof DeleteArticleDto>;
