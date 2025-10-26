import type { GetArticleDtoType } from '../../dto/input/GetArticleDTO.ts';
import type { ArticleReadModelDTO } from '../../dto/output/ArticleReadModelDTO.ts';

export interface ISearchArticleUseCase {
  execute(dto: GetArticleDtoType): Promise<ArticleReadModelDTO[]>;
}
