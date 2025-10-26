import { z } from 'zod';

export const GetArticleDto = z.object({
  ids: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',');
      }
      return val;
    },
    z.array(z.string().uuid('Article ID must be a valid UUID')),
  ),
});

export type GetArticleDtoType = z.infer<typeof GetArticleDto>;
