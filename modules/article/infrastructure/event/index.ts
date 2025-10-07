import { startArticleReadModelConsumer } from './ArticleReadModelKafkaConsumer.ts';
import { KafkaDomainEventPublisher } from './KafkaDomainEventPublisher.ts';

const DEFAULT_TOPIC = 'article-events';
const DEFAULT_GROUP_ID = 'article-read-model';

function parseBrokers(): string[] {
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    return ['localhost:9092'];
  }
  return brokers.split(',').map((broker) => broker.trim());
}

export function createKafkaDomainEventPublisher(
  topic: string = process.env.ARTICLE_EVENT_TOPIC ?? DEFAULT_TOPIC,
): KafkaDomainEventPublisher {
  const brokers = parseBrokers();
  const publisher = new KafkaDomainEventPublisher(brokers, topic);
  return publisher;
}

export async function bootstrapArticleReadModelSubscriber(
  topic: string = process.env.ARTICLE_EVENT_TOPIC ?? DEFAULT_TOPIC,
  groupId: string = process.env.ARTICLE_READ_MODEL_GROUP_ID ?? DEFAULT_GROUP_ID,
): Promise<void> {
  const brokers = parseBrokers();
  await startArticleReadModelConsumer({
    brokers,
    topic,
    groupId,
  });
}
