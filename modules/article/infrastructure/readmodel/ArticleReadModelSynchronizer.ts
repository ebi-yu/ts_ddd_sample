import { RedisClient } from '@shared/client/RedisClient.ts';
import type { IArticleReadModelSynchronizer } from 'modules/article/application/adapters/outbound/IArticleReadModelSynchronizer.ts';
import {
  EVENT_TYPE,
  type ArticleEvent,
  type ChangeContentEventData,
  type ChangeTitleEventData,
  type CreateEventData,
} from 'modules/article/domain/events/index.ts';
import { RedisKeys, STATUS, type ArticleReadModel } from './ArticleReadModel.ts';

type RedisLikeClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  sAdd(key: string, member: string): Promise<unknown>;
  sRem(key: string, member: string): Promise<unknown>;
  hSet(key: string, field: string, value: string): Promise<unknown>;
  hDel(key: string, field: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

/*
 * 記事のReadModel(読み取り用モデル)をイベントに応じてRedisへ同期するコンポーネント
 */
export class ArticleReadModelSynchronizer implements IArticleReadModelSynchronizer {
  constructor(private readonly redis = RedisClient.getInstance()) {}

  /*
   * Redis上に存在する記事のReadModel(読み取り用モデル)を記事のドメインイベントに基づいて更新する
   */
  async upsert(event: ArticleEvent): Promise<void> {
    await this.redis.connect();
    const client = this.redis.getClient() as RedisLikeClient;

    const articleIdValue = event.getArticleId().value;
    const key = RedisKeys.article(articleIdValue);

    if (event.getType() === EVENT_TYPE.DELETE) {
      throw new Error('DELETE event must be processed via delete()');
    }

    // 現在の記事のReadModelを取得
    const currentJson = await client.get(key);
    const current = currentJson ? (JSON.parse(currentJson) as ArticleReadModel) : null;

    // upsert後の記事のReadModelを構築
    const next = this.buildNextState(current, event);

    // 記事のReadModelを更新
    await client.set(key, JSON.stringify(next));

    // 全記事のキーを管理するセットに追加
    // 一覧・全件取得用
    await client.sAdd(RedisKeys.allArticles(), key);

    // ステータス別の記事一覧を更新
    // ステータスが変わっていれば、前のステータスのデータを削除
    if (current && current.status !== next.status) {
      await client.hDel(RedisKeys.articlesByStatus(current.status), next.id);
    }

    // ステータス別の記事一覧に追加・更新
    await client.hSet(
      RedisKeys.articlesByStatus(next.status),
      next.id,
      JSON.stringify({ title: next.title, updatedAt: next.updatedAt }),
    );
  }

  async delete(event: ArticleEvent): Promise<void> {
    if (event.getType() !== EVENT_TYPE.DELETE) {
      throw new Error('delete() only accepts DELETE events');
    }

    await this.redis.connect();
    const client = this.redis.getClient() as RedisLikeClient;

    const articleIdValue = event.getArticleId().value;
    const key = RedisKeys.article(articleIdValue);

    // 現在の記事のReadModelを取得
    const currentJson = await client.get(key);
    const current = currentJson ? (JSON.parse(currentJson) as ArticleReadModel) : null;

    await this.deleteFromRedis(client, key, articleIdValue, current);
  }

  private async deleteFromRedis(
    client: RedisLikeClient,
    key: string,
    articleId: string,
    current: ArticleReadModel | null,
  ): Promise<void> {
    // 記事のReadModelを削除
    await client.del(key);
    // ステータス別の記事統計情報を削除
    await client.del(RedisKeys.articleStats(articleId));
    // 全記事のキーを管理するセットから削除
    await client.sRem(RedisKeys.allArticles(), key);

    if (current) {
      // ステータス別の記事一覧から削除
      await client.hDel(RedisKeys.articlesByStatus(current.status), articleId);
      return;
    }

    // 現在の状態が不明な場合、全ステータスの記事一覧から削除
    await Promise.all(
      Object.values(STATUS).map((status) =>
        client.hDel(RedisKeys.articlesByStatus(status), articleId),
      ),
    );
  }

  /*
   * 現在の状態とイベントに基づいて次のReadModelの状態を構築する
   */
  private buildNextState(current: ArticleReadModel | null, event: ArticleEvent): ArticleReadModel {
    const occurredAt = event.getEventDate().toISOString();

    if (event.getType() === EVENT_TYPE.CREATE) {
      const { title, content } = event.getData() as CreateEventData;
      return {
        id: event.getArticleId().value,
        title: title.value,
        content: content.value,
        authorId: event.getAuthorId().value,
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
