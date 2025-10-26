import { createRoute } from '@hono/zod-openapi';
import { withOpenApiObject } from '@shared/utils/OpenAPI.ts';
import { DeleteArticleDto } from 'modules/article/application/dto/input/DeleteArticleDTO.ts';

const { schema: DeleteArticleParamsSchema } = withOpenApiObject(DeleteArticleDto, {
  refId: 'DeleteArticleParams',
  object: {
    description: '記事削除のパスパラメータ',
    example: {
      id: 'c1f7c1cb-4d62-4ec0-b8db-0cd6bb781050',
    },
  },
  properties: {
    id: { example: 'c1f7c1cb-4d62-4ec0-b8db-0cd6bb781050' },
  },
});

export const deleteArticleRouteSchema = createRoute({
  method: 'delete',
  path: '/articles/:id',
  request: {
    params: DeleteArticleParamsSchema,
  },
  responses: {
    204: {
      description: '記事の削除に成功',
    },
    404: {
      description: '記事が見つかりません',
    },
  },
});
