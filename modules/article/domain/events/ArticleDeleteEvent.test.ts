import { describe, expect, it } from 'vitest';
import { ArticleDeleteEvent } from './ArticleDeleteEvent.ts';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';

describe('ArticleDeleteEvent', () => {
  it('ArticleDeleteEventを生成すると、タイプがDELETEになる', () => {
    // Arrange
    const event = new ArticleDeleteEvent({
      articleId: new ArticleId('11111111-2222-4333-8444-555566667777'),
      authorId: new AuthorId('aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000'),
      version: 10,
      eventDate: new Date('2024-04-01T00:00:00Z'),
    });

    // Assert
    expect(event.getType()).toBe(EVENT_TYPE.DELETE);
    expect(event.getVersion()).toBe(10);
    expect(event.getData()).toBeUndefined();
  });
});
