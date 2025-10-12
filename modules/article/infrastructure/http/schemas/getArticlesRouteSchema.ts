import { createRoute, z } from '@hono/zod-openapi';
import { GetArticlesQueryDto } from 'modules/article/application/dto/input/GetArticlesQueryDto.ts';
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

const { schema: ArticleReadModelSchema } = withOpenApiObject(ArticleReadModelDtoSchema, {
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
});

const { schema: GetArticlesQuerySchema } = withOpenApiObject(GetArticlesQueryDto, {
  refId: 'GetArticlesQuery',
  object: {
    description: '記事取得クエリパラメータのスキーマ',
    example: {
      ids: ['c1f7c1cb-4d62-4ec0-b8db-0cd6bb781050'],
    },
  },
  properties: {
    ids: { example: ['c1f7c1cb-4d62-4ec0-b8db-0cd6bb781050'] },
  },
});

export const getArticlesRouteSchema = createRoute({
  method: 'get',
  path: '/articles',
  request: {
    query: GetArticlesQuerySchema,
  },
  responses: {
    200: {
      description: '記事の取得に成功',
      content: {
        'application/json': {
          schema: z.array(ArticleReadModelSchema).openapi({
            example: [articleExample],
          }),
        },
      },
    },
    400: {
      description: 'リクエストパラメータが不正',
    },
    409: {
      description: '同じ著者IDとタイトルの記事が既に存在します',
    },
  },
});
