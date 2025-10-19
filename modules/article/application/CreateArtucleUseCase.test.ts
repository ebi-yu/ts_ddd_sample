/**
 * CreateArticleUseCase のユースケースロジックを検証する。
 * - 重複記事が存在しないとき、新規記事を作成しイベントを配信する
 * - 重複記事が存在するとき、409例外を投げて副作用を発生させない
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateArticleUseCase } from './CreateArtucleUseCase.ts';
import type { IArticleRepository } from './adapters/outbound/IArticleEventRepository.ts';
import type { IDomainEventPublisher } from './adapters/outbound/IDomainEventPublisher.ts';
import type { CreateArticleDtoType } from './dto/input/CreateArticleDTO.ts';
import { ConflictException } from '@shared/utils/exception/ConflictException.ts';
import type { Article } from '../domain/Article.ts';

describe('CreateArticleUseCase', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createDeps = () => {
    const articleRepository: IArticleRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      deleteAll: vi.fn(),
      checkDuplicate: vi.fn(),
    };
    const domainEventPublisher: IDomainEventPublisher = {
      publish: vi.fn(),
    };

    return { articleRepository, domainEventPublisher };
  };

  const buildPayload = (): CreateArticleDtoType => ({
    title: 'モデリングパターン',
    content: 'ドメインモデリングを進化させる。',
    authorId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
  });

  it('重複が存在しない場合、executeを実行すると、記事作成とイベント配信結果が返る', async () => {
    // Arrange
    const { articleRepository, domainEventPublisher } = createDeps();
    (articleRepository.checkDuplicate as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (articleRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (domainEventPublisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const useCase = new CreateArticleUseCase(articleRepository, domainEventPublisher);
    const payload = buildPayload();

    // Act
    const result = await useCase.execute(payload);

    // Assert
    expect(articleRepository.checkDuplicate).toHaveBeenCalledWith({
      authorId: payload.authorId,
      title: payload.title,
    });
    expect(articleRepository.create).toHaveBeenCalledTimes(1);
    const createdArticle = (articleRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as Article;
    expect(createdArticle.getId().value).toBe(result);
    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (domainEventPublisher.publish as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(publishedEvent.getArticleId().value).toBe(result);
  });

  it('重複が存在する場合、executeを実行すると、ConflictExceptionが返る', async () => {
    // Arrange
    const { articleRepository, domainEventPublisher } = createDeps();
    (articleRepository.checkDuplicate as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const useCase = new CreateArticleUseCase(articleRepository, domainEventPublisher);
    const payload = buildPayload();

    // Act
    const act = useCase.execute(payload);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(articleRepository.create).not.toHaveBeenCalled();
    expect(domainEventPublisher.publish).not.toHaveBeenCalled();
  });
});
