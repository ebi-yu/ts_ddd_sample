import {
  Article,
  ArticleId,
  AuthorUserId,
  Content,
  Title,
} from "../domain/index.ts";
import type { IArticleRepository } from "./interface/IArticleRepository.ts";

export class CreateArticleUseCase {
  constructor(private readonly articleRepository: IArticleRepository) {}

  async create(article: {
    title: string;
    content: string;
    authorId: string;
  }): Promise<void> {
    // Articleエンティティの生成
    const newArticle = Article.create({
      id: new ArticleId(),
      title: new Title(article.title),
      content: new Content(article.content),
      authorId: new AuthorUserId(article.authorId),
    });

    // リポジトリを通じて永続化
    await this.articleRepository.create(newArticle);
  }
}
