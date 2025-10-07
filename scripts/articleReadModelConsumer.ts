import { bootstrapArticleReadModelSubscriber } from 'modules/article/infrastructure/event/index.ts';

async function main() {
  await bootstrapArticleReadModelSubscriber();
}

main().catch((err) => {
  console.error('Failed to bootstrap article read model consumer', err);
  process.exit(1);
});
