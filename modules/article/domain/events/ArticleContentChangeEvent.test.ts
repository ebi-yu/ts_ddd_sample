/**
 * ArticleContentChangeEvent の生成仕様と値比較を検証する。
 * - コンテンツ変更時の旧値・新値の保持
 * - null許容の旧コンテンツを扱う
 * - equals による一致・不一致判定
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { Content } from '../vo/Content.ts';
import { ArticleContentChangeEvent } from './ArticleContentChangeEvent.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';

const articleId = new ArticleId('cf4e35cf-4f0b-4d09-9f69-a9a5c8bd1bdc');
const authorId = new AuthorId('9ddf3ec9-267e-48d4-89ac-911bef95bfb2');

describe('生成', () => {
  it('旧コンテンツが存在しない状態で新コンテンツが与えられると、nullと新値が保持され、CHANGE_CONTENT種別が返る', () => {
    // Arrange
    const newContent = new Content('Initial draft body.');

    // Act
    const event = new ArticleContentChangeEvent({
      articleId,
      authorId,
      version: 2,
      data: { oldContent: null, newContent },
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.CHANGE_CONTENT);
    expect(event.getData()).toMatchObject({ oldContent: null, newContent });
  });

  it('旧コンテンツと新コンテンツが与えられると、両方が保持され、同じ値が返る', () => {
    // Arrange
    const oldContent = new Content('Legacy content.');
    const newContent = new Content('Improved content body.');

    // Act
    const event = new ArticleContentChangeEvent({
      articleId,
      authorId,
      version: 3,
      data: { oldContent, newContent },
    });

    // Assert
    expect(event.getArticleId()).toBe(articleId);
    expect(event.getAuthorId()).toBe(authorId);
    expect(event.getData()).toMatchObject({ oldContent, newContent });
  });
});

describe('値比較', () => {
  it('同じコンテンツの組み合わせが与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const oldContent = new Content('Old body');
    const newContent = new Content('New body');
    const eventDate = new Date('2024-06-02T10:30:00Z');
    const left = new ArticleContentChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate,
      data: { oldContent, newContent },
    });
    const right = new ArticleContentChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate,
      data: { oldContent, newContent },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('新コンテンツが異なると、equalsで不一致判定が返る', () => {
    // Arrange
    const oldContent = new Content('Old body');
    const left = new ArticleContentChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate: new Date('2024-06-02T10:30:00Z'),
      data: { oldContent, newContent: new Content('Body A') },
    });
    const right = new ArticleContentChangeEvent({
      articleId,
      authorId,
      version: 4,
      eventDate: new Date('2024-06-02T10:30:00Z'),
      data: { oldContent, newContent: new Content('Body B') },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
