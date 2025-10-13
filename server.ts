import { serve } from '@hono/node-server';
import { RedisClient } from '@shared/client/RedisClient.ts';
import { resolveKafkaBrokers, verifyKafkaConnectivity } from '@shared/utils/Kafka.ts';
import 'dotenv/config';
import app from './modules/index.ts';

/*
 * Redisが起動しているか確認する
 */
async function verifyRedisConnectivity(): Promise<void> {
  const redisClient = RedisClient.getInstance();
  await redisClient.connect();

  try {
    await redisClient.getClient().ping();
  } finally {
    if (redisClient.getClient().isOpen) {
      await redisClient.disconnect().catch((err) => {
        console.warn('Redis disconnect failed during startup verification:', err);
      });
    }
  }
}

/*
 * 依存する外部サービスが起動しているか確認する
 */
async function ensureDependenciesReady(): Promise<void> {
  const maxAttempts = 5;
  const retryDelayMs = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`🔍 Checking Redis availability... (attempt ${attempt})`);
      await verifyRedisConnectivity();
      console.log('✅ Redis is reachable');

      const kafkaBrokers = resolveKafkaBrokers();
      console.log(
        `🔍 Checking Kafka availability (${kafkaBrokers.join(', ')})... (attempt ${attempt})`,
      );
      await verifyKafkaConnectivity(kafkaBrokers);
      console.log('✅ Kafka is reachable');
      return;
    } catch (err) {
      if (attempt === maxAttempts) {
        throw err;
      }
      console.warn(
        `⚠️ Dependency check failed on attempt ${attempt}. Retrying in ${retryDelayMs}ms...`,
        err,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, retryDelayMs);
      });
    }
  }
}

async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Bootstrapping application...');
    await ensureDependenciesReady();

    serve({
      fetch: app.fetch,
      port: 3000,
    });

    console.log('🚀 Server is running at http://localhost:3000');
  } catch (err) {
    console.error('❌ Failed to start server due to missing dependencies:', err);
    process.exit(1);
  }
}

console.log('Starting server...');

void bootstrap();
