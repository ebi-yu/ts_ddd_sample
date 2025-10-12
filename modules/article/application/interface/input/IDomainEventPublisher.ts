import type { ArticleEvent } from 'modules/article/domain/article_events/index.ts';

export interface IDomainEventPublisher {
  publish(event: ArticleEvent): Promise<void>;
}
