import type { Article } from 'modules/article/domain/Article.ts';
import type { ArticleId } from 'modules/article/domain/index.ts';
import type { ArticleDeleteEvent } from 'modules/article/domain/events/ArticleDeleteEvent.ts';

export interface IArticleEventCommandRepository {
  create(article: Article): Promise<void>;
  findById(id: ArticleId): Promise<Article | null>;
  delete(deleteEvent: ArticleDeleteEvent): Promise<void>;
  checkDuplicate({ authorId, title }: { authorId: string; title: string }): Promise<boolean>;
}
