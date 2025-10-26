/**
 * CreateArticleUseCase のユースケースロジックを検証する。
 * - 重複記事が存在しないとき、新規記事を作成しイベントを配信する
 * - 重複記事が存在するとき、409例外を投げて副作用を発生させない
 */
import { ConflictException } from '@shared/utils/exception/ConflictException.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Article } from '../domain/Article.ts';
import { CreateArticleUseCase } from './CreateArticleUseCase.ts';
import type { IArticleEventCommandRepository } from './adapters/outbound/IArticleEventCommandRepository.ts';
import type { IDomainEventPublisher } from './adapters/outbound/IDomainEventPublisher.ts';
import type { CreateArticleDtoType } from './dto/input/CreateArticleDTO.ts';

describe('CreateArticleUseCase', () => {
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
    const domainEventPublisher: IDomainEventPublisher = {
      publish: vi.fn(),
    };

    return { articleEventCommandRepository, domainEventPublisher };
  };

  const buildPayload = (): CreateArticleDtoType => ({
    title: 'モデリングパターン',
    content: 'ドメインモデリングを進化させる。',
    authorId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
  });

  it('重複が存在しない場合、executeを実行すると、記事作成とイベント配信結果が返る', async () => {
    // Arrange
    const { articleEventCommandRepository, domainEventPublisher } = createDeps();
    (articleEventCommandRepository.checkDuplicate as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );
    (articleEventCommandRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (domainEventPublisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const useCase = new CreateArticleUseCase(articleEventCommandRepository, domainEventPublisher);
    const payload = buildPayload();

    // Act
    const result = await useCase.execute(payload);

    // Assert
    expect(articleEventCommandRepository.checkDuplicate).toHaveBeenCalledWith({
      authorId: payload.authorId,
      title: payload.title,
    });
    expect(articleEventCommandRepository.create).toHaveBeenCalledTimes(1);
    const createdArticle = (articleEventCommandRepository.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Article;
    expect(createdArticle.getId().value).toBe(result);
    expect(domainEventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (domainEventPublisher.publish as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(publishedEvent.getArticleId().value).toBe(result);
  });

  it('重複が存在する場合、executeを実行すると、ConflictExceptionが返る', async () => {
    // Arrange
    const { articleEventCommandRepository, domainEventPublisher } = createDeps();
    (articleEventCommandRepository.checkDuplicate as ReturnType<typeof vi.fn>).mockResolvedValue(
      true,
    );
    const useCase = new CreateArticleUseCase(articleEventCommandRepository, domainEventPublisher);
    const payload = buildPayload();

    // Act
    const act = useCase.execute(payload);

    // Assert
    await expect(act).rejects.toBeInstanceOf(ConflictException);
    expect(articleEventCommandRepository.create).not.toHaveBeenCalled();
    expect(domainEventPublisher.publish).not.toHaveBeenCalled();
  });
});
