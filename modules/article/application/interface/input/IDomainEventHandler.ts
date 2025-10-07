import type { ArticleEvent } from 'modules/article/domain/ArticleEvent.ts';

export interface IDomainEventHandler<TEvent extends ArticleEvent = ArticleEvent> {
  handle(event: TEvent): Promise<void>;
}
