import type { ArticleReadModelDTO } from '../input/IArticleReadModelQuery.ts';

export interface ISearchArticleUseCase {
  execute(articleIds: string[]): Promise<ArticleReadModelDTO[]>;
}
