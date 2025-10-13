/**
 * ArticleEventRepository のドメインイベント再構築を検証する。
 * - findById がイベント列から Article 集約を復元する
 * - 対象イベントが無い場合は null が返る
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { ArticleEventRepository } from './ArticleEventRepository.ts';
import { ArticleId } from '../../domain/vo/ArticleId.ts';

const createPrismaStub = () => {
  const findMany = vi.fn();
  const create = vi.fn();
  const deleteMany = vi.fn();

  const prismaStub = {
    articleEventEntity: {
      findMany,
      create,
      deleteMany,
    },
  };

  return { prismaStub: prismaStub as unknown as PrismaClient, findMany, create, deleteMany };
};

describe('ArticleEventRepository.findById', () => {
  const articleId = new ArticleId('11111111-2222-4333-8444-555566667777');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('イベント履歴が存在しないとき、null が返る', async () => {
    // Arrange
    const { prismaStub, findMany } = createPrismaStub();
    findMany.mockResolvedValueOnce([]);
    const repository = new ArticleEventRepository(prismaStub);

    // Act
    const result = await repository.findById(articleId);

    // Assert
    expect(result).toBeNull();
    expect(findMany).toHaveBeenCalledWith({
      where: { articleId: articleId.value },
      orderBy: [{ version: 'asc' }],
    });
  });

  it('イベント履歴から Article 集約を再構築し、最新状態を返す', async () => {
    // Arrange
    const { prismaStub, findMany } = createPrismaStub();
    findMany.mockResolvedValueOnce([
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

    const repository = new ArticleEventRepository(prismaStub);

    // Act
    const result = await repository.findById(articleId);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.getVersion()).toBe(2);
    expect(result?.getCurrentTitle()?.value).toBe('Updated Title');
    expect(result?.getCurrentEvent().getEventDate().toISOString()).toBe('2024-02-01T00:00:00.000Z');
  });
});

describe('ArticleEventRepository.checkDuplicate', () => {
  const authorId = 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0000';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('最新のタイトルが一致すると true が返る', async () => {
    // Arrange
    const { prismaStub, findMany } = createPrismaStub();
    findMany.mockResolvedValueOnce([
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
    const repository = new ArticleEventRepository(prismaStub);

    // Act
    const result = await repository.checkDuplicate({
      authorId,
      title: 'Duplicated Title',
    });

    // Assert
    expect(result).toBe(true);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: {
        authorId,
      },
    });
  });

  it('一致するタイトルが無い場合は false が返る', async () => {
    // Arrange
    const { prismaStub, findMany } = createPrismaStub();
    findMany.mockResolvedValueOnce([
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
    const repository = new ArticleEventRepository(prismaStub);

    // Act
    const result = await repository.checkDuplicate({
      authorId,
      title: 'Duplicated Title',
    });

    // Assert
    expect(result).toBe(false);
  });
});
