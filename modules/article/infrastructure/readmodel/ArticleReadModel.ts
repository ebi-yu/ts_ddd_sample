export const STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ArticleStatus = (typeof STATUS)[keyof typeof STATUS];

export interface ArticleReadModel {
  id: string; // ArticleId (UUID)
  title: string | null;
  content: string | null;
  authorId: string;
  status: ArticleStatus;
  version: number; // 楽観的ロック用
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publishedAt?: string; // 公開日時 (公開済みの場合のみ)
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

// 統計情報用の型
export interface ArticleStats {
  viewCount: number;
  lastViewedAt?: string;
}
