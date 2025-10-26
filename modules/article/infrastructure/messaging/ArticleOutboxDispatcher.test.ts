/**
 * ArticleOutboxDispatcher の振る舞いを検証する。
 * - PENDINGイベントが存在しないときは処理がスキップされる
 * - publish成功時に status が SENT へ更新される
 * - publish失敗時にリトライがスケジュールされる
 * - 最大試行回数を超えると FAILED へ更新される
 * - payload欠落時は FAILED として扱われる
 */
import type { PrismaClient } from '@prisma/client';
import { OutboxStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleEventPrimitiveMapper } from '../mapper/ArticleEventPrimitiveMapper.ts';
import { ARTICLE_OUTBOX_CONTEXT } from '../constants.ts';
import { ArticleOutboxDispatcher } from './ArticleOutboxDispatcher.ts';

const createMocks = () => {
  const outboxEvent = {
    findMany: vi.fn(),
    update: vi.fn(),
  };

  const prismaStub = {
    outboxEvent,
    $disconnect: vi.fn(),
  };

  const publisher = {
    publish: vi.fn(),
    disconnect: vi.fn(),
  };

  return {
    prismaStub: prismaStub as unknown as PrismaClient,
    outboxEvent,
    publisher,
  };
};

describe('ArticleOutboxDispatcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('PENDINGイベントが存在しない場合、dispatchを実行すると、更新なしの結果が返る', async () => {
    // Arrange
    const { prismaStub, outboxEvent, publisher } = createMocks();
    outboxEvent.findMany.mockResolvedValueOnce([]);
    const dispatcher = new ArticleOutboxDispatcher({
      prisma: prismaStub,
      topic: 'test-topic',
      publisher,
    });

    // Act
    await dispatcher.dispatch();

    // Assert
    expect(outboxEvent.update).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('DELETEコンテキストのイベントが存在する場合、dispatchを実行すると、publishが呼び出される', async () => {
    // Arrange
    const { prismaStub, outboxEvent, publisher } = createMocks();
    const now = new Date();
    const record = {
      id: 'outbox-delete-1',
      context: ARTICLE_OUTBOX_CONTEXT.DELETE,
      topic: 'test-topic',
      payload: {
        articleId: 'article-99',
        authorId: 'author-1',
        type: 'DELETE',
        version: 5,
        occurredAt: now.toISOString(),
        data: {},
      },
      status: OutboxStatus.PENDING,
      attempts: 0,
      availableAt: now,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    };
    outboxEvent.findMany.mockResolvedValueOnce([record]);
    vi.spyOn(ArticleEventPrimitiveMapper, 'fromPrimitive').mockReturnValue({
      getArticleId: () => ({ value: 'article-99' }),
      getType: () => 'DELETE',
      getVersion: () => 5,
      getEventDate: () => now,
      getData: () => ({}),
    } as any);
    const dispatcher = new ArticleOutboxDispatcher({
      prisma: prismaStub,
      topic: 'test-topic',
      publisher,
    });

    // Act
    await dispatcher.dispatch();

    // Assert
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    expect(outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-delete-1' },
      data: {
        status: OutboxStatus.SENT,
        sentAt: expect.any(Date),
      },
    });
  });

  it('publishが成功した場合、dispatchを実行すると、SENT更新結果が返る', async () => {
    // Arrange
    const { prismaStub, outboxEvent, publisher } = createMocks();
    const now = new Date();
    const record = {
      id: 'outbox-1',
      context: ARTICLE_OUTBOX_CONTEXT.CREATE,
      topic: 'test-topic',
      payload: {
        articleId: 'article-1',
        authorId: 'author-1',
        type: 'CREATE',
        version: 1,
        occurredAt: now.toISOString(),
        data: { title: 'Title', content: 'Content' },
      },
      status: OutboxStatus.PENDING,
      attempts: 0,
      availableAt: now,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    };
    outboxEvent.findMany.mockResolvedValueOnce([record]);
    vi.spyOn(ArticleEventPrimitiveMapper, 'fromPrimitive').mockReturnValue({
      getArticleId: () => ({ value: 'article-1' }),
      getType: () => 'CREATE',
      getVersion: () => 1,
      getEventDate: () => now,
      getData: () => ({ title: { value: 'Title' }, content: { value: 'Content' } }),
    } as any);
    const dispatcher = new ArticleOutboxDispatcher({
      prisma: prismaStub,
      topic: 'test-topic',
      publisher,
    });

    // Act
    await dispatcher.dispatch();

    // Assert
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    expect(outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: {
        status: OutboxStatus.SENT,
        sentAt: expect.any(Date),
      },
    });
  });

  it('publishで例外が発生した場合、dispatchを実行すると、リトライスケジュールが返る', async () => {
    // Arrange
    const { prismaStub, outboxEvent, publisher } = createMocks();
    const now = new Date();
    const record = {
      id: 'outbox-2',
      context: ARTICLE_OUTBOX_CONTEXT.CREATE,
      topic: 'test-topic',
      payload: {
        articleId: 'article-2',
        authorId: 'author-1',
        type: 'CREATE',
        version: 1,
        occurredAt: now.toISOString(),
        data: { title: 'Title', content: 'Content' },
      },
      status: OutboxStatus.PENDING,
      attempts: 1,
      availableAt: now,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    };
    outboxEvent.findMany.mockResolvedValueOnce([record]);
    vi.spyOn(ArticleEventPrimitiveMapper, 'fromPrimitive').mockReturnValue({
      getArticleId: () => ({ value: 'article-2' }),
      getType: () => 'CREATE',
      getVersion: () => 1,
      getEventDate: () => now,
      getData: () => ({ title: { value: 'Title' }, content: { value: 'Content' } }),
    } as any);
    publisher.publish.mockRejectedValueOnce(new Error('broker down'));
    const dispatcher = new ArticleOutboxDispatcher({
      prisma: prismaStub,
      topic: 'test-topic',
      publisher,
      options: {
        retryDelayMs: 1000,
        maxAttempts: 5,
      },
    });

    // Act
    await dispatcher.dispatch();

    // Assert
    expect(outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-2' },
      data: {
        status: OutboxStatus.PENDING,
        attempts: 2,
        lastError: 'broker down',
        availableAt: expect.any(Date),
      },
    });
  });

  it('最大試行回数に達した場合、dispatchを実行すると、FAILED更新結果が返る', async () => {
    // Arrange
    const { prismaStub, outboxEvent, publisher } = createMocks();
    const now = new Date();
    const record = {
      id: 'outbox-3',
      context: ARTICLE_OUTBOX_CONTEXT.CREATE,
      topic: 'test-topic',
      payload: {
        articleId: 'article-3',
        authorId: 'author-1',
        type: 'CREATE',
        version: 1,
        occurredAt: now.toISOString(),
        data: { title: 'Title', content: 'Content' },
      },
      status: OutboxStatus.PENDING,
      attempts: 4,
      availableAt: now,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    };
    outboxEvent.findMany.mockResolvedValueOnce([record]);
    vi.spyOn(ArticleEventPrimitiveMapper, 'fromPrimitive').mockReturnValue({
      getArticleId: () => ({ value: 'article-3' }),
      getType: () => 'CREATE',
      getVersion: () => 1,
      getEventDate: () => now,
      getData: () => ({ title: { value: 'Title' }, content: { value: 'Content' } }),
    } as any);
    publisher.publish.mockRejectedValueOnce(new Error('permanent failure'));
    const dispatcher = new ArticleOutboxDispatcher({
      prisma: prismaStub,
      topic: 'test-topic',
      publisher,
      options: {
        retryDelayMs: 1000,
        maxAttempts: 5,
      },
    });

    // Act
    await dispatcher.dispatch();

    // Assert
    expect(outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-3' },
      data: {
        status: OutboxStatus.FAILED,
        attempts: 5,
        lastError: 'permanent failure',
      },
    });
  });

  it('payloadが欠落している場合、dispatchを実行すると、FAILED更新結果が返る', async () => {
    // Arrange
    const { prismaStub, outboxEvent, publisher } = createMocks();
    const now = new Date();
    const record = {
      id: 'outbox-4',
      context: ARTICLE_OUTBOX_CONTEXT.CREATE,
      topic: 'test-topic',
      payload: null,
      status: OutboxStatus.PENDING,
      attempts: 0,
      availableAt: now,
      lastError: null,
      createdAt: now,
      updatedAt: now,
      sentAt: null,
    };
    outboxEvent.findMany.mockResolvedValueOnce([record]);
    const dispatcher = new ArticleOutboxDispatcher({
      prisma: prismaStub,
      topic: 'test-topic',
      publisher,
    });

    // Act
    await dispatcher.dispatch();

    // Assert
    expect(outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-4' },
      data: {
        status: OutboxStatus.FAILED,
        attempts: 1,
        lastError: 'Outbox payload is empty',
      },
    });
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
