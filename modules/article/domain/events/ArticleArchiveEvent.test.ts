/**
 * ArticleArchiveEvent の生成と比較を検証する。
 * - ARCHIVE種別で生成されること
 * - データがundefinedであること
 * - equals による一致・不一致判定
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { ArticleArchiveEvent } from './ArticleArchiveEvent.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';

const articleId = new ArticleId('3d516102-1f24-4cf7-9be4-8bfbd472c3d7');
const authorId = new AuthorId('ac7ba00e-bbd0-4b32-9f7d-fcb996226529');

describe('生成', () => {
  it('アーカイブ用の情報が与えられると、ARCHIVE種別でイベントが生成され、データはundefinedが返る', () => {
    // Arrange

    // Act
    const event = new ArticleArchiveEvent({
      articleId,
      authorId,
      version: 2,
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.ARCHIVE);
    expect(event.getData()).toBeUndefined();
    expect(event.getArticleId()).toBe(articleId);
    expect(event.getAuthorId()).toBe(authorId);
  });
});

describe('値比較', () => {
  it('同じ情報が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const eventDate = new Date('2024-07-02T08:00:00Z');
    const left = new ArticleArchiveEvent({ articleId, authorId, version: 3, eventDate });
    const right = new ArticleArchiveEvent({ articleId, authorId, version: 3, eventDate });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('eventDateが異なると、equalsで不一致判定が返る', () => {
    // Arrange
    const left = new ArticleArchiveEvent({
      articleId,
      authorId,
      version: 3,
      eventDate: new Date('2024-07-02T08:00:00Z'),
    });
    const right = new ArticleArchiveEvent({
      articleId,
      authorId,
      version: 3,
      eventDate: new Date('2024-07-02T08:00:01Z'),
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
