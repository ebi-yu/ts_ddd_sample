import type { ICreateArticleUseCase } from 'modules/article/application/adapters/inbound/ICreateArticleUseCase.ts';
import type { IDeleteArticleUseCase } from 'modules/article/application/adapters/inbound/IDeleteArticleUseCase.ts';
import type { ISearchArticleUseCase } from 'modules/article/application/adapters/inbound/ISearchArticleUseCase.ts';
import type { CreateArticleDtoType } from 'modules/article/application/dto/input/CreateArticleDTO.ts';
import type { DeleteArticleDtoType } from 'modules/article/application/dto/input/DeleteArticleDTO.ts';
import type { GetArticleDtoType } from 'modules/article/application/dto/input/GetArticleDTO.ts';
import type { ArticleReadModelDTO } from 'modules/article/application/dto/output/ArticleReadModelDTO.ts';

export class ArticleController {
  constructor(
    private createArticleUseCase: ICreateArticleUseCase,
    private searchArticleUseCase: ISearchArticleUseCase,
    private deleteArticleUseCase: IDeleteArticleUseCase,
  ) {}

  getArticles(dto: GetArticleDtoType): Promise<ArticleReadModelDTO[]> {
    return this.searchArticleUseCase.execute(dto);
  }

  postArticle(article: CreateArticleDtoType): Promise<string> {
    return this.createArticleUseCase.execute(article);
  }

  deleteArticle(dto: DeleteArticleDtoType): Promise<void> {
    return this.deleteArticleUseCase.execute(dto);
  }
}
