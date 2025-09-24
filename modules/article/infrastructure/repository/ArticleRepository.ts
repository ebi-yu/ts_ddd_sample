import { PrismaClient } from "@prisma/client";
import type { IArticleRepository } from "modules/article/application/interface/IArticleRepository.ts";
import type { Article } from "modules/article/domain/Article.ts";
import type { ArticleId } from "modules/article/domain/index.ts";

const database = new PrismaClient();

class ArticleRepository implements IArticleRepository {
  async create(article: Article): Promise<void> {
    // データベースに記事を保存する処理
    await database.article.create({ data: article });
  }

  async findById(id: ArticleId): Promise<Article | null> {
    // データベースから記事を取得する処理
  }

  async update(article: Article): Promise<void> {
    // データベースの記事を更新する処理
  }

  async delete(id: ArticleId): Promise<void> {
    // データベースから記事を削除する処理
  }
}
