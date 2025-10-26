import { afterEach, describe, expect, it, vi } from 'vitest';
import { Article, ArticleId, AuthorId, Content, Title, EVENT_TYPE } from '../domain/index.ts';
import { DeleteArticleUseCase } from './DeleteArticleUseCase.ts';
import type { IArticleEventCommandRepository } from './adapters/outbound/IArticleEventCommandRepository.ts';
import type { DeleteArticleDtoType } from './dto/input/DeleteArticleDTO.ts';

describe('DeleteArticleUseCase', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDeps = () => {
    const articleEventCommandRepository: IArticleEventCommandRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
      checkDuplicate: vi.fn(),
    };

    return { articleEventCommandRepository };
  };

  const buildPayload = (): DeleteArticleDtoType => {
    return { id: '123e4567-e89b-12d3-a456-426614174000' };
  };

  it('記事が存在する場合、executeを実行すると、削除イベントを生成してdeleteが呼ばれる', async () => {
    // Arrange
    const { articleEventCommandRepository } = createDeps();
    const payload = buildPayload();
    const articleId = new ArticleId(payload.id);
    const authorId = new AuthorId('8b643d98-0df0-4b76-9f4a-8c5e64d8e0b1');
    const article = Article.create({
      id: articleId,
      authorId,
      title: new Title('Delete me'),
      content: new Content('Body'),
    });
    articleEventCommandRepository.findById = vi.fn().mockResolvedValue(article);
    articleEventCommandRepository.delete = vi.fn().mockResolvedValue(undefined);
    const useCase = new DeleteArticleUseCase(articleEventCommandRepository);

    // Act
    await useCase.execute(payload);

    // Assert
    expect(articleEventCommandRepository.findById).toHaveBeenCalledWith(articleId);
    expect(articleEventCommandRepository.delete).toHaveBeenCalledTimes(1);
    const deleteEvent = (articleEventCommandRepository.delete as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(deleteEvent.getType()).toBe(EVENT_TYPE.DELETE);
    expect(deleteEvent.getArticleId().equals(articleId)).toBe(true);
    expect(deleteEvent.getAuthorId().equals(authorId)).toBe(true);
    expect(deleteEvent.getVersion()).toBe(article.getVersion() + 1);
  });

  it('記事が存在しない場合、executeを実行すると、deleteは呼ばれない', async () => {
    // Arrange
    const { articleEventCommandRepository } = createDeps();
    const payload = buildPayload();
    articleEventCommandRepository.findById = vi.fn().mockResolvedValue(null);
    const useCase = new DeleteArticleUseCase(articleEventCommandRepository);

    // Act
    await useCase.execute(payload);

    // Assert
    expect(articleEventCommandRepository.findById).toHaveBeenCalledWith(
      new ArticleId(payload.id),
    );
    expect(articleEventCommandRepository.delete).not.toHaveBeenCalled();
  });
});
