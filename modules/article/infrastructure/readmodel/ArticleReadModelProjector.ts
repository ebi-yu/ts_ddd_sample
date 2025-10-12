import { RedisClient } from '@shared/infrastructure/RedisClient.ts';
import type { IArticleReadModelProjector } from 'modules/article/application/interface/input/IArticleReadModelProjector.ts';
import {
  EVENT_TYPE,
  type ArticleEvent,
  type ChangeContentEventData,
  type ChangeTitleEventData,
  type CreateEventData,
} from 'modules/article/domain/ArticleEvent.ts';
import { RedisKeys, STATUS, type ArticleReadModel } from './ArticleReadModel.ts';

/*
 * 記事のReadModel(読み取り用モデル)の更新用
 * Redis上に存在する記事のReadModel(読み取り用モデル)を記事のドメインイベントに基づいて更新する
 */
export class ArticleReadModelProjector implements IArticleReadModelProjector {
  constructor(private readonly redis = RedisClient.getInstance()) {}

  /*
   * Redis上に存在する記事のReadModel(読み取り用モデル)を記事のドメインイベントに基づいて更新する
   */
  async project(event: ArticleEvent): Promise<void> {
    await this.redis.connect();
    const client = this.redis.getClient();

    const key = RedisKeys.article(event.getArticleId().toString());
    const currentJson = await client.get(key);
    const current = currentJson ? (JSON.parse(currentJson) as ArticleReadModel) : null;

    const next = this.buildNextState(current, event);

    await client.set(key, JSON.stringify(next));
    await client.sAdd(RedisKeys.allArticles(), key);

    if (current && current.status !== next.status) {
      await client.hDel(RedisKeys.articlesByStatus(current.status), next.id);
    }

    await client.hSet(
      RedisKeys.articlesByStatus(next.status),
      next.id,
      JSON.stringify({ title: next.title, updatedAt: next.updatedAt }),
    );
  }

  /*
   * 現在の状態とイベントに基づいて次のReadModelの状態を構築する
   */
  private buildNextState(current: ArticleReadModel | null, event: ArticleEvent): ArticleReadModel {
    const occurredAt = event.getEventDate().toISOString();

    if (event.getType() === EVENT_TYPE.CREATE) {
      const { title, content, authorId } = event.getData() as CreateEventData;
      return {
        id: event.getArticleId().toString(),
        title: title.value,
        content: content.value,
        authorId: authorId.value,
        status: STATUS.DRAFT,
        version: event.getVersion(),
        createdAt: occurredAt,
        updatedAt: occurredAt,
      };
    }

    if (event.getType() === EVENT_TYPE.CHANGE_TITLE) {
      if (!current) {
        throw new Error('Current state is null for CHANGE_TITLE event');
      }
      const { newTitle } = event.getData() as ChangeTitleEventData;
      return {
        ...current,
        title: newTitle.value,
        version: event.getVersion(),
        updatedAt: occurredAt,
      };
    }

    if (event.getType() === EVENT_TYPE.CHANGE_CONTENT) {
      if (!current) {
        throw new Error('Current state is null for CHANGE_CONTENT event');
      }
      const { newContent } = event.getData() as ChangeContentEventData;
      return {
        ...current,
        content: newContent.value,
        version: event.getVersion(),
        updatedAt: occurredAt,
      };
    }

    if (!current) {
      throw new Error(`Current state is null for ${event.getType()} event`);
    }

    if (event.getType() === EVENT_TYPE.PUBLISH) {
      return {
        ...current,
        status: STATUS.PUBLISHED,
        version: event.getVersion(),
        updatedAt: occurredAt,
        publishedAt: occurredAt,
      };
    }

    if (event.getType() === EVENT_TYPE.ARCHIVE) {
      return {
        ...current,
        status: STATUS.ARCHIVED,
        version: event.getVersion(),
        updatedAt: occurredAt,
      };
    }

    if (event.getType() === EVENT_TYPE.RE_DRAFT) {
      return {
        ...current,
        status: STATUS.DRAFT,
        version: event.getVersion(),
        updatedAt: occurredAt,
        publishedAt: undefined,
      };
    }

    throw new Error(`Unknown event type: ${event.getType()}`);
  }
}
