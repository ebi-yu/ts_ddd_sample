import { ArticleEventBase, EVENT_TYPE, type ArticleBaseEventInit } from './ArticleEventBase.ts';

/*
 * 記事削除イベント
 * ReadModelから記事を削除するために利用する
 */
export class ArticleDeleteEvent extends ArticleEventBase<void> {
  constructor({ articleId, authorId, version, eventDate }: ArticleBaseEventInit) {
    super({ articleId, authorId, version, eventDate, type: EVENT_TYPE.DELETE });
  }

  getData(): void {
    return undefined;
  }
}
