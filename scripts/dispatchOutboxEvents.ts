import 'dotenv/config';
import { ArticleOutboxDispatcher } from 'modules/article/infrastructure/messaging/ArticleOutboxDispatcher.ts';

const intervalMs = Number.parseInt(process.env.OUTBOX_DISPATCH_INTERVAL_MS ?? '5000', 10);
const dispatcher = new ArticleOutboxDispatcher();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  while (true) {
    try {
      await dispatcher.dispatch();
    } catch (error) {
      console.error('Outbox dispatch failed', error);
    }

    await sleep(intervalMs);
  }
}

const shutdown = async () => {
  await dispatcher.shutdown().catch((err) => {
    console.error('Failed to shutdown outbox dispatcher cleanly', err);
  });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('Outbox dispatcher crashed', err);
  shutdown();
});
