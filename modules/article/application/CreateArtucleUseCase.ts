import { Article, ArticleId, AuthorId, Content, Title } from '../domain/index.ts';
import type { IArticleRepository } from './interface/input/IArticleEventRepository.ts';
import type { IDomainEventPublisher } from './interface/input/IDomainEventPublisher.ts';
import type { ICreateArticleUseCase } from './interface/output/ICreateArticleUseCase.ts';
/*
 * 記事作成ユースケース
 */
export class CreateArticleUseCase implements ICreateArticleUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly domainEventPublisher: IDomainEventPublisher,
  ) {}

  async execute(article: { title: string; content: string; authorId: string }): Promise<void> {
    // Articleエンティティの生成
    const newArticle = Article.create({
      id: new ArticleId(),
      title: new Title(article.title),
      content: new Content(article.content),
      authorId: new AuthorId(article.authorId),
    });

    // リポジトリを通じて永続化
    await this.articleRepository.create(newArticle);

    // Kafkaを通じてドメインイベントを配信
    await this.domainEventPublisher.publish(newArticle.getCurrentEvent());
  }
}
