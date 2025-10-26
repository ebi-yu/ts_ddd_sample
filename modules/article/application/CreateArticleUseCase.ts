import { ConflictException } from '@shared/utils/exception/ConflictException.ts';
import { Article, ArticleId, AuthorId, Content, Title } from '../domain/index.ts';
import type { ICreateArticleUseCase } from './adapters/inbound/ICreateArticleUseCase.ts';
import type { IArticleEventCommandRepository } from './adapters/outbound/IArticleEventCommandRepository.ts';
import type { IDomainEventPublisher } from './adapters/outbound/IDomainEventPublisher.ts';
import type { CreateArticleDtoType } from './dto/input/CreateArticleDTO.ts';

/*
 * 記事作成ユースケース
 */
export class CreateArticleUseCase implements ICreateArticleUseCase {
  constructor(
    private readonly articleEventCommandRepository: IArticleEventCommandRepository,
    private readonly domainEventPublisher: IDomainEventPublisher,
  ) {}

  async execute(article: CreateArticleDtoType): Promise<string> {
    // Articleエンティティの生成
    const newArticle = Article.create({
      id: new ArticleId(),
      title: new Title(article.title),
      content: new Content(article.content),
      authorId: new AuthorId(article.authorId),
    });

    const isDuplicate = await this.articleEventCommandRepository.checkDuplicate({
      authorId: newArticle.getAuthorId().value,
      title: newArticle.getCurrentTitle()?.value ?? article.title,
    });

    if (isDuplicate) {
      throw new ConflictException('Same Title and Author ID Article already exists');
    }

    // リポジトリを通じて永続化
    await this.articleEventCommandRepository.create(newArticle);

    // Kafkaを通じてドメインイベントを配信
    await this.domainEventPublisher.publish(newArticle.getCurrentEvent());

    return newArticle.getId().value;
  }
}
