import { Content } from '../vo/Content.ts';
import { Title } from '../vo/Title.ts';
import { ArticleEventBase, EVENT_TYPE, type ArticleBaseEventInit } from './ArticleEventBase.ts';

export type CreateEventData = {
  title: Title;
  content: Content;
};

export type ArticleCreateEventInit = ArticleBaseEventInit & {
  data: CreateEventData;
};

export class ArticleCreateEvent extends ArticleEventBase<CreateEventData> {
  private readonly _data: CreateEventData;

  constructor({ articleId, authorId, data, version, eventDate }: ArticleCreateEventInit) {
    super({ articleId, authorId, type: EVENT_TYPE.CREATE, version, eventDate });
    this._data = data;
  }

  public getData(): CreateEventData {
    return this._data;
  }
}
