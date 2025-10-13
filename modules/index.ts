import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { BaseException } from '@shared/error/BaseException.ts';
import { ZodError } from 'zod';
import packageJson from '../package.json' with { type: 'json' };
import { registerArticleModule, type ArticleAppBindings } from './article/index.ts';

const app = new OpenAPIHono<ArticleAppBindings>({
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
  if (err instanceof BaseException) {
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

// サンプルエンドポイント
app.get('/', (c) => c.json({ message: 'Hello, World!' }));

// ドキュメントサーバー
app.doc31('/docs', {
  openapi: '3.1.0',
  info: { title: packageJson.name, version: packageJson.version },
}); // new endpoint
app.get('/scalar', Scalar({ url: '/docs' }));

registerArticleModule(app);

export default app;
