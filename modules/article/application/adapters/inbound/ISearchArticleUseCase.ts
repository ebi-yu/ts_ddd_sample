import type { ArticleReadModelDTO } from '../../dto/output/ArticleReadModelDTO.ts';

export interface ISearchArticleUseCase {
  execute(articleIds: string[]): Promise<ArticleReadModelDTO[]>;
}
