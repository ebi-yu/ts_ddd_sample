import { Content } from '../vo/Content.ts';
import { ArticleEventBase, EVENT_TYPE, type ArticleBaseEventInit } from './ArticleEventBase.ts';

export type ChangeContentEventData = {
  oldContent: Content | null;
  newContent: Content;
};

export type ArticleContentChangeEventInit = ArticleBaseEventInit & {
  data: ChangeContentEventData;
};

export class ArticleContentChangeEvent extends ArticleEventBase<ChangeContentEventData> {
  private readonly _data: ChangeContentEventData;

  constructor({ articleId, authorId, data, version, eventDate }: ArticleContentChangeEventInit) {
    super({ articleId, authorId, type: EVENT_TYPE.CHANGE_CONTENT, version, eventDate });
    this._data = data;
  }

  public getData(): ChangeContentEventData {
    return this._data;
  }
}
