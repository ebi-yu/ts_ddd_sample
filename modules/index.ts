import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import packageJson from '../package.json' with { type: 'json' };
import { CreateArticleDto } from './article/application/dto/input/CreateArticleDTO.ts';
import { GetArticlesQueryDto } from './article/application/dto/input/GetArticlesQueryDto.ts';
import { articleDependencies } from './article/dependencies.ts';
import { ArticleController } from './article/infrastructure/controller/ArticleController.ts';
import { getArticlesRoute } from './article/infrastructure/openapi/routes/getArticlesRoute.ts';
import { postArticleRoute } from './article/infrastructure/openapi/routes/postArticleRoute.ts';

const { articleControllerDep } = articleDependencies();

const app = new OpenAPIHono<{ Variables: { articleController: ArticleController } }>({
  // バリデーションエラー時の共通エラーハンドリング
  defaultHook: (result, c) => {
    const formatZodErrors = (result: any) => {
      if (result.error instanceof Error) {
        if (result.error instanceof ZodError) {
          const flattened = result.error.flatten();
          return { ...flattened.fieldErrors, ...flattened.formErrors };
        }
        return { message: result.error.message };
      }
      return { message: 'Unknown error' };
    };
    if (!result.success) {
      return c.json(
        {
          message: 'Validation Error',
          cause: formatZodErrors(result),
        },
        400,
      );
    }
  },
});
//　その他のエラーハンドリング
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        message: err.message,
        cause: err.cause ?? {},
      },
      err.status,
    );
  }
  // fallback
  return c.json({ message: 'Unexpected error', cause: err.cause ?? {} }, 500);
});

app.use('*', articleControllerDep.middleware('articleController'));
app.get('/', (c) => c.json({ message: 'Hello, World!' }));

// ドキュメントサーバー
app.doc31('/docs', {
  openapi: '3.1.0',
  info: { title: packageJson.name, version: packageJson.version },
}); // new endpoint
app.get('/scalar', Scalar({ url: '/docs' }));

// 記事取得エンドポイント
app.openapi(getArticlesRoute, async (c) => {
  const articleController = c.get('articleController');

  const params = c.req.query();
  const parsed = GetArticlesQueryDto.parse(params);
  const articles = await articleController.getArticles(parsed);
  return c.json(articles);
});

// 記事投稿エンドポイント
app.openapi(postArticleRoute, async (c) => {
  const articleController = c.get('articleController');
  const payload = CreateArticleDto.parse(await c.req.json());
  const articleId = await articleController.postArticle(payload);
  return c.json({ id: articleId }, 201);
});

export default app;
