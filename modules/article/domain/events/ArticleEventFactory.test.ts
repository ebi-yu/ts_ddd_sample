/**
 * ArticleEventFactory の生成APIを検証する。
 * - 各種イベント生成メソッドが期待する具象イベントを返す
 * - 渡された値オブジェクトが保持される
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from '../vo/ArticleId.ts';
import { AuthorId } from '../vo/AuthorId.ts';
import { Content } from '../vo/Content.ts';
import { Title } from '../vo/Title.ts';
import { ArticleEventFactory } from './ArticleEventFactory.ts';
import { ArticleArchiveEvent } from './ArticleArchiveEvent.ts';
import { ArticleContentChangeEvent } from './ArticleContentChangeEvent.ts';
import { ArticleCreateEvent } from './ArticleCreateEvent.ts';
import { EVENT_TYPE } from './ArticleEventBase.ts';
import { ArticlePublishEvent } from './ArticlePublishEvent.ts';
import { ArticleReDraftEvent } from './ArticleReDraftEvent.ts';
import { ArticleTitleChangeEvent } from './ArticleTitleChangeEvent.ts';

const articleId = new ArticleId('b2c4bf9c-7f9a-429c-9b79-7dc414c3d46c');
const authorId = new AuthorId('22606304-4286-42e8-9277-9c81b1bc7dfd');

describe('生成', () => {
  it('createを呼び出した場合、ArticleCreateEventを生成すると、同じデータが返る', () => {
    // Arrange
    const title = new Title('Factory create event');
    const content = new Content('Create event content.');

    // Act
    const event = ArticleEventFactory.create({
      articleId,
      authorId,
      version: 1,
      data: { title, content },
    });

    // Assert
    expect(event).toBeInstanceOf(ArticleCreateEvent);
    expect(event.getType()).toBe(EVENT_TYPE.CREATE);
    expect(event.getData()).toMatchObject({ title, content });
  });

  it('changeTitleを呼び出した場合、ArticleTitleChangeEventを生成すると、旧タイトルと新タイトルが返る', () => {
    // Arrange
    const oldTitle = new Title('Old headline');
    const newTitle = new Title('New headline');

    // Act
    const event = ArticleEventFactory.changeTitle({
      articleId,
      authorId,
      version: 2,
      data: { oldTitle, newTitle },
    });

    // Assert
    expect(event).toBeInstanceOf(ArticleTitleChangeEvent);
    expect(event.getType()).toBe(EVENT_TYPE.CHANGE_TITLE);
    expect(event.getData()).toMatchObject({ oldTitle, newTitle });
  });

  it('changeContentを呼び出した場合、ArticleContentChangeEventを生成すると、旧コンテンツと新コンテンツが返る', () => {
    // Arrange
    const oldContent = new Content('Old body');
    const newContent = new Content('New body');

    // Act
    const event = ArticleEventFactory.changeContent({
      articleId,
      authorId,
      version: 3,
      data: { oldContent, newContent },
    });

    // Assert
    expect(event).toBeInstanceOf(ArticleContentChangeEvent);
    expect(event.getType()).toBe(EVENT_TYPE.CHANGE_CONTENT);
    expect(event.getData()).toMatchObject({ oldContent, newContent });
  });

  it('publishを呼び出した場合、ArticlePublishEventを生成すると、データはundefinedが返る', () => {
    // Arrange

    // Act
    const event = ArticleEventFactory.publish({
      articleId,
      authorId,
      version: 4,
    });

    // Assert
    expect(event).toBeInstanceOf(ArticlePublishEvent);
    expect(event.getType()).toBe(EVENT_TYPE.PUBLISH);
    expect(event.getData()).toBeUndefined();
  });

  it('archiveを呼び出した場合、ArticleArchiveEventを生成すると、データはundefinedが返る', () => {
    // Arrange

    // Act
    const event = ArticleEventFactory.archive({
      articleId,
      authorId,
      version: 5,
    });

    // Assert
    expect(event).toBeInstanceOf(ArticleArchiveEvent);
    expect(event.getType()).toBe(EVENT_TYPE.ARCHIVE);
    expect(event.getData()).toBeUndefined();
  });

  it('reDraftを呼び出した場合、ArticleReDraftEventを生成すると、データはundefinedが返る', () => {
    // Arrange

    // Act
    const event = ArticleEventFactory.reDraft({
      articleId,
      authorId,
      version: 6,
    });

    // Assert
    expect(event).toBeInstanceOf(ArticleReDraftEvent);
    expect(event.getType()).toBe(EVENT_TYPE.RE_DRAFT);
    expect(event.getData()).toBeUndefined();
  });
});
