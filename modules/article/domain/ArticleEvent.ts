import type { ArticleId } from './vo/ArticleId.ts';
import type { AuthorId } from './vo/AuthorId.ts';
import type { Content } from './vo/Content.ts';
import type { Title } from './vo/Title.ts';

export const EVENT_TYPE = {
  CREATE: 'create',
  CHANGE_TITLE: 'changeTitle',
  CHANGE_CONTENT: 'changeContent',
  PUBLISH: 'publish',
  ARCHIVE: 'archive',
  RE_DRAFT: 'reDraft',
} as const;
export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

export type ChangeTitleEventData = {
  oldTitle: Title | null;
  newTitle: Title;
};

export type ChangeContentEventData = {
  oldContent: Content | null;
  newContent: Content;
};

export type CreateEventData = {
  title: Title;
  content: Content;
  authorId: AuthorId;
};

// Value Object としてのイベントクラス
export abstract class ArticleEventBase<Data = unknown> {
  constructor(
    private readonly _articleId: ArticleId,
    private readonly _type: EventType,
    private readonly _version: number,
    private readonly _eventDate: Date = new Date(),
  ) {}

  public getArticleId(): ArticleId {
    return this._articleId;
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

export class ArticleCreateEvent extends ArticleEventBase<CreateEventData> {
  constructor(
    id: ArticleId,
    private readonly _data: CreateEventData,
    version: number,
    eventDate?: Date,
  ) {
    super(id, EVENT_TYPE.CREATE, version, eventDate);
  }

  public getData(): CreateEventData {
    return this._data;
  }
}

export class ArticleTitleChangeEvent extends ArticleEventBase<ChangeTitleEventData> {
  constructor(
    id: ArticleId,
    private readonly _data: ChangeTitleEventData,
    version: number,
    eventDate?: Date,
  ) {
    super(id, EVENT_TYPE.CHANGE_TITLE, version, eventDate);
  }

  public getData(): ChangeTitleEventData {
    return this._data;
  }
}

export class ArticleContentChangeEvent extends ArticleEventBase<ChangeContentEventData> {
  constructor(
    id: ArticleId,
    private readonly _data: ChangeContentEventData,
    version: number,
    eventDate?: Date,
  ) {
    super(id, EVENT_TYPE.CHANGE_CONTENT, version, eventDate);
  }

  public getData(): ChangeContentEventData {
    return this._data;
  }
}

export class ArticlePublishEvent extends ArticleEventBase<undefined> {
  constructor(id: ArticleId, version: number, eventDate?: Date) {
    super(id, EVENT_TYPE.PUBLISH, version, eventDate);
  }

  public getData(): undefined {
    return undefined;
  }
}

export class ArticleArchiveEvent extends ArticleEventBase<undefined> {
  constructor(id: ArticleId, version: number, eventDate?: Date) {
    super(id, EVENT_TYPE.ARCHIVE, version, eventDate);
  }

  public getData(): undefined {
    return undefined;
  }
}

export class ArticleReDraftEvent extends ArticleEventBase<undefined> {
  constructor(id: ArticleId, version: number, eventDate?: Date) {
    super(id, EVENT_TYPE.RE_DRAFT, version, eventDate);
  }

  public getData(): undefined {
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
  | ArticleReDraftEvent;

// ファクトリー関数でイベント作成（適切なコンストラクタ呼び出し）
export const ArticleEventFactory = {
  create: (
    id: ArticleId,
    eventData: CreateEventData,
    version: number,
    eventDate: Date = new Date(),
  ): ArticleCreateEvent => new ArticleCreateEvent(id, eventData, version, eventDate),

  changeTitle: (
    id: ArticleId,
    eventData: ChangeTitleEventData,
    version: number,
    eventDate: Date = new Date(),
  ): ArticleTitleChangeEvent => new ArticleTitleChangeEvent(id, eventData, version, eventDate),

  changeContent: (
    id: ArticleId,
    eventData: ChangeContentEventData,
    version: number,
    eventDate: Date = new Date(),
  ): ArticleContentChangeEvent => new ArticleContentChangeEvent(id, eventData, version, eventDate),

  publish: (id: ArticleId, version: number, eventDate: Date = new Date()): ArticlePublishEvent =>
    new ArticlePublishEvent(id, version, eventDate),

  archive: (id: ArticleId, version: number, eventDate: Date = new Date()): ArticleArchiveEvent =>
    new ArticleArchiveEvent(id, version, eventDate),

  reDraft: (id: ArticleId, version: number, eventDate: Date = new Date()): ArticleReDraftEvent =>
    new ArticleReDraftEvent(id, version, eventDate),
};
