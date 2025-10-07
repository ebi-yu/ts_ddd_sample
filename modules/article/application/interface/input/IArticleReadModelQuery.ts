export type ArticleReadModelDTO = {
  id: string;
  title: string | null;
  content: string | null;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export interface IArticleReadModelQuery {
  findManyByIds(articleIds: string[]): Promise<ArticleReadModelDTO[]>;
}
