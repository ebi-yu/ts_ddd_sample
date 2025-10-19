/**
 * Article 集約がドメインイベントを発行する仕様を検証する。
 * - イベント発行: create / change / publish / archive / re-draft
 * - バリデーションと冪等性: 同一タイトル・同一コンテンツ
 */
import { describe, expect, it } from 'vitest';
import { Article } from './Article.ts';
import { EVENT_TYPE } from './events/ArticleEventBase.ts';
import { ArticleEventFactory } from './events/ArticleEventFactory.ts';
import { ArticleId } from './vo/ArticleId.ts';
import { AuthorId } from './vo/AuthorId.ts';
import { Content } from './vo/Content.ts';
import { Title } from './vo/Title.ts';

describe('イベント発行', () => {
  it('記事作成用の値を与えた場合、createを実行すると、CREATEイベントが発行され最新状態が返る', () => {
    // Arrange
    const articleId = new ArticleId('0f38bac5-6f4a-4ac5-8c86-31ff125dfe8f');
    const authorId = new AuthorId('a58f2c1d-acc7-4f4f-bc5d-47db694f3a9e');
    const title = new Title('Domain Modeling Made Functional');
    const content = new Content('Model the domain with care.');

    // Act
    const article = Article.create({ id: articleId, authorId, title, content });

    // Assert
    const currentEvent = article.getCurrentEvent();
    expect(article.getVersion()).toBe(1);
    expect(currentEvent.getType()).toBe(EVENT_TYPE.CREATE);
    const eventData = currentEvent.getData();
    expect(eventData).toMatchObject({
      title,
      content,
    });
    expect(article.getCurrentTitle()?.value).toBe(title.value);
    expect(article.getCurrentContent()?.value).toBe(content.value);
  });

  it('新しいタイトルを与えた場合、changeTitleを実行すると、CHANGE_TITLEイベントが発行され最新タイトルが返る', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('63fa72ac-86cf-4f17-9a4b-2e9f7561d1ab'),
      authorId: new AuthorId('9c801f4e-e965-4d40-9b38-6a3910b33d0b'),
      title: new Title('Domain-Driven Refactoring'),
      content: new Content('Start from the ubiquitous language.'),
    });
    const newTitle = new Title('Evolutionary Design');

    // Act
    article.changeTitle(newTitle);

    // Assert
    expect(article.getVersion()).toBe(2);
    expect(article.getCurrentEvent().getType()).toBe(EVENT_TYPE.CHANGE_TITLE);
    expect(article.getCurrentTitle()?.value).toBe('Evolutionary Design');
    const eventData = article.getCurrentEvent().getData();
    expect(eventData).toMatchObject({
      oldTitle: expect.any(Title),
      newTitle,
    });
  });

  it('新しいコンテンツを与えた場合、changeContentを実行すると、CHANGE_CONTENTイベントが発行され最新コンテンツが返る', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('1a2b3c4d-5e6f-4a81-9a03-040506070809'),
      authorId: new AuthorId('8f0b9c7a-6d5e-4c3b-8a19-182736455463'),
      title: new Title('Event Storming Workshop'),
      content: new Content('Capture domain knowledge collaboratively.'),
    });
    const newContent = new Content('Visualize events to reveal the model.');

    // Act
    article.changeContent(newContent);

    // Assert
    expect(article.getVersion()).toBe(2);
    expect(article.getCurrentEvent().getType()).toBe(EVENT_TYPE.CHANGE_CONTENT);
    expect(article.getCurrentContent()?.value).toBe('Visualize events to reveal the model.');
    const eventData = article.getCurrentEvent().getData();
    expect(eventData).toMatchObject({
      oldContent: expect.any(Content),
      newContent,
    });
  });

  it('公開条件を満たした記事の場合、publishを実行すると、PUBLISHイベントが発行されバージョンが進む', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('4cb89690-5959-4b33-9c83-9d55860df0f3'),
      authorId: new AuthorId('3f3fe8b2-9cbf-40b5-b6cd-36392db23f21'),
      title: new Title('Refactoring to Patterns'),
      content: new Content('Evolutionary design relies on feedback.'),
    });

    // Act
    article.publish();

    // Assert
    expect(article.getVersion()).toBe(2);
    expect(article.getCurrentEvent().getType()).toBe(EVENT_TYPE.PUBLISH);
  });

  it('記事をアーカイブする場合、archiveを実行すると、ARCHIVEイベントが発行されバージョンが進む', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('11112222-3333-4444-8d55-666677778888'),
      authorId: new AuthorId('9999aaaa-bbbb-4ccc-8ddd-eeeeffff0000'),
      title: new Title('Context Mapping'),
      content: new Content('Relationships between bounded contexts matter.'),
    });

    // Act
    article.archive();

    // Assert
    expect(article.getVersion()).toBe(2);
    expect(article.getCurrentEvent().getType()).toBe(EVENT_TYPE.ARCHIVE);
  });

  it('記事をドラフトに戻す場合、reDraftを実行すると、RE_DRAFTイベントが発行されバージョンが進む', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('aaaa1111-bbbb-4ccc-8ddd-3333dddd4444'),
      authorId: new AuthorId('5555eeee-6666-4fff-8aaa-88889999aaaa'),
      title: new Title('Generative Object Modeling'),
      content: new Content('Refine the model through experiments.'),
    });

    // Act
    article.reDraft();

    // Assert
    expect(article.getVersion()).toBe(2);
    expect(article.getCurrentEvent().getType()).toBe(EVENT_TYPE.RE_DRAFT);
  });
});

describe('バリデーションと冪等性', () => {
  it('同一タイトルを与えた場合、changeTitleを実行すると、同じインスタンスが返る', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('5a2c06d6-3023-4d0d-88e1-7ef6d5f69321'),
      authorId: new AuthorId('f39d9a61-7d1d-47ee-9a57-8df2f9c46683'),
      title: new Title('Strategic Design'),
      content: new Content('Bounded contexts guide teams.'),
    });
    const sameTitle = new Title('Strategic Design');
    const beforeVersion = article.getVersion();
    const beforeEvent = article.getCurrentEvent();

    // Act
    const result = article.changeTitle(sameTitle);

    // Assert
    expect(result).toBe(article);
    expect(article.getVersion()).toBe(beforeVersion);
    expect(article.getCurrentEvent()).toBe(beforeEvent);
  });

  it('同一コンテンツを与えた場合、changeContentを実行すると、同じインスタンスが返る', () => {
    // Arrange
    const article = Article.create({
      id: new ArticleId('0a1b2c3d-4e5f-4a71-8b93-041526374859'),
      authorId: new AuthorId('0fedcba9-8765-4c32-8b10-ffeeddccbbaa'),
      title: new Title('Domain Storytelling'),
      content: new Content('Stories highlight domain experts.'),
    });
    const sameContent = new Content('Stories highlight domain experts.');
    const beforeVersion = article.getVersion();
    const beforeEvent = article.getCurrentEvent();

    // Act
    const result = article.changeContent(sameContent);

    // Assert
    expect(result).toBe(article);
    expect(article.getVersion()).toBe(beforeVersion);
    expect(article.getCurrentEvent()).toBe(beforeEvent);
  });
});

describe('再構築', () => {
  it('イベント列を与えた場合、rehydrateを実行すると、順序に関わらず最新状態が返る', () => {
    // Arrange
    const articleId = new ArticleId('1c8a9b6f-6e8d-4b12-8b4b-9cd7e2a4f123');
    const authorId = new AuthorId('2f3a4b5c-6d7e-4f8a-9b1c-2d3e4f5a6b7c');
    const initialTitle = new Title('Initial Title');
    const updatedTitle = new Title('Updated Title');
    const content = new Content('Persistent content body.');
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const updatedAt = new Date('2024-02-01T00:00:00Z');

    const createEvent = ArticleEventFactory.create({
      articleId,
      authorId,
      data: { title: initialTitle, content },
      version: 1,
      eventDate: createdAt,
    });
    const changeTitleEvent = ArticleEventFactory.changeTitle({
      articleId,
      authorId,
      data: { oldTitle: initialTitle, newTitle: updatedTitle },
      version: 2,
      eventDate: updatedAt,
    });

    // Act
    const rehydrated = Article.rehydrate([changeTitleEvent, createEvent]);

    // Assert
    expect(rehydrated.getVersion()).toBe(2);
    expect(rehydrated.getCurrentTitle()?.value).toBe(updatedTitle.value);
    expect(rehydrated.getCurrentContent()?.value).toBe(content.value);
    expect(rehydrated.getCurrentEvent().getEventDate().toISOString()).toBe(
      updatedAt.toISOString(),
    );
  });

  it('バージョンが飛んだイベント列を与えた場合、rehydrateを実行すると、例外が返る', () => {
    // Arrange
    const articleId = new ArticleId('7a8b9c0d-1e2f-4a5b-8c9d-0e1f2a3b4c5d');
    const authorId = new AuthorId('0d9c8b7a-6f5e-4d3c-8b1a-0f9e8d7c6b5a');
    const title = new Title('Gap Title');
    const content = new Content('Gap content body.');

    const createEvent = ArticleEventFactory.create({
      articleId,
      authorId,
      data: { title, content },
      version: 1,
    });
    const invalidChange = ArticleEventFactory.changeContent({
      articleId,
      authorId,
      data: { oldContent: content, newContent: new Content('Changed') },
      version: 3,
    });

    // Act
    const act = () => Article.rehydrate([createEvent, invalidChange]);

    // Assert
    expect(act).toThrowError('Invalid event version: expected 2, received 3');
  });

  it('異なる記事IDのイベントを含む場合、rehydrateを実行すると、例外が返る', () => {
    // Arrange
    const articleId = new ArticleId('5b6c7d8e-9f0a-4b3c-8d7e-6f5a4b3c2d1e');
    const authorId = new AuthorId('1e2d3c4b-5a6f-4e8d-9c0b-1a2d3f4e5c6b');
    const title = new Title('Mismatch Title');
    const content = new Content('Mismatch content.');

    const createEvent = ArticleEventFactory.create({
      articleId,
      authorId,
      data: { title, content },
      version: 1,
    });
    const mismatchedEvent = ArticleEventFactory.publish({
      articleId: new ArticleId('9e8d7c6b-5a4d-3c2b-8a0f-9e8d7c6b5a4d'),
      authorId,
      version: 2,
    });

    // Act
    const act = () => Article.rehydrate([createEvent, mismatchedEvent]);

    // Assert
    expect(act).toThrowError('Inconsistent Article ID in event stream');
  });
});
