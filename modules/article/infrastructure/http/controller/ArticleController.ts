import type { ICreateArticleUseCase } from 'modules/article/application/adapters/inbound/ICreateArticleUseCase.ts';
import type { ISearchArticleUseCase } from 'modules/article/application/adapters/inbound/ISearchArticleUseCase.ts';
import type { CreateArticleDtoType } from 'modules/article/application/dto/input/CreateArticleDTO.ts';
import type { GetArticlesQueryDto } from 'modules/article/application/dto/input/GetArticlesQueryDto.ts';
import type { ArticleReadModelDTO } from 'modules/article/application/dto/output/ArticleReadModelDTO.ts';

export class ArticleController {
  constructor(
    private createArticleUseCase: ICreateArticleUseCase,
    private searchArticleUseCase: ISearchArticleUseCase,
  ) {}

  getArticles(articleIds: GetArticlesQueryDto): Promise<ArticleReadModelDTO[]> {
    return this.searchArticleUseCase.execute(articleIds.ids);
  }

  postArticle(article: CreateArticleDtoType): Promise<string> {
    return this.createArticleUseCase.execute(article);
  }
}
