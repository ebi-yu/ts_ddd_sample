import { resolveKafkaBrokers } from '@shared/infrastructure/Kafka.ts';
import { ArticleReadModelProjector } from '../readmodel/ArticleReadModelProjector.ts';
import { KafkaArticleEventSubscriber } from './KafkaArticleEventSubscriber.ts';
import { KafkaDomainEventPublisher } from './KafkaDomainEventPublisher.ts';

const DEFAULT_TOPIC = 'article-events';
const DEFAULT_GROUP_ID = 'article-read-model';

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
  const subscriber = new KafkaArticleEventSubscriber(brokers, topic, groupId);
  const projector = new ArticleReadModelProjector();

  await subscriber.subscribe(async (event) => {
    await projector.project(event);
  });
}
