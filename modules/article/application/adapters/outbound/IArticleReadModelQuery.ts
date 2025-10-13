import type { ArticleReadModelDTO } from '../../dto/output/ArticleReadModelDTO.ts';

export interface IArticleReadModelQuery {
  findManyByIds(articleIds: string[]): Promise<ArticleReadModelDTO[]>;
}
