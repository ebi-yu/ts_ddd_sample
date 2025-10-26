import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient, type RedisClientType } from 'redis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const isE2ERun = process.env.E2E === '1' || process.env.E2E === 'true';
const SERVER_URL = process.env.E2E_SERVER_URL;
const POLLING_INTERVAL_MS = 1_000;
const TIMEOUT_MS = 30_000;

const prisma = new PrismaClient();
let redisClient: RedisClientType;

const redisUrl = `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? '6379'}`;

async function cleanupState(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "article_events" RESTART IDENTITY CASCADE');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "outbox_events" RESTART IDENTITY CASCADE');

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
  }

  const keys = await redisClient.keys('article*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  const statusKeys = await redisClient.keys('articles:*');
  if (statusKeys.length > 0) {
    await redisClient.del(statusKeys);
  }
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // ignore until timeout
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Server did not become ready within ${timeoutMs}ms`);
    }
    await delay(POLLING_INTERVAL_MS);
  }
}

async function fetchReadModels(articleId: string): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${SERVER_URL}/articles?ids=${articleId}`);
  return (await response.json()) as Array<Record<string, unknown>>;
}

async function waitForReadModelUpsert(
  articleId: string,
  timeoutMs: number,
): Promise<Array<Record<string, unknown>>> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const readModels = await fetchReadModels(articleId);
    if (
      Array.isArray(readModels) &&
      readModels.length > 0 &&
      readModels.some((model) => model?.id === articleId)
    ) {
      return readModels;
    }
    await delay(POLLING_INTERVAL_MS);
  }
  throw new Error(`Read model was not updated within ${timeoutMs}ms for article ${articleId}`);
}

async function waitForReadModelDeletion(articleId: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start <= timeoutMs) {
    const readModels = await fetchReadModels(articleId);
    if (Array.isArray(readModels) && readModels.length === 0) {
      return;
    }
    await delay(POLLING_INTERVAL_MS);
  }
  throw new Error(`Read model entry ${articleId} was not removed within ${timeoutMs}ms`);
}

const describeOrSkip = isE2ERun ? describe : describe.skip;

describeOrSkip('記事のE2Eフロー', () => {
  beforeAll(async () => {
    await waitForServer(`${SERVER_URL}/`, TIMEOUT_MS);
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
    await cleanupState();
  }, TIMEOUT_MS);

  beforeEach(async () => {
    await cleanupState();
  });

  it(
    '記事作成からReadModel更新、取得、削除までの一連の流れを検証する',
    async () => {
      // Arrange
      const articlePayload = {
        title: 'E2E Test Article',
        content: 'Event-driven flow validation.',
        authorId: randomUUID(),
      };

      // Act : 記事の作成
      const createResponse = await fetch(`${SERVER_URL}/articles`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(articlePayload),
      });

      // Assert : 記事が作成され、記事取得APIで取得できることを確認
      const { id: articleId } = (await createResponse.json()) as { id: string };
      const readModels = await waitForReadModelUpsert(articleId, TIMEOUT_MS);
      expect(createResponse.ok).toBe(true);
      expect(Array.isArray(readModels)).toBe(true);
      expect(readModels.length).toBeGreaterThan(0);
      expect(readModels[0]).toMatchObject({
        id: articleId,
        title: articlePayload.title,
        content: articlePayload.content,
      });

      // Act : 記事の削除
      await fetch(`${SERVER_URL}/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Assert : 記事が削除され、記事取得APIで取得できないことを確認
      await waitForReadModelDeletion(articleId, TIMEOUT_MS);
    },
    TIMEOUT_MS,
  );

  afterAll(async () => {
    await cleanupState();
    await prisma.$disconnect();
    if (redisClient) {
      await redisClient.quit();
    }
  });
});
