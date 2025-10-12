import { Kafka } from 'kafkajs';
import type { ArticleEvent } from 'modules/article/domain/ArticleEvent.ts';
import { parseArticleEventMessage } from './ArticleEventKafkaMapper.ts';

export type ArticleEventHandler = (event: ArticleEvent) => Promise<void>;

/*
 * Kafkaを利用した記事のドメインイベント購読
 * @param brokerList Kafkaブローカーのリスト
 * @param topic 購読するKafkaトピック
 * @param groupId コンシューマグループID
 */
export class KafkaArticleEventSubscriber {
  private readonly topic: string;
  private readonly groupId: string;
  private readonly brokerList: string[];

  constructor(brokerList: string[], topic: string, groupId: string) {
    this.brokerList = brokerList;
    this.topic = topic;
    this.groupId = groupId;
  }

  /*
   * 指定されたハンドラで記事のドメインイベントを購読する
   */
  async subscribe(handler: ArticleEventHandler): Promise<void> {
    const kafka = new Kafka({ brokers: this.brokerList });
    const consumer = kafka.consumer({ groupId: this.groupId });
    await consumer.connect();
    await consumer.subscribe({ topic: this.topic, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const event = parseArticleEventMessage(message.value.toString());
          await handler(event);
        } catch (err) {
          // エラー処理: ログ出力のみ
          console.error('KafkaArticleEventSubscriber: failed to handle event', err);
        }
      },
    });
  }
}
