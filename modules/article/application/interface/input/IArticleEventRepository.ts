import type { Article } from 'modules/article/domain/Article.ts';
import type { ArticleId } from 'modules/article/domain/index.ts';

export interface IArticleRepository {
  create(article: Article): Promise<void>;
  deleteAll(id: ArticleId): Promise<void>;
  checkDuplicate({ authorId, title }: { authorId: string; title: string }): Promise<boolean>;
}
