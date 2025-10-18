import { ArticleEventType, OutboxStatus, PrismaClient, type Prisma } from '@prisma/client';
import type { IArticleRepository } from 'modules/article/application/adapters/outbound/IArticleEventRepository.ts';
import { Article } from 'modules/article/domain/Article.ts';
import type { CreateEventData } from 'modules/article/domain/events/ArticleCreateEvent.ts';
import { EVENT_TYPE, type EventType } from 'modules/article/domain/events/ArticleEventBase.ts';
import type { ChangeTitleEventData } from 'modules/article/domain/events/ArticleTitleChangeEvent.ts';
import type { ArticleId } from 'modules/article/domain/index.ts';
import type { ArticleEventPrimitive } from '../mapper/ArticleEventPrimitiveMapper.ts';
import { ArticleEventPrimitiveMapper } from '../mapper/ArticleEventPrimitiveMapper.ts';

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// NOTE : データの永続化自体はPostgreSQLを利用するが、データの読み取りにはRedisを利用する
// そのため、記事のReadModel(読み取り用モデル)の更新はRedisに対して行い、記事のドメインイベントの保存はPostgreSQLに対して行う
// これにより、読み取りと書き込みの責務を分離(CQRS)し、システムのパフォーマンスとスケーラビリティを向上させることができる

const defaultPrismaClient = new PrismaClient();
const ARTICLE_OUTBOX_CONTEXT = 'article';
const DEFAULT_OUTBOX_TOPIC = process.env.ARTICLE_EVENT_TOPIC ?? 'article-events';

export class ArticleEventRepository implements IArticleRepository {
  constructor(
    private readonly prisma: PrismaClient = defaultPrismaClient,
    private readonly outboxTopic: string = DEFAULT_OUTBOX_TOPIC,
  ) {}

  /*
   * 記事のドメインイベントを保存する
   */
  async create(article: Article): Promise<void> {
    const primitive = ArticleEventPrimitiveMapper.toPrimitive(article.getCurrentEvent());
    const payload = JSON.parse(JSON.stringify(primitive)) as Prisma.InputJsonValue;

    await this.prisma.$transaction(async (tx) => {
      await tx.articleEventEntity.create({
        data: {
          articleId: article.getId().value,
          authorId: article.getAuthorId().value,
          eventType: primitive.type,
          eventData: JSON.stringify(primitive.data),
          version: primitive.version,
        },
      });

      // Outboxパターンでドメインイベントを保存
      // イベントの送信は別プロセスで行う
      await tx.outboxEvent.create({
        data: {
          context: ARTICLE_OUTBOX_CONTEXT,
          topic: this.outboxTopic,
          payload,
          status: OutboxStatus.PENDING,
        },
      });
    });
  }

  async findById(articleId: ArticleId): Promise<Article | null> {
    const persistedEvents = await this.prisma.articleEventEntity.findMany({
      where: { articleId: articleId.value },
      orderBy: [{ version: 'asc' }],
    });

    if (persistedEvents.length === 0) {
      return null;
    }

    const domainEvents = persistedEvents.map((persisted) => {
      const parsedData = safeJsonParse(persisted.eventData);
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid event payload stored for Article');
      }

      const primitive: ArticleEventPrimitive = {
        articleId: persisted.articleId,
        authorId: persisted.authorId,
        type: persisted.eventType as EventType,
        version: persisted.version,
        occurredAt: persisted.createdAt.toISOString(),
        data: parsedData as Record<string, unknown>,
      };

      return ArticleEventPrimitiveMapper.fromPrimitive(primitive);
    });

    return Article.rehydrate(domainEvents);
  }

  async checkDuplicate({ authorId, title }: { authorId: string; title: string }): Promise<boolean> {
    const normalizedTitle = title.trim();

    if (normalizedTitle.length === 0) {
      return false;
    }

    const events = await this.prisma.articleEventEntity.findMany({
      where: {
        authorId,
        eventType: {
          in: [ArticleEventType.CREATE, ArticleEventType.CHANGE_TITLE],
        },
      },
      orderBy: [{ articleId: 'asc' }, { version: 'desc' }],
    });

    const processed = new Set<string>();
    for (const event of events) {
      if (processed.has(event.articleId)) {
        continue;
      }

      const parsedData = safeJsonParse(event.eventData);
      if (!parsedData || typeof parsedData !== 'object') {
        continue;
      }

      const primitive: ArticleEventPrimitive = {
        articleId: event.articleId,
        authorId: event.authorId,
        type: event.eventType as EventType,
        version: event.version,
        occurredAt: event.createdAt.toISOString(),
        data: parsedData as Record<string, unknown>,
      };

      const domainEvent = ArticleEventPrimitiveMapper.fromPrimitive(primitive);
      let candidateTitle: string | null = null;

      if (domainEvent.getType() === EVENT_TYPE.CREATE) {
        const { title } = domainEvent.getData() as CreateEventData;
        candidateTitle = title.value;
      }

      if (domainEvent.getType() === EVENT_TYPE.CHANGE_TITLE) {
        const { newTitle } = domainEvent.getData() as ChangeTitleEventData;
        candidateTitle = newTitle.value;
      }

      if (candidateTitle === null) {
        continue;
      }

      processed.add(event.articleId);

      if (candidateTitle === normalizedTitle) {
        return true;
      }
    }

    return false;
  }

  /*
   * 指定された記事IDに紐づく記事のドメインイベントをすべて削除する
   */
  async deleteAll(articleId: ArticleId): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.articleEventEntity.deleteMany({
        where: {
          articleId: articleId.value,
        },
      });

      await tx.outboxEvent.deleteMany({
        where: {
          payload: {
            path: ['articleId'],
            equals: articleId.value,
          },
          context: ARTICLE_OUTBOX_CONTEXT,
        },
      });
    });
  }
}
