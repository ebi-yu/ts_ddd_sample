import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { prettyJSON } from 'hono/pretty-json';
import packageJson from '../package.json' with { type: 'json' };
import { CreateArticleDto } from './article/application/dto/input/CreateArticleDTO.ts';
import { articleDependencies } from './article/dependencies.ts';
import { ArticleController } from './article/infrastructure/controller/ArticleController.ts';
import { getArticlesRoute } from './article/infrastructure/openapi/routes/getArticlesRoute.ts';
import { postArticleRoute } from './article/infrastructure/openapi/routes/postArticleRoute.ts';

const { articleControllerDep } = articleDependencies();

const app = new OpenAPIHono<{ Variables: { articleController: ArticleController } }>();

app.use('*', articleControllerDep.middleware('articleController'));

app.get('/', (c) => c.json({ message: 'Hello, World!' }));

app.use('/doc/*', prettyJSON());

// 記事の取得
app.openapi(
  getArticlesRoute,
  async (c) => {
    const articleController = c.get('articleController');

    const params = c.req.query();
    const articleIds = Array.isArray(params['ids[]']) ? params['ids[]'] : [params['ids[]']];

    const articles = await articleController.getArticles(articleIds);
    return c.json(articles);
  },
  (result, c) => {
    if (!result.success) {
      return c.json({ message: 'Invalid request parameters', errors: result.error }, 404);
    }
  },
);

// 記事の投稿
app.openapi(postArticleRoute, async (c) => {
  const articleController = c.get('articleController');
  const payload = CreateArticleDto.parse(await c.req.json());
  await articleController.postArticle(payload);
  return c.body(null, 201);
});

app.doc31('/docs', {
  openapi: '3.1.0',
  info: { title: packageJson.name, version: packageJson.version },
}); // new endpoint

app.get('/scalar', Scalar({ url: '/docs' }));

export default app;
