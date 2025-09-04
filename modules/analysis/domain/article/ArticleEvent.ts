import { PlainDate } from "../../../../shared/vo/PlainDate.js";
import type { ArticleId } from "./AtricleId.js";
import type { AuthorUserId } from "./AutoerUserId.js";
import type { Content } from "./Content.js";
import type { Title } from "./Title.js";

export class EventType {
  static ChangeTitle = "changeTitle";
  static ChangeContent = "changeContent";
  static Publish = "publish";
  static Archive = "archive";
  static Draft = "draft";
}
export type TitleEventData = {
  oldTitle: Title | null;
  newTitle: Title;
};

export type ContentEventData = {
  oldContent: Content | null;
  newContent: Content;
};

export type CreateEventData = {
  title: Title;
  content: Content;
  authorId: AuthorUserId;
};

export class ArticleEvent<T = undefined> {
  constructor(
    private _articleId: ArticleId,
    private _eventType: EventType,
    private _eventDate: PlainDate = new PlainDate(),
    private _eventData?: T
  ) {}

  static create(
    articleId: ArticleId,
    eventType: EventType,
    eventData?: CreateEventData
  ): ArticleEvent<CreateEventData> {
    return new ArticleEvent<CreateEventData>(
      articleId,
      eventType,
      new PlainDate(),
      eventData
    );
  }

  static changeTitle(
    articleId: ArticleId,
    eventData: TitleEventData
  ): ArticleEvent<TitleEventData> {
    return new ArticleEvent<TitleEventData>(
      articleId,
      EventType.ChangeTitle,
      new PlainDate(),
      eventData
    );
  }

  static changeContent(
    articleId: ArticleId,
    eventData: ContentEventData
  ): ArticleEvent<ContentEventData> {
    return new ArticleEvent<ContentEventData>(
      articleId,
      EventType.ChangeContent,
      new PlainDate(),
      eventData
    );
  }

  static publish(articleId: ArticleId): ArticleEvent {
    return new ArticleEvent(articleId, EventType.Publish, new PlainDate());
  }

  static archive(articleId: ArticleId): ArticleEvent {
    return new ArticleEvent(articleId, EventType.Archive, new PlainDate());
  }

  static draft(articleId: ArticleId): ArticleEvent {
    return new ArticleEvent(articleId, EventType.Draft, new PlainDate());
  }

  get eventDate(): PlainDate {
    return this._eventDate;
  }
  get eventData(): T | undefined {
    return this._eventData;
  }

  get eventType(): EventType {
    return this._eventType;
  }

  equals(other: ArticleEvent<T>): boolean {
    return (
      this._articleId === other._articleId &&
      this._eventType === other._eventType &&
      this._eventDate.equals(other._eventDate) &&
      JSON.stringify(this._eventData) === JSON.stringify(other._eventData)
    );
  }
}
