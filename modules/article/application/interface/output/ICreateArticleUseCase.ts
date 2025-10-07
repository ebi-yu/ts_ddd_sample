export interface ICreateArticleUseCase {
  execute(article: { title: string; content: string; authorId: string }): Promise<void>;
}
