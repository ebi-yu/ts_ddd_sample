import { ArticleEventType, PrismaClient } from '@prisma/client';
import type { IArticleRepository } from 'modules/article/application/adapters/outbound/IArticleEventRepository.ts';
import type { Article } from 'modules/article/domain/Article.ts';
import type { ArticleId } from 'modules/article/domain/index.ts';
import { ArticleEventPrimitiveMapper } from '../mapper/ArticleEventPrimitiveMapper.ts';

const resolveTitle = (eventType: ArticleEventType, rawEventData: string): string | null => {
  const parsed = safeJsonParse(rawEventData);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const data = parsed as Record<string, unknown>;

  if (eventType === ArticleEventType.CREATE) {
    return extractTitleValue(data['title']);
  }

  if (eventType === ArticleEventType.CHANGE_TITLE) {
    return extractTitleValue(data['newTitle']);
  }

  return null;
};

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractTitleValue = (raw: unknown): string | null => {
  const trimOrNull = (value: string | null): string | null => {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  if (typeof raw === 'string') {
    return trimOrNull(raw);
  }

  if (raw && typeof raw === 'object' && '_value' in raw) {
    const candidate = (raw as { _value?: unknown })._value;
    if (typeof candidate === 'string') {
      return trimOrNull(candidate);
    }
  }

  return null;
};

// NOTE : データの永続化自体はPostgreSQLを利用するが、データの読み取りにはRedisを利用する
// そのため、記事のReadModel(読み取り用モデル)の更新はRedisに対して行い、記事のドメインイベントの保存はPostgreSQLに対して行う
// これにより、読み取りと書き込みの責務を分離(CQRS)し、システムのパフォーマンスとスケーラビリティを向上させることができる

const database = new PrismaClient();

export class ArticleEventRepository implements IArticleRepository {
  /*
   * 記事のドメインイベントを保存する
   */
  async create(article: Article): Promise<void> {
    const primitive = ArticleEventPrimitiveMapper.toPrimitive(article.getCurrentEvent());

    await database.articleEventEntity.create({
      data: {
        articleId: article.getId().value,
        authorId: article.getAuthorId().value,
        eventType: primitive.type,
        eventData: JSON.stringify(primitive.data),
        version: primitive.version,
      },
    });
  }

  async checkDuplicate({ authorId, title }: { authorId: string; title: string }): Promise<boolean> {
    const normalizedTitle = title.trim();

    if (normalizedTitle.length === 0) {
      return false;
    }

    const events = await database.articleEventEntity.findMany({
      where: {
        authorId,
        eventType: {
          in: [ArticleEventType.CREATE, ArticleEventType.CHANGE_TITLE],
        },
      },
      orderBy: [{ articleId: 'asc' }, { version: 'desc' }],
      select: {
        articleId: true,
        eventType: true,
        eventData: true,
      },
    });

    const processed = new Set<string>();
    for (const event of events) {
      if (processed.has(event.articleId)) {
        continue;
      }

      const candidateTitle = resolveTitle(event.eventType, event.eventData);
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
    await database.articleEventEntity.deleteMany({
      where: {
        articleId: articleId.value,
      },
    });
  }
}
