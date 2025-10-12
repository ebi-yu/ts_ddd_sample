import { z } from 'zod';

export const GetArticlesQueryDto = z.object({
  ids: z
    .array(z.uuid())
    .min(1)
    .or(z.uuid().transform((id) => [id])),
});

export type GetArticlesQueryDto = z.infer<typeof GetArticlesQueryDto>;
