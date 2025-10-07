import { PrismaClient } from '@prisma/client';
import type { IArticleRepository } from 'modules/article/application/interface/IArticleEventRepository.ts';
import type { Article } from 'modules/article/domain/Article.ts';
import type { ArticleId } from 'modules/article/domain/index.ts';

const database = new PrismaClient();

export class ArticleEventRepository implements IArticleRepository {
  async create(article: Article): Promise<void> {
    await database.articleEventEntity.create({
      data: {
        articleId: article.getId().toString(),
        eventType: article.getCurrentEvent().getType().toString(),
        eventData: JSON.stringify(article.getCurrentEvent().getData() ?? '{}'),
        version: article.getVersion(),
      },
    });
  }

  async deleteAll(articleId: ArticleId): Promise<void> {
    await database.articleEventEntity.deleteMany({
      where: {
        articleId: articleId.toString(),
      },
    });
  }
}
