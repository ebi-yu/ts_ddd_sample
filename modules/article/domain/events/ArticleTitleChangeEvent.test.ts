/**
 * ArticleTitleChangeEvent の生成仕様と値比較を検証する。
 * - タイトル変更時の旧値・新値の保持
 * - null許容の旧タイトルを扱う
 * - equals による一致・不一致判定
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { Title } from '../vo/Title.ts';
import { ArticleTitleChangeEvent } from './ArticleTitleChangeEvent.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';

const articleId = new ArticleId('5bc1d697-11a4-4abd-9ae0-74a4c8b5e5c9');
const authorId = new AuthorId('ea8a1f02-24d0-4e21-9d73-7c4f2be4d87c');

describe('生成', () => {
  it('旧タイトルが存在しない状態で新タイトルが与えられると、nullと新値が保持され、CHANGE_TITLE種別が返る', () => {
    // Arrange
    const newTitle = new Title('First publication title');

    // Act
    const event = new ArticleTitleChangeEvent({
      articleId,
      authorId,
      version: 2,
      data: { oldTitle: null, newTitle },
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.CHANGE_TITLE);
    expect(event.getData()).toMatchObject({ oldTitle: null, newTitle });
  });

  it('旧タイトルと新タイトルが与えられると、両方が保持され、同じ値が返る', () => {
    // Arrange
    const oldTitle = new Title('Original title');
    const newTitle = new Title('Revised title');

    // Act
    const event = new ArticleTitleChangeEvent({
      articleId,
      authorId,
      version: 3,
      data: { oldTitle, newTitle },
    });

    // Assert
    expect(event.getArticleId()).toBe(articleId);
    expect(event.getAuthorId()).toBe(authorId);
    expect(event.getData()).toMatchObject({ oldTitle, newTitle });
  });
});

describe('値比較', () => {
  it('同じタイトルの組み合わせが与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const oldTitle = new Title('Domain Storytelling');
    const newTitle = new Title('Collaborative Modeling');
    const eventDate = new Date('2024-06-01T09:00:00Z');
    const left = new ArticleTitleChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate,
      data: { oldTitle, newTitle },
    });
    const right = new ArticleTitleChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate,
      data: { oldTitle, newTitle },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('新タイトルが異なると、equalsで不一致判定が返る', () => {
    // Arrange
    const oldTitle = new Title('Legacy title');
    const left = new ArticleTitleChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate: new Date('2024-06-01T09:00:00Z'),
      data: { oldTitle, newTitle: new Title('Updated A') },
    });
    const right = new ArticleTitleChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate: new Date('2024-06-01T09:00:00Z'),
      data: { oldTitle, newTitle: new Title('Updated B') },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
