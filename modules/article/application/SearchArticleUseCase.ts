import type { ArticleReadModelDTO } from './dto/output/ArticleReadModelDTO.ts';
import type { IArticleReadModelQuery } from './interface/input/IArticleReadModelQuery.ts';
import type { ISearchArticleUseCase } from './interface/output/ISearchArticleUseCase.ts';

export class SearchArticleUseCase implements ISearchArticleUseCase {
  constructor(private readonly articleReadModelQuery: IArticleReadModelQuery) {}

  async execute(articleIds: string[]): Promise<ArticleReadModelDTO[]> {
    return this.articleReadModelQuery.findManyByIds(articleIds);
  }
}
