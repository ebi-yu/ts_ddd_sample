import type { ArticleEvent } from 'modules/article/domain/events/index.ts';

export interface IArticleReadModelSynchronizer {
  upsert(event: ArticleEvent): Promise<void>;
  delete(event: ArticleEvent): Promise<void>;
}
