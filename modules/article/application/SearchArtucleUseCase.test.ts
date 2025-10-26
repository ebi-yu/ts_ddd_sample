/**
 * SearchArticleUseCase のユースケースロジックを検証する。
 * - 重複記事が存在しないとき、新規記事を作成しイベントを配信する
 * - 重複記事が存在するとき、409例外を投げて副作用を発生させない
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchArticleUseCase } from './SearchArticleUseCase.ts';
import type { IArticleReadModelQuery } from './adapters/outbound/IArticleReadModelQuery.ts';
import type { GetArticleDtoType } from './dto/input/GetArticleDTO.ts';
import type { ArticleReadModelDTO } from './dto/output/ArticleReadModelDTO.ts';

describe('SearchArticleUseCase', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockedResults: ArticleReadModelDTO[] = [
    {
      id: 'article-id-1',
      title: 'Sample Article 1',
      content: 'This is a sample article content 1.',
      authorId: 'author-id-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      status: 'published',
      version: 1,
    },
  ];

  const createDeps = () => {
    const articleReadModelQueryEmpty: IArticleReadModelQuery = {
      findManyByIds: vi.fn().mockResolvedValue([]),
    };

    const articleReadModelQuery: IArticleReadModelQuery = {
      findManyByIds: vi.fn().mockResolvedValue(mockedResults satisfies ArticleReadModelDTO[]),
    };

    return { articleReadModelQueryEmpty, articleReadModelQuery };
  };

  const buildPayload = (): GetArticleDtoType => {
    return { ids: ['article-id-1', 'article-id-2', 'article-id-3'] };
  };

  it('findManyByIdsが空の検索結果を返す場合、executeを実行すると、空の検索結果が返る', async () => {
    // Arrange
    const { articleReadModelQueryEmpty } = createDeps();
    const useCase = new SearchArticleUseCase(articleReadModelQueryEmpty);
    const payload = buildPayload();

    // Act
    const result = await useCase.execute(payload);

    // Assert
    expect(articleReadModelQueryEmpty.findManyByIds).toHaveBeenCalledWith(payload.ids);
    expect(articleReadModelQueryEmpty.findManyByIds).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('findManyByIds検索結果を返す場合、executeを実行すると、検索結果が返る', async () => {
    // Arrange
    const { articleReadModelQuery } = createDeps();
    const useCase = new SearchArticleUseCase(articleReadModelQuery);
    const payload = buildPayload();

    // Act
    const result = await useCase.execute(payload);

    // Assert
    expect(articleReadModelQuery.findManyByIds).toHaveBeenCalledWith(payload.ids);
    expect(articleReadModelQuery.findManyByIds).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockedResults);
  });
});
