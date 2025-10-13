/**
 * ArticleCreateEvent の生成仕様と値比較を検証する。
 * - 生成時にCREATE種別が付与されること
 * - Title/Contentを含むデータの保持
 * - equals による一致・不一致判定
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { Content } from '../vo/Content.ts';
import { Title } from '../vo/Title.ts';
import { ArticleCreateEvent } from './ArticleCreateEvent.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';

const articleId = new ArticleId('51f6e7b1-492f-4462-bfa7-8d4b93f39f6c');
const authorId = new AuthorId('c24f55c9-8325-4637-a8db-4d9da1d56edd');

describe('生成', () => {
  it('タイトルとコンテンツが与えられると、CREATE種別でイベントが生成され、同じ値が返る', () => {
    // Arrange
    const title = new Title('Domain Events in Action');
    const content = new Content('Events capture state transitions.');

    // Act
    const event = new ArticleCreateEvent({
      articleId,
      authorId,
      version: 1,
      data: { title, content },
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.CREATE);
    expect(event.getArticleId()).toBe(articleId);
    expect(event.getAuthorId()).toBe(authorId);
    expect(event.getData()).toMatchObject({ title, content });
  });
});

describe('値比較', () => {
  it('同じ内容が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const title = new Title('Aggregate consistency');
    const content = new Content('Ensure events reflect state changes.');
    const left = new ArticleCreateEvent({
      articleId,
      authorId,
      version: 1,
      eventDate: new Date('2024-04-01T10:00:00Z'),
      data: { title, content },
    });
    const right = new ArticleCreateEvent({
      articleId,
      authorId,
      version: 1,
      eventDate: new Date('2024-04-01T10:00:00Z'),
      data: { title, content },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('タイトルが異なると、equalsで不一致判定が返る', () => {
    // Arrange
    const content = new Content('Track state transitions carefully.');
    const left = new ArticleCreateEvent({
      articleId,
      authorId,
      version: 1,
      eventDate: new Date('2024-04-01T10:00:00Z'),
      data: { title: new Title('Blue Book'), content },
    });
    const right = new ArticleCreateEvent({
      articleId,
      authorId,
      version: 1,
      eventDate: new Date('2024-04-01T10:00:00Z'),
      data: { title: new Title('Green Book'), content },
    });

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
