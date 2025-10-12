export const STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// 読み取り専用の記事モデルの型
export interface ArticleReadModel {
  id: string;
  title: string | null;
  content: string | null;
  authorId: string;
  status: ArticleStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type ArticleStatus = (typeof STATUS)[keyof typeof STATUS];

// 統計情報用の型
export interface ArticleStats {
  viewCount: number;
  lastViewedAt?: string;
}

// Redis キー生成用のユーティリティ型
export type ArticleRedisKey = `article:${string}`;
export type AuthorArticlesKey = `author:${string}:articles`;
export type ArticlesByStatusKey = `articles:status:${ArticleStatus}`;
export type ArticleStatsKey = `article:${string}:stats`;

// Redis キー生成関数
export const RedisKeys = {
  article: (articleId: string): ArticleRedisKey => `article:${articleId}`,
  authorArticles: (authorId: string): AuthorArticlesKey => `author:${authorId}:articles`,
  articlesByStatus: (status: ArticleStatus): ArticlesByStatusKey => `articles:status:${status}`,
  articleStats: (articleId: string): ArticleStatsKey => `article:${articleId}:stats`,
  allArticles: () => 'articles:all' as const,
} as const;
