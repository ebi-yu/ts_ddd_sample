/**
 * ArticleEventBase 抽象クラスの基本仕様を検証する。
 * - eventDate未指定時の自動補完と指定値の保持
 * - equals による同値判定と不一致検知
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { ArticleEventBase, EVENT_TYPE } from './ArticleEventBase.ts';

type TestEventData = Record<string, unknown>;

class TestEvent extends ArticleEventBase<TestEventData> {
  constructor({
    articleId,
    authorId,
    type = EVENT_TYPE.CREATE,
    version,
    eventDate,
    data,
  }: {
    articleId: ArticleId;
    authorId: AuthorId;
    type?: (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];
    version: number;
    eventDate?: Date;
    data: TestEventData;
  }) {
    super({ articleId, authorId, type, version, eventDate });
    this._data = data;
  }

  private readonly _data: TestEventData;

  public getData(): TestEventData {
    return this._data;
  }
}

describe('生成', () => {
  const articleId = new ArticleId('2f0a9b76-9b6d-4a5b-a925-09bcbb6b70c4');
  const authorId = new AuthorId('7e847d10-399c-4ea9-91c9-4d5dd5f535c4');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('eventDateが指定されないと、システム日時が採用され、同じ日時が返る', () => {
    // Arrange

    // Act
    const event = new TestEvent({ articleId, authorId, version: 1, data: { note: 'auto' } });

    // Assert
    expect(event.getEventDate().toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(event.getType()).toBe(EVENT_TYPE.CREATE);
  });

  it('eventDateが指定されると、指定日時が保持され、同じ日時が返る', () => {
    // Arrange
    const fixedDate = new Date('2023-12-31T23:59:59Z');

    // Act
    const event = new TestEvent({
      articleId,
      authorId,
      version: 2,
      eventDate: fixedDate,
      data: { note: 'fixed' },
    });

    // Assert
    expect(event.getEventDate()).toBe(fixedDate);
    expect(event.getVersion()).toBe(2);
  });
});

describe('値比較', () => {
  const articleId = new ArticleId('fa9a6fda-8a9b-4f2a-b19c-3df5398f7c66');
  const authorId = new AuthorId('b23f2f79-d5c8-4f7a-bac6-9f84067a4f3f');
  const eventDate = new Date('2024-05-05T09:30:00Z');

  it('同じ値が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const left = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate,
      data: { note: 'same' },
    });
    const right = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate,
      data: { note: 'same' },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('データが異なると、equalsで不一致判定が返る', () => {
    // Arrange
    const left = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate,
      data: { note: 'left' },
    });
    const right = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate,
      data: { note: 'right' },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });

  it('eventDateが異なると、equalsで不一致判定が返る', () => {
    // Arrange
    const left = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate: new Date('2024-05-05T09:30:00Z'),
      data: { note: 'same' },
    });
    const right = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate: new Date('2024-05-05T09:30:01Z'),
      data: { note: 'same' },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
  it('データのプロパティ順が異なっても、equalsで一致判定が返る', () => {
    // Arrange
    const leftData = { alpha: '1', beta: '2' };
    const rightData: Record<string, string> = {};
    rightData.beta = '2';
    rightData.alpha = '1';

    const left = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate,
      data: leftData,
    });
    const right = new TestEvent({
      articleId,
      authorId,
      version: 1,
      eventDate,
      data: rightData,
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });
});
