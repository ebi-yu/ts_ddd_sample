import type { ArticleEvent } from 'modules/article/domain/ArticleEvent.ts';

export interface IArticleReadModelProjector {
  project(event: ArticleEvent): Promise<void>;
}
