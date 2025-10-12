import { createRoute, z } from '@hono/zod-openapi';
import { GetArticlesQueryDtoSchema } from 'modules/article/application/dto/input/GetArticlesQueryDto.ts';
import { ArticleReadModelDtoSchema } from 'modules/article/application/dto/output/ArticleReadModelDTO.ts';
import { withOpenApiObject } from 'modules/shared/infrastructure/openapi/schema.ts';

const articleExample = {
  id: 'c1f7c1cb-4d62-4ec0-b8db-0cd6bb781050',
  title: 'Domain-Driven Design 入門',
  content: 'ドメイン駆動設計の基本コンセプトを解説します。',
  authorId: '550e8400-e29b-41d4-a716-446655440000',
  status: 'draft',
  version: 3,
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-01-05T10:00:00.000Z',
  publishedAt: '2024-01-10T10:00:00.000Z',
} as const;

const { schema: ArticleReadModelSchema, example: articleSchemaExample } = withOpenApiObject(
  ArticleReadModelDtoSchema,
  {
    refId: 'ArticleReadModel',
    object: {
      description: '記事読み取りモデルのスキーマ',
      example: articleExample,
    },
    properties: {
      id: { example: articleExample.id },
      title: { example: articleExample.title },
      content: { example: articleExample.content },
      authorId: { example: articleExample.authorId },
      status: { example: articleExample.status },
      version: { example: articleExample.version },
      createdAt: { example: articleExample.createdAt },
      updatedAt: { example: articleExample.updatedAt },
      publishedAt: { example: articleExample.publishedAt },
    },
  },
);

const articleResponseExample =
  (articleSchemaExample as typeof articleExample | undefined) ?? articleExample;

export const getArticlesRoute = createRoute({
  method: 'get',
  path: '/articles',
  request: {
    query: z
      .object({
        'ids[]': GetArticlesQueryDtoSchema.shape.ids.openapi({
          example: ['c1f7c1cb-4d62-4ec0-b8db-0cd6bb781050'],
          param: {
            name: 'ids[]',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
          },
        }),
      })
      .openapi('GetArticlesQuery', {
        description: '取得対象の記事 ID 配列',
      }),
  },
  responses: {
    200: {
      description: '記事の取得に成功',
      content: {
        'application/json': {
          schema: z.array(ArticleReadModelSchema).openapi({
            example: [articleResponseExample],
          }),
        },
      },
    },
    400: {
      description: 'リクエストパラメータが不正',
    },
  },
});
