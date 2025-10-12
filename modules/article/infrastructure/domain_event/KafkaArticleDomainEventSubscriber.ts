import { Kafka, type Producer } from 'kafkajs';
import type { ArticleEvent } from 'modules/article/domain/article_events/index.ts';
import { parseArticleEventMessage } from '../mapper/ArticleEventKafkaMapper.ts';

export type ArticleEventHandler = (event: ArticleEvent) => Promise<void>;

type KafkaArticleDomainEventSubscriberOptions = {
  maxRetries?: number;
  retryDelayMs?: number;
  deadLetterTopic?: string | null;
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;

/*
 * Kafkaを利用した記事のドメインイベント購読
 * @param brokerList Kafkaブローカーのリスト
 * @param topic 購読するKafkaトピック
 * @param groupId コンシューマグループID
 */
export class KafkaArticleDomainEventSubscriber {
  private readonly topic: string;
  private readonly groupId: string;
  private readonly brokerList: string[];
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly deadLetterTopic: string | null;
  private deadLetterProducer: Producer | null = null;

  constructor(
    brokerList: string[],
    topic: string,
    groupId: string,
    options: KafkaArticleDomainEventSubscriberOptions = {},
  ) {
    this.brokerList = brokerList;
    this.topic = topic;
    this.groupId = groupId;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.deadLetterTopic = options.deadLetterTopic === undefined ? null : options.deadLetterTopic;
  }

  /*
   * 指定されたハンドラで記事のドメインイベントを購読する
   */
  async subscribe(handler: ArticleEventHandler): Promise<void> {
    const kafka = new Kafka({ brokers: this.brokerList });
    const consumer = kafka.consumer({ groupId: this.groupId });
    const shouldUseDeadLetter =
      typeof this.deadLetterTopic === 'string' && this.deadLetterTopic.length > 0;

    await consumer.connect();
    await consumer.subscribe({ topic: this.topic, fromBeginning: true });

    if (shouldUseDeadLetter) {
      this.deadLetterProducer = kafka.producer();
      await this.deadLetterProducer.connect();
    }

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const payload = message.value.toString();
        const key = message.key ? message.key.toString() : null;
        await this.processWithRetry(handler, payload, key);
      },
    });
  }

  /*
   * イベント処理をリトライするためのヘルパーメソッド
   */
  private async processWithRetry(
    handler: ArticleEventHandler,
    payload: string,
    key: string | null,
    attempt = 1,
  ): Promise<void> {
    try {
      const event = parseArticleEventMessage(payload);
      await handler(event);
    } catch (err) {
      if (attempt >= this.maxRetries) {
        console.error('KafkaArticleDomainEventSubscriber: give up handling event', {
          error: err,
          attempt,
        });
        await this.sendToDeadLetter(payload, key, err);
        return;
      }

      console.warn('KafkaArticleDomainEventSubscriber: retrying event handling', {
        error: err,
        attempt,
      });
      const delayMs = this.retryDelayMs * Math.max(1, 2 ** (attempt - 1));
      await this.delay(delayMs);
      await this.processWithRetry(handler, payload, key, attempt + 1);
    }
  }

  private async sendToDeadLetter(
    payload: string,
    key: string | null,
    error: unknown,
  ): Promise<void> {
    if (!this.deadLetterProducer || !this.deadLetterTopic) {
      console.error('KafkaArticleDomainEventSubscriber: dead letter queue not configured', error);
      return;
    }

    try {
      await this.deadLetterProducer.send({
        topic: this.deadLetterTopic,
        messages: [
          {
            key: key ?? undefined,
            value: JSON.stringify({
              originalTopic: this.topic,
              groupId: this.groupId,
              payload,
              error: serializeError(error),
              failedAt: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (deadLetterError) {
      console.error(
        'KafkaArticleDomainEventSubscriber: failed to send message to dead letter topic',
        {
          originalError: error,
          deadLetterError,
        },
      );
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const serializeError = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return { ...error };
  }

  return { message: String(error) };
};
