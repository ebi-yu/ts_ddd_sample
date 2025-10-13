import type { ArticleEvent } from 'modules/article/domain/events/index.ts';

export interface IDomainEventHandler<TEvent extends ArticleEvent = ArticleEvent> {
  handle(event: TEvent): Promise<void>;
}
