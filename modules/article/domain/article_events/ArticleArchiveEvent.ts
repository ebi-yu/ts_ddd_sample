import { ArticleEventBase, EVENT_TYPE, type ArticleStatusEventInit } from './ArticleEventBase.ts';

export class ArticleArchiveEvent extends ArticleEventBase<undefined> {
  constructor({ articleId, authorId, version, eventDate }: ArticleStatusEventInit) {
    super({ articleId, authorId, type: EVENT_TYPE.ARCHIVE, version, eventDate });
  }

  public getData(): undefined {
    return undefined;
  }
}
