/**
 * ArticleEventPrimitiveMapper のシリアライズ／デシリアライズを検証する。
 * - CREATE/CHANGE/PUBLISH各イベントをPrimitiveへ変換し復元できること
 * - 未対応タイプのシリアライズで例外が発生すること
 */
import { describe, expect, it } from 'vitest';
import { ArticleEventPrimitiveMapper } from './ArticleEventPrimitiveMapper.ts';
import { ArticleEventFactory } from '../../domain/events/ArticleEventFactory.ts';
import { EVENT_TYPE } from '../../domain/events/ArticleEventBase.ts';
import { ArticleId } from '../../domain/vo/ArticleId.ts';
import { AuthorId } from '../../domain/vo/AuthorId.ts';
import { Title } from '../../domain/vo/Title.ts';
import { Content } from '../../domain/vo/Content.ts';
import type { CreateEventData } from '../../domain/events/ArticleCreateEvent.ts';
import type { ChangeTitleEventData } from '../../domain/events/ArticleTitleChangeEvent.ts';

describe('ArticleEventPrimitiveMapper', () => {
  const articleId = new ArticleId('11111111-2222-4333-8444-555566667777');
  const authorId = new AuthorId('aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000');

  it('CREATEイベントを扱う場合、Primitiveへ変換すると、再度復元結果が返る', () => {
    // Arrange
    const event = ArticleEventFactory.create({
      articleId,
      authorId,
      data: {
        title: new Title('Domain Modeling'),
        content: new Content('DDD is powerful.'),
      },
      version: 1,
      eventDate: new Date('2024-01-01T00:00:00Z'),
    });

    // Act
    const primitive = ArticleEventPrimitiveMapper.toPrimitive(event);
    const restored = ArticleEventPrimitiveMapper.fromPrimitive(primitive);

    // Assert
    expect(primitive).toMatchObject({
      articleId: articleId.value,
      authorId: authorId.value,
      type: EVENT_TYPE.CREATE,
      data: {
        title: 'Domain Modeling',
        content: 'DDD is powerful.',
      },
    });
    expect(restored.getType()).toBe(EVENT_TYPE.CREATE);
    expect(restored.getVersion()).toBe(1);
    const restoredData = restored.getData() as CreateEventData;
    expect(restoredData.title.value).toBe('Domain Modeling');
    expect(restoredData.content.value).toBe('DDD is powerful.');
  });

  it('CHANGE_TITLEイベントを扱う場合、Primitiveへ変換すると、oldタイトルとnewタイトルが返る', () => {
    // Arrange
    const event = ArticleEventFactory.changeTitle({
      articleId,
      authorId,
      data: {
        oldTitle: new Title('Old Title'),
        newTitle: new Title('New Title'),
      },
      version: 2,
      eventDate: new Date('2024-02-01T00:00:00Z'),
    });

    // Act
    const primitive = ArticleEventPrimitiveMapper.toPrimitive(event);
    const restored = ArticleEventPrimitiveMapper.fromPrimitive(primitive);

    // Assert
    expect(primitive.data).toMatchObject({
      oldTitle: 'Old Title',
      newTitle: 'New Title',
    });
    const data = restored.getData() as ChangeTitleEventData;
    expect(data.oldTitle?.value).toBe('Old Title');
    expect(data.newTitle.value).toBe('New Title');
  });

  it('PUBLISHイベントを扱う場合、Primitiveへ変換すると、空データが返る', () => {
    // Arrange
    const event = ArticleEventFactory.publish({
      articleId,
      authorId,
      version: 3,
      eventDate: new Date('2024-03-01T00:00:00Z'),
    });

    // Act
    const primitive = ArticleEventPrimitiveMapper.toPrimitive(event);
    const restored = ArticleEventPrimitiveMapper.fromPrimitive(primitive);

    // Assert
    expect(primitive.data).toEqual({});
    expect(restored.getType()).toBe(EVENT_TYPE.PUBLISH);
  });

  it('DELETEイベントを扱う場合、Primitiveへ変換すると、空データが返る', () => {
    // Arrange
    const event = ArticleEventFactory.delete({
      articleId,
      authorId,
      version: 10,
      eventDate: new Date('2024-04-01T00:00:00Z'),
    });

    // Act
    const primitive = ArticleEventPrimitiveMapper.toPrimitive(event);
    const restored = ArticleEventPrimitiveMapper.fromPrimitive(primitive);

    // Assert
    expect(primitive.data).toEqual({});
    expect(primitive.type).toBe(EVENT_TYPE.DELETE);
    expect(restored.getType()).toBe(EVENT_TYPE.DELETE);
    expect(restored.getVersion()).toBe(10);
  });

  it('未知のイベント種別をシリアライズする場合、toPrimitiveを実行すると、例外が返る', () => {
    // Arrange
    const fakeEvent = {
      getArticleId: () => new ArticleId('22222222-3333-4444-8555-666677778888'),
      getAuthorId: () => authorId,
      getType: () => 'UNKNOWN',
      getVersion: () => 1,
      getEventDate: () => new Date(),
      getData: () => ({}),
    } as any;

    // Act / Assert
    expect(() => ArticleEventPrimitiveMapper.toPrimitive(fakeEvent)).toThrowError(
      'Unsupported event type for serialization: UNKNOWN',
    );
  });
});
