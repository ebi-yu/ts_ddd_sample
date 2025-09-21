import { PlainDate } from "@shared/domain/vo/PlainDate.ts";
import type { ArticleId } from "./vo/ArticleId.ts";
import type { AuthorUserId } from "./vo/AuthorUserId.ts";
import type { Content } from "./vo/Content.ts";
import type { Title } from "./vo/Title.ts";

export const EVENT_TYPE = {
  CREATE: "create",
  CHANGE_TITLE: "changeTitle",
  CHANGE_CONTENT: "changeContent",
  PUBLISH: "publish",
  ARCHIVE: "archive",
  DRAFT: "draft",
} as const;
export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

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

// Value Object としてのイベントクラス
export abstract class ArticleEventBase {
  constructor(
    protected readonly _articleId: ArticleId,
    protected readonly _eventDate: PlainDate = new PlainDate()
  ) {}

  get articleId(): ArticleId {
    return this._articleId;
  }

  get eventDate(): PlainDate {
    return this._eventDate;
  }

  get occurredAt(): Date {
    return new Date(this._eventDate.value);
  }

  abstract get type(): EventType;
  abstract get data(): any;

  equals(other: ArticleEventBase): boolean {
    return (
      this._articleId.equals(other._articleId) &&
      this.type === other.type &&
      this._eventDate.equals(other._eventDate) &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }
}

export class ArticleCreateEvent extends ArticleEventBase {
  readonly type = EVENT_TYPE.CREATE;

  constructor(
    articleId: ArticleId,
    private readonly _data: CreateEventData,
    eventDate?: PlainDate
  ) {
    super(articleId, eventDate);
  }

  get data(): CreateEventData {
    return this._data;
  }
}

export class ArticleTitleChangeEvent extends ArticleEventBase {
  readonly type = EVENT_TYPE.CHANGE_TITLE;

  constructor(
    articleId: ArticleId,
    private readonly _data: TitleEventData,
    eventDate?: PlainDate
  ) {
    super(articleId, eventDate);
  }

  get data(): TitleEventData {
    return this._data;
  }
}

export class ArticleContentChangeEvent extends ArticleEventBase {
  readonly type = EVENT_TYPE.CHANGE_CONTENT;

  constructor(
    articleId: ArticleId,
    private readonly _data: ContentEventData,
    eventDate?: PlainDate
  ) {
    super(articleId, eventDate);
  }

  get data(): ContentEventData {
    return this._data;
  }
}

export class ArticlePublishEvent extends ArticleEventBase {
  readonly type = EVENT_TYPE.PUBLISH;

  constructor(articleId: ArticleId, eventDate?: PlainDate) {
    super(articleId, eventDate);
  }

  get data(): undefined {
    return undefined;
  }
}

export class ArticleArchiveEvent extends ArticleEventBase {
  readonly type = EVENT_TYPE.ARCHIVE;

  constructor(articleId: ArticleId, eventDate?: PlainDate) {
    super(articleId, eventDate);
  }

  get data(): undefined {
    return undefined;
  }
}

export class ArticleDraftEvent extends ArticleEventBase {
  readonly type = EVENT_TYPE.DRAFT;

  constructor(articleId: ArticleId, eventDate?: PlainDate) {
    super(articleId, eventDate);
  }

  get data(): undefined {
    return undefined;
  }
}

// Union型でまとめる（型安全性を維持）
export type ArticleEvent =
  | ArticleCreateEvent
  | ArticleTitleChangeEvent
  | ArticleContentChangeEvent
  | ArticlePublishEvent
  | ArticleArchiveEvent
  | ArticleDraftEvent;

// ファクトリー関数でイベント作成（適切なコンストラクタ呼び出し）
export const ArticleEventFactory = {
  create: (
    articleId: ArticleId,
    eventData: CreateEventData
  ): ArticleCreateEvent => new ArticleCreateEvent(articleId, eventData),

  changeTitle: (
    articleId: ArticleId,
    eventData: TitleEventData
  ): ArticleTitleChangeEvent =>
    new ArticleTitleChangeEvent(articleId, eventData),

  changeContent: (
    articleId: ArticleId,
    eventData: ContentEventData
  ): ArticleContentChangeEvent =>
    new ArticleContentChangeEvent(articleId, eventData),

  publish: (articleId: ArticleId): ArticlePublishEvent =>
    new ArticlePublishEvent(articleId),

  archive: (articleId: ArticleId): ArticleArchiveEvent =>
    new ArticleArchiveEvent(articleId),

  draft: (articleId: ArticleId): ArticleDraftEvent =>
    new ArticleDraftEvent(articleId),
};
