/**
 * ArticleReadModelQuery の取得ロジックを検証する。
 * - Redisから取得したJSONをDTOへ変換して返却すること
 * - 対象が存在しない場合は空配列を返すこと
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArticleReadModelQuery } from './ArticleReadModelQuery.ts';
import { STATUS } from './ArticleReadModel.ts';

let redisClientStub: { connect: ReturnType<typeof vi.fn>; getClient: ReturnType<typeof vi.fn> };

vi.mock('@shared/client/RedisClient.ts', () => ({
  RedisClient: {
    getInstance: () => redisClientStub,
  },
}));

describe('ArticleReadModelQuery', () => {
  beforeEach(() => {
    redisClientStub = {
      connect: vi.fn(),
      getClient: vi.fn(),
    };
  });

  it('指定されたIDを渡した場合、findManyByIdsを実行すると、DTO変換結果が返る', async () => {
    // Arrange
    const client = {
      mGet: vi.fn().mockResolvedValue([
        JSON.stringify({
          id: 'article-1',
          title: 'Title 1',
          content: 'Content 1',
          authorId: 'author-1',
          status: STATUS.DRAFT,
          version: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          publishedAt: null,
        }),
        null,
      ]),
    };
    redisClientStub.connect.mockResolvedValue(undefined);
    redisClientStub.getClient.mockReturnValue(client);

    const query = new ArticleReadModelQuery();

    // Act
    const result = await query.findManyByIds(['article-1', 'article-2']);

    // Assert
    expect(redisClientStub.connect).toHaveBeenCalled();
    expect(client.mGet).toHaveBeenCalledWith(['article:article-1', 'article:article-2']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'article-1',
      title: 'Title 1',
      status: STATUS.DRAFT,
    });
  });

  it('すべて未登録の場合、findManyByIdsを実行すると、空配列が返る', async () => {
    // Arrange
    const client = {
      mGet: vi.fn().mockResolvedValue([null]),
    };
    redisClientStub.connect.mockResolvedValue(undefined);
    redisClientStub.getClient.mockReturnValue(client);

    const query = new ArticleReadModelQuery();

    // Act
    const result = await query.findManyByIds(['article-unknown']);

    // Assert
    expect(result).toEqual([]);
  });
});
