import { ArticleReadModelProjector } from '../readmodel/ArticleReadModelProjector.ts';
import { KafkaArticleEventSubscriber } from './KafkaArticleEventSubscriber.ts';

export type ArticleReadModelConsumerConfig = {
  brokers: string[];
  topic: string;
  groupId: string;
};

export async function startArticleReadModelConsumer(
  config: ArticleReadModelConsumerConfig,
  projector = new ArticleReadModelProjector(),
): Promise<void> {
  const subscriber = new KafkaArticleEventSubscriber(config.brokers, config.topic, config.groupId);

  await subscriber.subscribe(async (event) => {
    await projector.project(event);
  });
}
