import { ArticleEventFactory, ArticleId } from '../domain/index.ts';
import type { IDeleteArticleUseCase } from './adapters/inbound/IDeleteArticleUseCase.ts';
import type { IArticleEventCommandRepository } from './adapters/outbound/IArticleEventCommandRepository.ts';
import type { DeleteArticleDtoType } from './dto/input/DeleteArticleDTO.ts';

export class DeleteArticleUseCase implements IDeleteArticleUseCase {
  constructor(private readonly articleEventCommandRepository: IArticleEventCommandRepository) {}

  async execute(dto: DeleteArticleDtoType): Promise<void> {
    const articleIdValue = new ArticleId(dto.id);
    const article = await this.articleEventCommandRepository.findById(articleIdValue);
    if (!article) {
      return;
    }

    const deleteEvent = ArticleEventFactory.delete({
      articleId: article.getId(),
      authorId: article.getAuthorId(),
      version: article.getVersion() + 1,
    });

    await this.articleEventCommandRepository.delete(deleteEvent);
  }
}
