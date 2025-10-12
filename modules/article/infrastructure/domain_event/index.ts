import { resolveKafkaBrokers } from '@shared/infrastructure/Kafka.ts';
import { ArticleReadModelProjector } from '../readmodel/ArticleReadModelProjector.ts';
import { KafkaDomainEventPublisher } from './KafkaArticleDomainEventPublisher.ts';
import { KafkaArticleDomainEventSubscriber } from './KafkaArticleDomainEventSubscriber.ts';

const DEFAULT_TOPIC = 'article-events';
const DEFAULT_GROUP_ID = 'article-read-model';
const DEFAULT_DEAD_LETTER_TOPIC = 'article-events-dead-letter';

/*
 * Kafkaを利用した記事のドメインイベント発行者を生成
 */
export function createKafkaDomainEventPublisher(
  topic: string = process.env.ARTICLE_EVENT_TOPIC ?? DEFAULT_TOPIC,
): KafkaDomainEventPublisher {
  const brokers = resolveKafkaBrokers();
  const publisher = new KafkaDomainEventPublisher(brokers, topic);
  return publisher;
}

/*
 * 記事のReadModel(読み取り用モデル)の更新用のイベント購読者を起動
 * 購読者の起動はAPIサーバーとは別のプロセスで行うことが推奨されます。
 */
export async function bootstrapArticleReadModelSubscriber(
  topic: string = process.env.ARTICLE_EVENT_TOPIC ?? DEFAULT_TOPIC,
  groupId: string = process.env.ARTICLE_READ_MODEL_GROUP_ID ?? DEFAULT_GROUP_ID,
): Promise<void> {
  const brokers = resolveKafkaBrokers();
  const subscriber = new KafkaArticleDomainEventSubscriber(brokers, topic, groupId, {
    maxRetries: parsePositiveInteger(process.env.ARTICLE_EVENT_MAX_RETRIES),
    retryDelayMs: parsePositiveInteger(process.env.ARTICLE_EVENT_RETRY_DELAY_MS),
    deadLetterTopic: resolveDeadLetterTopic(),
  });
  const projector = new ArticleReadModelProjector();

  await subscriber.subscribe(async (event) => {
    await projector.project(event);
  });
}

const parsePositiveInteger = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return undefined;
  return parsed;
};

const resolveDeadLetterTopic = (): string | null => {
  const raw = process.env.ARTICLE_EVENT_DEAD_LETTER_TOPIC;
  if (raw === undefined) {
    return DEFAULT_DEAD_LETTER_TOPIC;
  }

  if (raw.trim().length === 0) {
    return null;
  }

  return raw;
};

export { ArticleEventPrimitiveMapper } from '../mapper/ArticleEventPrimitiveMapper.ts';
