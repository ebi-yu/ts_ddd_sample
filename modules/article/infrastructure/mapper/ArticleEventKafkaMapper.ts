import type { ArticleEvent } from 'modules/article/domain/article_events/index.ts';
import {
  ArticleEventPrimitiveMapper,
  type ArticleEventPrimitive,
} from './ArticleEventPrimitiveMapper.ts';

export type SerializedArticleEvent = ArticleEventPrimitive;

/*
 * ArticleEventをKafkaで送受信可能な形式にシリアライズ(変換)する
 */
export function serializeArticleEvent(event: ArticleEvent): SerializedArticleEvent {
  return ArticleEventPrimitiveMapper.toPrimitive(event);
}

/*
 * Kafkaで送受信した形式のデータをArticleEventにデシリアライズ(復元)する
 */
export function deserializeArticleEvent(serialized: SerializedArticleEvent): ArticleEvent {
  return ArticleEventPrimitiveMapper.fromPrimitive(serialized);
}

export function parseArticleEventMessage(message: string): ArticleEvent {
  const payload = JSON.parse(message) as SerializedArticleEvent;
  return deserializeArticleEvent(payload);
}
