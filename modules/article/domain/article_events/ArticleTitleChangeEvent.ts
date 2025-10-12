import { Title } from '../vo/Title.ts';
import { ArticleEventBase, EVENT_TYPE, type ArticleBaseEventInit } from './ArticleEventBase.ts';

export type ChangeTitleEventData = {
  oldTitle: Title | null;
  newTitle: Title;
};

export type ArticleTitleChangeEventInit = ArticleBaseEventInit & {
  data: ChangeTitleEventData;
};

export class ArticleTitleChangeEvent extends ArticleEventBase<ChangeTitleEventData> {
  private readonly _data: ChangeTitleEventData;

  constructor({ articleId, authorId, data, version, eventDate }: ArticleTitleChangeEventInit) {
    super({ articleId, authorId, type: EVENT_TYPE.CHANGE_TITLE, version, eventDate });
    this._data = data;
  }

  public getData(): ChangeTitleEventData {
    return this._data;
  }
}
