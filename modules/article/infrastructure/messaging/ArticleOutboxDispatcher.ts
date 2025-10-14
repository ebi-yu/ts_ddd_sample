import { OutboxStatus, PrismaClient } from '@prisma/client';
import { ArticleEventPrimitiveMapper } from '../mapper/ArticleEventPrimitiveMapper.ts';
import type { ArticleEventPrimitive } from '../mapper/ArticleEventPrimitiveMapper.ts';
import { KafkaDomainEventPublisher } from './KafkaArticleDomainEventPublisher.ts';
import { createKafkaDomainEventPublisher } from './index.ts';

const defaultPrismaClient = new PrismaClient();
const DEFAULT_BATCH_SIZE = Number.parseInt(process.env.OUTBOX_BATCH_SIZE ?? '10', 10);
const DEFAULT_RETRY_DELAY_MS = Number.parseInt(process.env.OUTBOX_RETRY_DELAY_MS ?? '5000', 10);
const DEFAULT_MAX_ATTEMPTS = Number.parseInt(process.env.OUTBOX_MAX_ATTEMPTS ?? '5', 10);
const OUTBOX_CONTEXT = 'article';

export type ArticleOutboxDispatcherOptions = {
  batchSize?: number;
  retryDelayMs?: number;
  maxAttempts?: number;
};

export class ArticleOutboxDispatcher {
  private readonly batchSize: number;
  private readonly retryDelayMs: number;
  private readonly maxAttempts: number;

  private readonly topic: string;
  private readonly publisher: KafkaDomainEventPublisher;

  constructor(
    private readonly prisma: PrismaClient = defaultPrismaClient,
    topic?: string,
    publisher?: KafkaDomainEventPublisher,
    options: ArticleOutboxDispatcherOptions = {},
  ) {
    this.topic = topic ?? process.env.ARTICLE_EVENT_TOPIC ?? 'article-events';
    this.publisher = publisher ?? createKafkaDomainEventPublisher(this.topic);
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  }

  async dispatch(): Promise<void> {
    const now = new Date();
    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: {
        context: OUTBOX_CONTEXT,
        topic: this.topic,
        status: OutboxStatus.PENDING,
        availableAt: {
          lte: now,
        },
      },
      orderBy: { createdAt: 'asc' },
      take: this.batchSize,
    });

    if (pendingEvents.length === 0) {
      return;
    }

    for (const record of pendingEvents) {
      const payload = record.payload as ArticleEventPrimitive | null;
      if (!payload) {
        await this.markAsFailed(record.id, record.attempts, 'Outbox payload is empty');
        continue;
      }

      try {
        const event = ArticleEventPrimitiveMapper.fromPrimitive(payload);
        await this.publisher.publish(event);
        await this.prisma.outboxEvent.update({
          where: { id: record.id },
          data: {
            status: OutboxStatus.SENT,
            sentAt: new Date(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.reschedule(record.id, record.attempts, message);
      }
    }
  }

  async shutdown(): Promise<void> {
    await this.publisher.disconnect();
    await this.prisma.$disconnect?.();
  }

  private async reschedule(id: string, attempts: number, lastError: string): Promise<void> {
    const nextAttempts = attempts + 1;
    const isFailed = nextAttempts >= this.maxAttempts;

    const data: Record<string, unknown> = {
      status: isFailed ? OutboxStatus.FAILED : OutboxStatus.PENDING,
      attempts: nextAttempts,
      lastError,
    };

    if (!isFailed) {
      data.availableAt = new Date(Date.now() + this.retryDelayMs);
    }

    await this.prisma.outboxEvent.update({
      where: { id },
      data,
    });
  }

  private async markAsFailed(id: string, attempts: number, lastError: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxStatus.FAILED,
        attempts: attempts + 1,
        lastError,
      },
    });
  }
}
