import { RedisClient } from '@shared/infrastructure/RedisClient.ts';
import {
  type ArticleReadModelDTO,
  type IArticleReadModelQuery,
} from '../../application/interface/IArticleReadModelQuery.ts';
import { RedisKeys, type ArticleReadModel } from './ArticleReadModel.ts';

export class ArticleReadModelQuery implements IArticleReadModelQuery {
  constructor(private readonly redis = RedisClient.getInstance()) {}

  async findManyByIds(articleIds: string[]): Promise<ArticleReadModelDTO[]> {
    await this.redis.connect();
    const client = this.redis.getClient();

    const keys = articleIds.map((id) => RedisKeys.article(id));
    const raws = await client.mGet(keys);

    const articles: ArticleReadModelDTO[] = [];
    for (const raw of raws) {
      if (raw) {
        const article = JSON.parse(raw) as ArticleReadModel;
        articles.push(this.toDto(article));
      }
    }

    return articles;
  }

  private toDto(model: ArticleReadModel): ArticleReadModelDTO {
    return {
      id: model.id,
      title: model.title,
      content: model.content,
      authorId: model.authorId,
      status: model.status,
      version: model.version,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      publishedAt: model.publishedAt,
    };
  }
}
