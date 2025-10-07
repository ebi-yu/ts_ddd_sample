import type { ArticleEvent } from 'modules/article/domain/ArticleEvent.ts';

export interface IDomainEventPublisher {
  publish(event: ArticleEvent): Promise<void>;
}
