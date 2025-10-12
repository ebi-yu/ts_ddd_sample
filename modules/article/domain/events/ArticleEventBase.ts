import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';

export const EVENT_TYPE = {
  CREATE: 'CREATE',
  CHANGE_TITLE: 'CHANGE_TITLE',
  CHANGE_CONTENT: 'CHANGE_CONTENT',
  PUBLISH: 'PUBLISH',
  ARCHIVE: 'ARCHIVE',
  RE_DRAFT: 'RE_DRAFT',
} as const;

export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

export type ArticleEventBaseInit = {
  articleId: ArticleId;
  authorId: AuthorId;
  type: EventType;
  version: number;
  eventDate?: Date;
};

export type ArticleBaseEventInit = {
  articleId: ArticleId;
  authorId: AuthorId;
  version: number;
  eventDate?: Date;
};

export type ArticleStatusEventInit = ArticleBaseEventInit;

export abstract class ArticleEventBase<Data = unknown> {
  private readonly _articleId: ArticleId;
  private readonly _authorId: AuthorId;
  private readonly _type: EventType;
  private readonly _version: number;
  private readonly _eventDate: Date;

  protected constructor({ articleId, authorId, type, version, eventDate }: ArticleEventBaseInit) {
    this._articleId = articleId;
    this._authorId = authorId;
    this._type = type;
    this._version = version;
    this._eventDate = eventDate ?? new Date();
  }

  public getArticleId(): ArticleId {
    return this._articleId;
  }

  public getAuthorId(): AuthorId {
    return this._authorId;
  }

  public getType(): EventType {
    return this._type;
  }

  public getEventDate(): Date {
    return this._eventDate;
  }

  public getVersion(): number {
    return this._version;
  }

  public abstract getData(): Data;

  public equals(other: ArticleEventBase<unknown>): boolean {
    return (
      this._articleId.equals(other.getArticleId()) &&
      this._type === other.getType() &&
      this._version === other.getVersion() &&
      this._eventDate.getTime() === other.getEventDate().getTime() &&
      JSON.stringify(this.getData()) === JSON.stringify(other.getData())
    );
  }
}
