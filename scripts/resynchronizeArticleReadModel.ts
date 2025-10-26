/*
 * PostgresSQLとRedisのArticle Read Modelを同期するスクリプト
 * うまく削除が反映されていない場合などに実行して、RedisのRead Modelを再構築する
 */

import { PrismaClient } from '@prisma/client';
import { EVENT_TYPE, type EventType } from '../modules/article/domain/events/index.ts';
import {
  ArticleEventPrimitiveMapper,
  type ArticleEventPrimitive,
} from '../modules/article/infrastructure/mapper/ArticleEventPrimitiveMapper.ts';
import { ArticleReadModelSynchronizer } from '../modules/article/infrastructure/readmodel/ArticleReadModelSynchronizer.ts';
import { RedisClient } from '../modules/shared/client/RedisClient.ts';

const prisma = new PrismaClient();
const synchronizer = new ArticleReadModelSynchronizer();
const redis = RedisClient.getInstance();

const log = (message: string) => {
  console.log(`[resync-readmodel] ${message}`);
};

type PersistedEvent = {
  articleId: string;
  authorId: string;
  eventType: string;
  eventData: string;
  version: number;
  createdAt: Date;
};

async function clearRedisReadModel(): Promise<void> {
  await redis.connect();
  const client = redis.getClient();

  const keysToDelete = new Set<string>();

  for await (const key of client.scanIterator({ MATCH: 'article:*' })) {
    keysToDelete.add(String(key));
  }

  for await (const key of client.scanIterator({ MATCH: 'articles:*' })) {
    keysToDelete.add(String(key));
  }

  if (keysToDelete.size === 0) {
    log('Redis read model already empty');
    return;
  }

  const pipeline = client.multi();
  for (const key of keysToDelete) {
    pipeline.del(key);
  }
  await pipeline.exec();
  log(`Cleared ${keysToDelete.size} keys from Redis read model`);
}

async function fetchArticleEvents(): Promise<PersistedEvent[]> {
  return await prisma.articleEventEntity.findMany({
    orderBy: [{ articleId: 'asc' }, { version: 'asc' }],
  });
}

function toPrimitive(event: PersistedEvent): ArticleEventPrimitive {
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(event.eventData);
  } catch (error) {
    throw new Error(
      `Failed to parse event payload for article ${event.articleId} (version ${event.version}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!parsedData || typeof parsedData !== 'object') {
    throw new Error(
      `Invalid payload structure for article ${event.articleId} (version ${event.version})`,
    );
  }

  return {
    articleId: event.articleId,
    authorId: event.authorId,
    type: event.eventType as EventType,
    version: event.version,
    occurredAt: event.createdAt.toISOString(),
    data: parsedData as Record<string, unknown>,
  };
}

async function rebuild(): Promise<void> {
  log('Starting resynchronization of article read model');
  await clearRedisReadModel();

  const persistedEvents = await fetchArticleEvents();
  log(`Loaded ${persistedEvents.length} events from PostgreSQL`);

  let processed = 0;
  for (const persisted of persistedEvents) {
    const primitive = toPrimitive(persisted);
    const event = ArticleEventPrimitiveMapper.fromPrimitive(primitive);

    if (event.getType() === EVENT_TYPE.DELETE) {
      await synchronizer.delete(event);
    } else {
      await synchronizer.upsert(event);
    }
    processed += 1;
  }

  log(`Resynchronization completed. Processed events: ${processed}`);
}

let isShutdown = false;

async function shutdown(): Promise<void> {
  if (isShutdown) return;
  isShutdown = true;
  log('Shutting down resources');
  await prisma.$disconnect();
  await redis.disconnect();
}

const handleTermination = async (signal: NodeJS.Signals) => {
  log(`Received ${signal}, closing gracefully...`);
  await shutdown();
  process.exit(0);
};

const registerSignalHandlers = () => {
  process.on('SIGINT', handleTermination);
  process.on('SIGTERM', handleTermination);
};

async function main(): Promise<void> {
  const intervalRaw = process.env.RESYNC_INTERVAL_MS;
  const intervalMs = intervalRaw ? Number.parseInt(intervalRaw, 10) : NaN;
  const shouldSchedule = Number.isFinite(intervalMs) && intervalMs > 0;

  if (!shouldSchedule) {
    try {
      await rebuild();
    } catch (error) {
      console.error('[resync-readmodel] Failed to resynchronize read model', error);
      process.exitCode = 1;
    } finally {
      await shutdown();
    }
    return;
  }

  registerSignalHandlers();

  const run = async (trigger: string) => {
    log(`Triggered by ${trigger}`);
    try {
      await rebuild();
    } catch (error) {
      console.error('[resync-readmodel] Scheduled resync failed', error);
    }
  };

  await run('initial run');
  log(`Scheduling next runs every ${intervalMs} ms`);

  let running = false;
  setInterval(async () => {
    if (running) {
      log('Previous resync still in progress, skipping this interval');
      return;
    }
    running = true;
    try {
      await run('interval');
    } finally {
      running = false;
    }
  }, intervalMs);
}

await main();
