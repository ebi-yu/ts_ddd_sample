import { ArticleEventBase, EVENT_TYPE, type ArticleBaseEventInit } from './ArticleEventBase.ts';

export class ArticleArchiveEvent extends ArticleEventBase<undefined> {
  constructor({ articleId, authorId, version, eventDate }: ArticleBaseEventInit) {
    super({ articleId, authorId, type: EVENT_TYPE.ARCHIVE, version, eventDate });
  }

  public getData(): undefined {
    return undefined;
  }
}
