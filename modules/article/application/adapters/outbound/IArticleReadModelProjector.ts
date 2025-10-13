import type { ArticleEvent } from 'modules/article/domain/events/index.ts';

export interface IArticleReadModelProjector {
  project(event: ArticleEvent): Promise<void>;
}
