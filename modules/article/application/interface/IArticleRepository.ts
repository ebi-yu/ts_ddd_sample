import type { Article } from "modules/article/domain/Article.ts";
import type { ArticleId } from "modules/article/domain/index.ts";

export interface IArticleRepository {
  create(article: Article): Promise<void>;
  findById(id: ArticleId): Promise<Article | null>;
  update(article: Article): Promise<void>;
  delete(id: ArticleId): Promise<void>;
}
