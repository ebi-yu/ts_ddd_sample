import type { ArticleEvent } from 'modules/article/domain/events/index.ts';

export interface IDomainEventPublisher {
  publish(event: ArticleEvent): Promise<void>;
}
