import type { ArticleEvent } from 'modules/article/domain/article_events/index.ts';

export interface IArticleReadModelProjector {
  project(event: ArticleEvent): Promise<void>;
}
