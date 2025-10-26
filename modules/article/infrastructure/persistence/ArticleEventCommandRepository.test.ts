/**
 * ArticleEventCommandRepository  のドメインイベント再構築を検証する。
 * - findById がイベント列から Article 集約を復元する
 * - 対象イベントが無い場合は null が返る
 */
import { OutboxStatus, type PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Article } from '../../domain/Article.ts';
import { ArticleId, ArticleId as DomainArticleId } from '../../domain/vo/ArticleId.ts';
import { AuthorId } from '../../domain/vo/AuthorId.ts';
import { Content } from '../../domain/vo/Content.ts';
import { Title } from '../../domain/vo/Title.ts';
import { ArticleEventFactory } from '../../domain/events/ArticleEventFactory.ts';
import { ARTICLE_OUTBOX_CONTEXT } from '../constants.ts';
import { ArticleEventCommandRepository } from './ArticleEventCommandRepository.ts';
import { EVENT_TYPE } from '../../domain/events/ArticleEventBase.ts';

const createPrismaStub = () => {
  const articleEventEntity = {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
  };

  const outboxEvent = {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
  };

  const $transaction = vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
    callback({
      articleEventEntity,
      outboxEvent,
    }),
  );

  const prismaStub = {
    articleEventEntity,
    outboxEvent,
    $transaction,
  };

  return {
    prismaStub: prismaStub as unknown as PrismaClient,
    articleEventEntity,
    outboxEvent,
    $transaction,
  };
};

describe('ArticleEventCommandRepository .findById', () => {
  const articleId = new ArticleId('11111111-2222-4333-8444-555566667777');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('イベント履歴が存在しない場合、findByIdを実行すると、nullが返る', async () => {
    // Arrange
    const { prismaStub, articleEventEntity } = createPrismaStub();
    articleEventEntity.findMany.mockResolvedValueOnce([]);
    const repository = new ArticleEventCommandRepository(prismaStub);

    // Act
    const result = await repository.findById(articleId);

    // Assert
    expect(result).toBeNull();
    expect(articleEventEntity.findMany).toHaveBeenCalledWith({
      where: { articleId: articleId.value },
      orderBy: [{ version: 'asc' }],
    });
  });

  it('イベント履歴が存在する場合、findByIdを実行すると、最新状態が返る', async () => {
    // Arrange
    const { prismaStub, articleEventEntity } = createPrismaStub();
    articleEventEntity.findMany.mockResolvedValueOnce([
      {
        articleId: articleId.value,
        authorId: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000',
        eventType: 'CREATE',
        eventData: JSON.stringify({
          title: 'Original Title',
          content: 'Original Content',
        }),
        version: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        articleId: articleId.value,
        authorId: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000',
        eventType: 'CHANGE_TITLE',
        eventData: JSON.stringify({
          oldTitle: 'Original Title',
          newTitle: 'Updated Title',
        }),
        version: 2,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
      },
    ]);

    const repository = new ArticleEventCommandRepository(prismaStub);

    // Act
    const result = await repository.findById(articleId);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.getVersion()).toBe(2);
    expect(result?.getCurrentTitle()?.value).toBe('Updated Title');
    expect(result?.getCurrentEvent().getEventDate().toISOString()).toBe('2024-02-01T00:00:00.000Z');
  });
});

describe('ArticleEventCommandRepository .checkDuplicate', () => {
  const authorId = 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('最新のタイトルが一致する場合、checkDuplicateを実行すると、trueが返る', async () => {
    // Arrange
    const { prismaStub, articleEventEntity } = createPrismaStub();
    articleEventEntity.findMany.mockResolvedValueOnce([
      {
        articleId: '11111111-2222-4333-8444-555566667777',
        authorId,
        eventType: 'CHANGE_TITLE',
        eventData: JSON.stringify({
          oldTitle: 'Original Title',
          newTitle: 'Duplicated Title',
        }),
        version: 2,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
      },
      {
        articleId: '11111111-2222-4333-8444-555566667777',
        authorId,
        eventType: 'CREATE',
        eventData: JSON.stringify({
          title: 'Original Title',
          content: 'Original Content',
        }),
        version: 1,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    ]);
    const repository = new ArticleEventCommandRepository(prismaStub);

    // Act
    const result = await repository.checkDuplicate({
      authorId,
      title: 'Duplicated Title',
    });

    // Assert
    expect(result).toBe(true);
    expect(articleEventEntity.findMany).toHaveBeenCalledTimes(1);
    expect(articleEventEntity.findMany.mock.calls[0][0]).toMatchObject({
      where: {
        authorId,
      },
    });
  });

  it('一致するタイトルが無い場合、checkDuplicateを実行すると、falseが返る', async () => {
    // Arrange
    const { prismaStub, articleEventEntity } = createPrismaStub();
    articleEventEntity.findMany.mockResolvedValueOnce([
      {
        articleId: '88888888-9999-4aaa-8555-ccccdddd0000',
        authorId,
        eventType: 'CHANGE_TITLE',
        eventData: JSON.stringify({
          oldTitle: 'Something else',
          newTitle: 'Another Title',
        }),
        version: 3,
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-03-01T00:00:00Z'),
      },
    ]);
    const repository = new ArticleEventCommandRepository(prismaStub);

    // Act
    const result = await repository.checkDuplicate({
      authorId,
      title: 'Duplicated Title',
    });

    // Assert
    expect(result).toBe(false);
  });
});

describe('ArticleEventCommandRepository .delete', () => {
  const articleId = new ArticleId('99999999-aaaa-4bbb-8ccc-ddddeeeeffff');
  const authorId = new AuthorId('aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deleteを実行すると、イベント削除とDELETEアウトボックス登録が行われる', async () => {
    // Arrange
    const { prismaStub, articleEventEntity, outboxEvent } = createPrismaStub();
    const repository = new ArticleEventCommandRepository(prismaStub);
    const deleteEvent = ArticleEventFactory.delete({
      articleId,
      authorId,
      version: 10,
    });

    // Act
    await repository.delete(deleteEvent);

    // Assert
    expect(articleEventEntity.deleteMany).toHaveBeenCalledWith({
      where: { articleId: articleId.value },
    });
    expect(outboxEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        context: ARTICLE_OUTBOX_CONTEXT.DELETE,
        topic: expect.any(String),
        payload: expect.objectContaining({
          articleId: articleId.value,
          authorId: authorId.value,
          type: EVENT_TYPE.DELETE,
          version: 10,
        }),
        status: OutboxStatus.PENDING,
      }),
    });
  });
});

describe('ArticleEventCommandRepository .create', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('イベント保存とアウトボックス登録を行う場合、createを実行すると、同一トランザクション結果が返る', async () => {
    // Arrange
    const { prismaStub, articleEventEntity, outboxEvent, $transaction } = createPrismaStub();
    const repository = new ArticleEventCommandRepository(prismaStub);
    const article = Article.create({
      id: new DomainArticleId('6f9c3ae9-1234-4b5d-8e7f-3c2b1a0f9e8d'),
      authorId: new AuthorId('aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000'),
      title: new Title('Outbox Title'),
      content: new Content('Outbox Content'),
    });

    // Act
    await repository.create(article);

    // Assert
    expect($transaction).toHaveBeenCalledTimes(1);
    expect(articleEventEntity.create).toHaveBeenCalledTimes(1);
    expect(outboxEvent.create).toHaveBeenCalledTimes(1);
    const payload = outboxEvent.create.mock.calls[0][0]?.data?.payload;
    expect(payload).toMatchObject({
      articleId: article.getId().value,
      type: 'CREATE',
    });
  });
});
