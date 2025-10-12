import type { Producer } from 'kafkajs';
import { Kafka } from 'kafkajs';
import type { IDomainEventPublisher } from 'modules/article/application/interface/input/IDomainEventPublisher.ts';
import type { ArticleEvent } from 'modules/article/domain/article_events/index.ts';
import { serializeArticleEvent } from '../mapper/ArticleEventKafkaMapper.ts';

/*
 * Kafkaを利用した記事のドメインイベント発行
 */
export class KafkaDomainEventPublisher implements IDomainEventPublisher {
  private readonly producer: Producer;
  private readonly topic: string;
  private isConnected = false;

  constructor(brokerList: string[], topic: string) {
    const kafka = new Kafka({ brokers: brokerList });
    this.producer = kafka.producer();
    this.topic = topic;
  }

  async connect() {
    if (this.isConnected) return;
    await this.producer.connect();
    this.isConnected = true;
  }

  async disconnect() {
    if (!this.isConnected) return;
    await this.producer.disconnect();
    this.isConnected = false;
  }

  async publish(event: ArticleEvent): Promise<void> {
    await this.connect();
    const payload = serializeArticleEvent(event);
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: payload.articleId,
          value: JSON.stringify(payload),
        },
      ],
    });
  }
}
