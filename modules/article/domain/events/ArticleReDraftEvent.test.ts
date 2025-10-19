/**
 * ArticleReDraftEvent の生成と比較を検証する。
 * - RE_DRAFT種別で生成されること
 * - データがundefinedであること
 * - equals による一致・不一致判定
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';
import { ArticleReDraftEvent } from './ArticleReDraftEvent.ts';

const articleId = new ArticleId('5e1f9950-62cb-4af8-b3d8-3bc45e2e924b');
const authorId = new AuthorId('dd02dca9-77b9-45b7-9cf2-2d7e1a49de54');

describe('生成', () => {
  it('ドラフト戻しを行う場合、ArticleReDraftEventを生成すると、RE_DRAFT種別とデータundefinedが返る', () => {
    // Arrange

    // Act
    const event = new ArticleReDraftEvent({
      articleId,
      authorId,
      version: 2,
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.RE_DRAFT);
    expect(event.getData()).toBeUndefined();
    expect(event.getArticleId()).toBe(articleId);
    expect(event.getAuthorId()).toBe(authorId);
  });
});

describe('値比較', () => {
  it('同じ情報を与えた場合、equalsを呼び出すと、一致判定が返る', () => {
    // Arrange
    const eventDate = new Date('2024-07-03T08:00:00Z');
    const left = new ArticleReDraftEvent({ articleId, authorId, version: 3, eventDate });
    const right = new ArticleReDraftEvent({ articleId, authorId, version: 3, eventDate });

    // Act
    const result = left.equals(right);

    // Assert記事IDが異なる場合、equalsを呼び出すと、不一致判定が返る
    expect(result).toBe(true);
  });

  it('', () => {
    // Arrange
    const eventDate = new Date('2024-07-03T08:00:00Z');
    const left = new ArticleReDraftEvent({ articleId, authorId, version: 3, eventDate });
    const right = new ArticleReDraftEvent({
      articleId: new ArticleId('0648eb25-4c1f-4d4e-82a7-7c29d8c15c4b'),
      authorId,
      version: 3,
      eventDate,
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
