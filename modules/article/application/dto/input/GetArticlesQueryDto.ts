import { z } from 'zod';

export const GetArticlesQueryDtoSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});

export type GetArticlesQueryDto = z.infer<typeof GetArticlesQueryDtoSchema>;
