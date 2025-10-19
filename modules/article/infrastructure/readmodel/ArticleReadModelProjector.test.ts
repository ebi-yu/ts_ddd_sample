/**
 * ArticleReadModelProjector の投影ロジックを検証する。
 * - CREATE/CHANGE/PUBLISHイベントでReadModelが正しく更新されること
 * - 前状態が存在しない変更イベントで例外が投げられること
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleReadModelProjector } from './ArticleReadModelProjector.ts';
import { ArticleEventFactory } from '../../domain/events/ArticleEventFactory.ts';
import { ArticleId } from '../../domain/vo/ArticleId.ts';
import { AuthorId } from '../../domain/vo/AuthorId.ts';
import { Title } from '../../domain/vo/Title.ts';
import { Content } from '../../domain/vo/Content.ts';
import { RedisKeys, STATUS } from './ArticleReadModel.ts';

let redisClientStub: { connect: ReturnType<typeof vi.fn>; getClient: ReturnType<typeof vi.fn> };

vi.mock('@shared/client/RedisClient.ts', () => ({
  RedisClient: {
    getInstance: () => redisClientStub,
  },
}));

describe('ArticleReadModelProjector', () => {
  const articleId = new ArticleId('11111111-2222-4333-8444-555566667777');
  const authorId = new AuthorId('aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000');
  const title = new Title('Initial Title');
  const content = new Content('Initial Content');

  beforeEach(() => {
    vi.resetAllMocks();
    redisClientStub = {
      connect: vi.fn(),
      getClient: vi.fn(),
    };
  });

  it('CREATEイベントを受け取った場合、projectを実行すると、新しいReadModel保存結果が返る', async () => {
    // Arrange
    const client = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      sAdd: vi.fn().mockResolvedValue(1),
      hDel: vi.fn().mockResolvedValue(0),
      hSet: vi.fn().mockResolvedValue(1),
    };
    redisClientStub.connect.mockResolvedValue(undefined);
    redisClientStub.getClient.mockReturnValue(client);

    const projector = new ArticleReadModelProjector();
    const event = ArticleEventFactory.create({
      articleId,
      authorId,
      data: { title, content },
      version: 1,
    });

    // Act
    await projector.project(event);

    // Assert
    expect(redisClientStub.connect).toHaveBeenCalled();
    expect(client.get).toHaveBeenCalledWith(RedisKeys.article(articleId.value));
    expect(client.set).toHaveBeenCalledTimes(1);
    const savedJson = JSON.parse(client.set.mock.calls[0][1]);
    expect(savedJson).toMatchObject({
      id: articleId.value,
      title: title.value,
      content: content.value,
      status: STATUS.DRAFT,
      version: 1,
    });
    expect(client.hSet).toHaveBeenCalledWith(
      RedisKeys.articlesByStatus(STATUS.DRAFT),
      articleId.value,
      expect.any(String),
    );
  });

  it('CHANGE_TITLEイベントを受け取った場合、projectを実行すると、タイトル更新とhDel未実行が返る', async () => {
    // Arrange
    const createdAt = new Date().toISOString();
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce(
          JSON.stringify({
            id: articleId.value,
            title: title.value,
            content: content.value,
            authorId: authorId.value,
            status: STATUS.DRAFT,
            version: 1,
            createdAt,
            updatedAt: createdAt,
          }),
        ),
      set: vi.fn().mockResolvedValue(undefined),
      sAdd: vi.fn().mockResolvedValue(1),
      hDel: vi.fn().mockResolvedValue(0),
      hSet: vi.fn().mockResolvedValue(1),
    };
    redisClientStub.connect.mockResolvedValue(undefined);
    redisClientStub.getClient.mockReturnValue(client);

    const projector = new ArticleReadModelProjector();
    const newTitle = new Title('Updated Title');
    const event = ArticleEventFactory.changeTitle({
      articleId,
      authorId,
      data: { oldTitle: title, newTitle },
      version: 2,
    });

    // Act
    await projector.project(event);

    // Assert
    const saved = JSON.parse(client.set.mock.calls[0][1]);
    expect(saved.title).toBe(newTitle.value);
    expect(saved.version).toBe(2);
    expect(client.hDel).not.toHaveBeenCalled();
    expect(client.hSet).toHaveBeenCalledWith(
      RedisKeys.articlesByStatus(STATUS.DRAFT),
      articleId.value,
      expect.any(String),
    );
  });

  it('PUBLISHイベントでステータスが変わる場合、projectを実行すると、以前のステータスをhDelする結果が返る', async () => {
    // Arrange
    const createdAt = new Date().toISOString();
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce(
          JSON.stringify({
            id: articleId.value,
            title: title.value,
            content: content.value,
            authorId: authorId.value,
            status: STATUS.DRAFT,
            version: 2,
            createdAt,
            updatedAt: createdAt,
          }),
        ),
      set: vi.fn().mockResolvedValue(undefined),
      sAdd: vi.fn().mockResolvedValue(1),
      hDel: vi.fn().mockResolvedValue(1),
      hSet: vi.fn().mockResolvedValue(1),
    };
    redisClientStub.connect.mockResolvedValue(undefined);
    redisClientStub.getClient.mockReturnValue(client);

    const projector = new ArticleReadModelProjector();
    const event = ArticleEventFactory.publish({
      articleId,
      authorId,
      version: 3,
    });

    // Act
    await projector.project(event);

    // Assert
    const saved = JSON.parse(client.set.mock.calls[0][1]);
    expect(saved.status).toBe(STATUS.PUBLISHED);
    expect(saved.publishedAt).toBeDefined();
    expect(client.hDel).toHaveBeenCalledWith(
      RedisKeys.articlesByStatus(STATUS.DRAFT),
      articleId.value,
    );
    expect(client.hSet).toHaveBeenCalledWith(
      RedisKeys.articlesByStatus(STATUS.PUBLISHED),
      articleId.value,
      expect.any(String),
    );
  });

  it('現在の状態が無い場合、CHANGE_CONTENTイベントでprojectを実行すると、例外が返る', async () => {
    // Arrange
    const client = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn(),
      sAdd: vi.fn(),
      hDel: vi.fn(),
      hSet: vi.fn(),
    };
    redisClientStub.connect.mockResolvedValue(undefined);
    redisClientStub.getClient.mockReturnValue(client);

    const projector = new ArticleReadModelProjector();
    const event = ArticleEventFactory.changeContent({
      articleId,
      authorId,
      data: { oldContent: content, newContent: new Content('New Content') },
      version: 2,
    });

    // Act
    const act = () => projector.project(event);

    // Assert
    await expect(act).rejects.toThrowError('Current state is null for CHANGE_CONTENT event');
  });
});
