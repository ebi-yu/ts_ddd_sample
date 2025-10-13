import type { ArticleReadModelDTO } from '../outbound/IArticleReadModelQuery.ts';

export interface ISearchArticleUseCase {
  execute(articleIds: string[]): Promise<ArticleReadModelDTO[]>;
}
