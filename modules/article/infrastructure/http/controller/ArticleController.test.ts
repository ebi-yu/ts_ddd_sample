/**
 * ArticleController の振る舞いを検証する。
 * - getArticles は検索ユースケースへ ID 配列を渡して結果を返す
 * - postArticle は作成ユースケースへ DTO を渡して戻り値を返す
 */
import type { ICreateArticleUseCase } from 'modules/article/application/adapters/inbound/ICreateArticleUseCase.ts';
import type { IDeleteArticleUseCase } from 'modules/article/application/adapters/inbound/IDeleteArticleUseCase.ts';
import type { ISearchArticleUseCase } from 'modules/article/application/adapters/inbound/ISearchArticleUseCase.ts';
import type { CreateArticleDtoType } from 'modules/article/application/dto/input/CreateArticleDTO.ts';
import type { DeleteArticleDtoType } from 'modules/article/application/dto/input/DeleteArticleDTO.ts';
import type { GetArticleDtoType } from 'modules/article/application/dto/input/GetArticleDTO.ts';
import type { ArticleReadModelDTO } from 'modules/article/application/dto/output/ArticleReadModelDTO.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArticleController } from './ArticleController.ts';

describe('ArticleController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDeps = () => {
    const createArticleUseCase: ICreateArticleUseCase = {
      execute: vi.fn(),
    };
    const searchArticleUseCase: ISearchArticleUseCase = {
      execute: vi.fn(),
    };
    const deleteArticleUseCase: IDeleteArticleUseCase = {
      execute: vi.fn(),
    };

    return { createArticleUseCase, searchArticleUseCase, deleteArticleUseCase };
  };

  it('getArticlesを呼び出す場合、検索ユースケースを実行すると、同じ結果が返る', async () => {
    // Arrange
    const { createArticleUseCase, searchArticleUseCase, deleteArticleUseCase } = createDeps();
    const controller = new ArticleController(
      createArticleUseCase,
      searchArticleUseCase,
      deleteArticleUseCase,
    );
    const dto: GetArticleDtoType = { ids: ['de305d54-75b4-431b-adb2-eb6b9e546015'] };
    const readModels: ArticleReadModelDTO[] = [
      {
        id: dto.ids[0],
        title: 'DDD入門',
        content: '戦略設計と戦術設計を俯瞰する。',
        authorId: '17dd88df-9468-43bf-a329-6d574bffb57c',
        status: 'draft',
        version: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    (searchArticleUseCase.execute as ReturnType<typeof vi.fn>).mockResolvedValue(readModels);

    // Act
    const result = await controller.getArticles(dto);

    // Assert
    expect(searchArticleUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual(readModels);
    expect(createArticleUseCase.execute).not.toHaveBeenCalled();
  });

  it('postArticleを呼び出す場合、作成ユースケースを実行すると、同じ結果が返る', async () => {
    // Arrange
    const { createArticleUseCase, searchArticleUseCase, deleteArticleUseCase } = createDeps();
    const controller = new ArticleController(
      createArticleUseCase,
      searchArticleUseCase,
      deleteArticleUseCase,
    );
    const dto: CreateArticleDtoType = {
      title: 'EventStormingガイド',
      content: 'ビジネスイベントからモデルを導く。',
      authorId: '9d11f23c-3a3f-4301-9733-27dda2a2c3b8',
    };
    const articleId = 'a7f5c3b9-6c4d-45be-9b3a-6e7d2c439999';
    (createArticleUseCase.execute as ReturnType<typeof vi.fn>).mockResolvedValue(articleId);

    // Act
    const result = await controller.postArticle(dto);

    // Assert
    expect(createArticleUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(articleId);
    expect(searchArticleUseCase.execute).not.toHaveBeenCalled();
  });

  it('deleteArticleを呼び出す場合、削除ユースケースを実行する', async () => {
    // Arrange
    const { createArticleUseCase, searchArticleUseCase, deleteArticleUseCase } = createDeps();
    const controller = new ArticleController(
      createArticleUseCase,
      searchArticleUseCase,
      deleteArticleUseCase,
    );
    const dto: DeleteArticleDtoType = { id: 'de305d54-75b4-431b-adb2-eb6b9e546017' };
    (deleteArticleUseCase.execute as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    // Act
    await controller.deleteArticle(dto);

    // Assert
    expect(deleteArticleUseCase.execute).toHaveBeenCalledWith(dto);
    expect(createArticleUseCase.execute).not.toHaveBeenCalled();
    expect(searchArticleUseCase.execute).not.toHaveBeenCalled();
  });
});
