import { PrismaClient } from '@prisma/client';
import type { IArticleRepository } from 'modules/article/application/interface/input/IArticleEventRepository.ts';
import type { Article } from 'modules/article/domain/Article.ts';
import type { ArticleId } from 'modules/article/domain/index.ts';

// NOTE : データの永続化自体はPostgreSQLを利用するが、データの読み取りにはRedisを利用する
// そのため、記事のReadModel(読み取り用モデル)の更新はRedisに対して行い、記事のドメインイベントの保存はPostgreSQLに対して行う
// これにより、読み取りと書き込みの責務を分離(CQRS)し、システムのパフォーマンスとスケーラビリティを向上させることができる

const database = new PrismaClient();

export class ArticleEventRepository implements IArticleRepository {
  /*
   * 記事のドメインイベントを保存する
   */
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

  /*
   * 指定された記事IDに紐づく記事のドメインイベントをすべて削除する
   */
  async deleteAll(articleId: ArticleId): Promise<void> {
    await database.articleEventEntity.deleteMany({
      where: {
        articleId: articleId.toString(),
      },
    });
  }
}
