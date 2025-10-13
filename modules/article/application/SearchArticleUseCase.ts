import type { ISearchArticleUseCase } from './adapters/inbound/ISearchArticleUseCase.ts';
import type { IArticleReadModelQuery } from './adapters/outbound/IArticleReadModelQuery.ts';
import type { ArticleReadModelDTO } from './dto/output/ArticleReadModelDTO.ts';

export class SearchArticleUseCase implements ISearchArticleUseCase {
  constructor(private readonly articleReadModelQuery: IArticleReadModelQuery) {}

  async execute(articleIds: string[]): Promise<ArticleReadModelDTO[]> {
    return this.articleReadModelQuery.findManyByIds(articleIds);
  }
}
