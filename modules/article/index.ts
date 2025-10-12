import { OpenAPIHono } from '@hono/zod-openapi';
import { CreateArticleDto } from './application/dto/input/CreateArticleDTO.ts';
import { GetArticlesQueryDto } from './application/dto/input/GetArticlesQueryDto.ts';
import { articleDependencies } from './dependencies.ts';
import { ArticleController } from './infrastructure/http/controller/ArticleController.ts';
import { getArticlesRouteSchema } from './infrastructure/http/schemas/getArticlesRouteSchema.ts';
import { postArticleRouteSchema } from './infrastructure/http/schemas/postArticleRouteSchema.ts';

export type ArticleAppBindings = { Variables: { articleController: ArticleController } };

export const registerArticleModule = (
  app: OpenAPIHono<ArticleAppBindings>,
): OpenAPIHono<ArticleAppBindings> => {
  const { articleControllerDep } = articleDependencies();
  const controllerMiddleware = articleControllerDep.middleware('articleController');

  app.use('/articles', controllerMiddleware);
  app.use('/articles/*', controllerMiddleware);

  app.openapi(getArticlesRouteSchema, async (c) => {
    const articleController = c.get('articleController');
    const params = c.req.query();
    const parsed = GetArticlesQueryDto.parse(params);
    const articles = await articleController.getArticles(parsed);
    return c.json(articles);
  });

  app.openapi(postArticleRouteSchema, async (c) => {
    const articleController = c.get('articleController');
    const payload = CreateArticleDto.parse(await c.req.json());
    const articleId = await articleController.postArticle(payload);
    return c.json({ id: articleId }, 201);
  });

  return app;
};
