import { createRoute } from '@hono/zod-openapi';
import { withOpenApiObject } from '@shared/utils/OpenAPI.ts';
import { CreateArticleDto } from 'modules/article/application/dto/input/CreateArticleDTO.ts';
import { z } from 'zod';

// 記事作成リクエストボディのスキーマ
const { schema: CreateArticleRequestSchema } = withOpenApiObject(CreateArticleDto, {
  refId: 'CreateArticleRequest',
  object: {
    description: '記事作成リクエストボディ',
    example: {
      title: 'Domain-Driven Design 入門',
      content: 'ドメイン駆動設計の基本を紹介します。',
      authorId: '550e8400-e29b-41d4-a716-446655440000',
    },
  },
  properties: {
    title: { example: 'Domain-Driven Design 入門' },
    content: { example: 'ドメイン駆動設計の基本を紹介します。' },
    authorId: { example: '550e8400-e29b-41d4-a716-446655440000' },
  },
});

export const postArticleRouteSchema = createRoute({
  method: 'post',
  path: '/articles',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateArticleRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '記事の作成に成功',
      content: {
        'application/json': {
          schema: {
            id: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
          },
        },
      },
    },
    400: {
      description: 'リクエストボディが不正',
    },
  },
});
