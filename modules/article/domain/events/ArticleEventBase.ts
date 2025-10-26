import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';

export const EVENT_TYPE = {
  CREATE: 'CREATE',
  CHANGE_TITLE: 'CHANGE_TITLE',
  CHANGE_CONTENT: 'CHANGE_CONTENT',
  PUBLISH: 'PUBLISH',
  ARCHIVE: 'ARCHIVE',
  RE_DRAFT: 'RE_DRAFT',
  DELETE: 'DELETE',
} as const;

export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

export type ArticleBaseEventInit = {
  articleId: ArticleId;
  authorId: AuthorId;
  version: number;
  eventDate?: Date;
};

export abstract class ArticleEventBase<Data = unknown> {
  private readonly _articleId: ArticleId;
  private readonly _authorId: AuthorId;
  private readonly _type: EventType;
  private readonly _version: number;
  private readonly _eventDate: Date;

  protected constructor({
    articleId,
    authorId,
    type,
    version,
    eventDate,
  }: ArticleBaseEventInit & { type: EventType }) {
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
      ArticleEventBase.isSameData(this.getData(), other.getData())
    );
  }

  private static isSameData(left: unknown, right: unknown): boolean {
    if (left === right) return true;

    if (left instanceof Date && right instanceof Date) {
      return left.getTime() === right.getTime();
    }

    const hasEquals = (value: unknown): value is { equals: (other: unknown) => boolean } =>
      !!value &&
      typeof value === 'object' &&
      'equals' in (value as Record<string, unknown>) &&
      typeof (value as { equals?: unknown }).equals === 'function';

    if (hasEquals(left) && hasEquals(right)) {
      return left.equals(right);
    }

    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) {
        return false;
      }

      return left.every((item, index) => ArticleEventBase.isSameData(item, right[index]));
    }

    if (
      left &&
      right &&
      typeof left === 'object' &&
      typeof right === 'object' &&
      !Array.isArray(left) &&
      !Array.isArray(right)
    ) {
      const leftEntries = Object.entries(left);
      const rightEntries = Object.entries(right);

      if (leftEntries.length !== rightEntries.length) {
        return false;
      }

      return leftEntries.every(
        ([key, value]) =>
          Object.prototype.hasOwnProperty.call(right, key) &&
          ArticleEventBase.isSameData(value, (right as Record<string, unknown>)[key]),
      );
    }

    return false;
  }
}
