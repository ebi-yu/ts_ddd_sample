import 'dotenv/config';
import { bootstrapArticleReadModelSubscriber } from 'modules/article/infrastructure/event/index.ts';

/*
 * 記事のリードモデル更新用のイベント購読処理を起動し、Kafkaに接続します。
 * Kafkaへの接続はAPIサーバーとは別のプロセスで行うことが推奨されます。
 * イベント購読処理をAPIプロセスと分離することで、負荷分散やスケーリングが容易になり、システム全体の信頼性とパフォーマンスが向上します。
 */

async function main() {
  await bootstrapArticleReadModelSubscriber();
}

main().catch((err) => {
  console.error('Failed to bootstrap article read model consumer', err);
  process.exit(1);
});
