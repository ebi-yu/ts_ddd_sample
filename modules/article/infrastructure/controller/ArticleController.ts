import type { ICreateArticleUseCase } from 'modules/article/application/interface/output/ICreateArticleUseCase.ts';
import type { ISearchArticleUseCase } from 'modules/article/application/interface/output/ISearchArticleUseCase.ts';

export class ArticleController {
  constructor(
    private createArticleUseCase: ICreateArticleUseCase,
    private searchArticleUseCase: ISearchArticleUseCase,
  ) {}

  getArticles(articleIds: string | string[]) {
    return this.searchArticleUseCase.execute(Array.isArray(articleIds) ? articleIds : [articleIds]);
  }

  postArticle(article: { title: string; content: string; authorId: string }) {
    return this.createArticleUseCase.execute(article);
  }
}
