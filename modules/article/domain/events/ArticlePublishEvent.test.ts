/**
 * ArticlePublishEvent の生成と比較を検証する。
 * - PUBLISH種別で生成されること
 * - データがundefinedであること
 * - equals による一致・不一致判定
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { ArticlePublishEvent } from './ArticlePublishEvent.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';

const articleId = new ArticleId('9c4cc60d-3a27-4ab8-9391-4af8972cf0ce');
const authorId = new AuthorId('f2db01c2-9af9-4f08-8989-0631ff8d3cbf');

describe('生成', () => {
  it('公開用の情報を扱う場合、ArticlePublishEventを生成すると、PUBLISH種別とデータundefinedが返る', () => {
    // Arrange

    // Act
    const event = new ArticlePublishEvent({
      articleId,
      authorId,
      version: 2,
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.PUBLISH);
    expect(event.getData()).toBeUndefined();
    expect(event.getArticleId()).toBe(articleId);
    expect(event.getAuthorId()).toBe(authorId);
  });
});

describe('値比較', () => {
  it('同じ情報を与えた場合、equalsを呼び出すと、一致判定が返る', () => {
    // Arrange
    const eventDate = new Date('2024-07-01T08:00:00Z');
    const left = new ArticlePublishEvent({ articleId, authorId, version: 3, eventDate });
    const right = new ArticlePublishEvent({ articleId, authorId, version: 3, eventDate });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('バージョンが異なる場合、equalsを呼び出すと、不一致判定が返る', () => {
    // Arrange
    const eventDate = new Date('2024-07-01T08:00:00Z');
    const left = new ArticlePublishEvent({ articleId, authorId, version: 3, eventDate });
    const right = new ArticlePublishEvent({ articleId, authorId, version: 4, eventDate });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
