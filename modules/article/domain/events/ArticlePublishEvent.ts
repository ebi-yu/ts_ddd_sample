import { ArticleEventBase, EVENT_TYPE, type ArticleBaseEventInit } from './ArticleEventBase.ts';

export class ArticlePublishEvent extends ArticleEventBase<undefined> {
  constructor({ articleId, authorId, version, eventDate }: ArticleBaseEventInit) {
    super({ articleId, authorId, type: EVENT_TYPE.PUBLISH, version, eventDate });
  }

  public getData(): undefined {
    return undefined;
  }
}
