import { OpenAPIHono } from '@hono/zod-openapi';
import { CreateArticleDto } from './application/dto/input/CreateArticleDTO.ts';
import { DeleteArticleDto } from './application/dto/input/DeleteArticleDTO.ts';
import { GetArticleDto } from './application/dto/input/GetArticleDTO.ts';
import { articleDependencies } from './dependencies.ts';
import { ArticleController } from './infrastructure/http/controller/ArticleController.ts';
import { deleteArticleRouteSchema } from './infrastructure/http/schemas/deleteArticleRouteSchema.ts';
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
    const parsed = GetArticleDto.parse(params);
    const articles = await articleController.getArticles(parsed);
    return c.json(articles);
  });

  app.openapi(postArticleRouteSchema, async (c) => {
    const articleController = c.get('articleController');
    const payload = CreateArticleDto.parse(await c.req.json());
    const articleId = await articleController.postArticle(payload);
    return c.json({ id: articleId }, 201);
  });

  app.openapi(deleteArticleRouteSchema, async (c) => {
    const articleController = c.get('articleController');
    const params = c.req.param();
    const parsed = DeleteArticleDto.parse(params);
    await articleController.deleteArticle(parsed);
    return c.body(null, 204);
  });
  return app;
};
