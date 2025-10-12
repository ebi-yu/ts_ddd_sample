# AGENTガイド

## 1. ミッションとドメイン

- 記事投稿ドメインを題材に、Domain-Driven Design (DDD) と CQRS を学ぶためのサンプルプロジェクト。
- Hono.js を利用した記事コマンド／クエリ用 HTTP API、PostgreSQL (Prisma) へのドメインイベント永続化、Kafka 経由で流れたイベントを Redis に投影してリードモデルを維持する構成。
- `doc/` ディレクトリには DDD の基本概念やドメイン分類、境界づけられたコンテキストに関する資料があるので、用語や不変条件を把握する際に参照する。

## 2. 技術スタックと主な依存関係

- 言語／ランタイム: TypeScript (ESNext モジュール、Node.js 実行)。
- フレームワーク／ライブラリ: Hono.js、hono-simple-di、KafkaJS、Redis クライアント、Prisma ORM、Zod、tsx。
- ツール: pnpm、Prettier、oxlint、concurrently、dotenv。
- 外部サービス: Apache Kafka、Redis、PostgreSQL (Prisma 経由)。`docker-compose.yml` でローカル起動が可能。

## 3. 環境構築とコマンド

### 3.1 前提

- pnpm 10.x に対応する Node.js を用意し、`pnpm install` で依存をインストールする。
- Kafka / Redis / PostgreSQL を起動できる Docker (または同等の環境) を整える。
- `.env` に `DATABASE_URL`, `KAFKA_BROKERS`, `REDIS_HOST` などを設定する（未設定時はローカルホストのデフォルト値を使用）。

### 3.2 サービス起動

1. `docker-compose up -d` で Kafka / Redis / PostgreSQL を起動。
2. `pnpm migration` で Prisma のマイグレーションを適用（`DATABASE_URL` が必要）。
3. `pnpm dev` でサブスクライバと API を同時に起動（tsx のウォッチモード）。
   - `pnpm dev:api`: `server.ts` を起動し、Redis / Kafka の疎通確認後、ポート 3000 でサーバーを提供。
   - `pnpm subscribe`: `scripts/subscribeDomainEvent.ts` を実行し、Redis 投影を行う Kafka サブスクライバを起動。

### 3.3 補助コマンド

- `pnpm doc`: OpenAPI スキーマ生成 (`scripts/generateOpenAPI.ts`)。
- `pnpm build`: TypeScript のコンパイル。
- `pnpm lint` / `pnpm lint:fix`: oxlint を実行。
- `pnpm format` / `pnpm format:check`: Prettier で整形。

## 4. アーキテクチャとコードマップ

### 4.1 レイヤ構成

- **ドメイン (`modules/article/domain/`)**: エンティティ、値オブジェクト、ドメインイベント、ファクトリなど純粋なビジネスロジック。
- **アプリケーション (`modules/article/application/`)**: ユースケースのオーケストレーション。リポジトリやパブリッシャ、プロジェクタを呼び出す。DTO やインターフェースで境界を定義。
- **インフラ (`modules/article/infrastructure/`)**: Prisma による永続化、Kafka メッセージング、Redis リードモデル、HTTP コントローラや OpenAPI ルートを実装。
- **共有 (`modules/shared/`)**: Kafka ブローカー解決や Redis シングルトンなど横断的なインフラヘルパーと共通 VO。

### 4.2 ドメインのポイント

- `Article` 集約がイベントソーシングによる状態変化を統括 (`Article.ts`)。
- `ArticleEventFactory` で型安全なイベント生成とシリアライズ準備を実施。
- `Title`, `Content` といった値オブジェクトで不変条件を強制。

### 4.3 アプリケーション層

- `CreateArticleUseCase`: リポジトリで重複チェック後、イベントを保存し、最新イベントを Kafka に配信。
- `SearchArticleUseCase`: Redis のリードモデルをクエリ。
- `application/interface/` のインターフェースでインフラとの結合を疎結合化。

### 4.4 インフラコンポーネント

- **HTTP**: `modules/index.ts` が Hono アプリと DI (`article/dependencies.ts`) を組み立て、ルートやエラー処理を設定。記事モジュールは `modules/article/index.ts` で登録。
- **リポジトリ**: `ArticleEventRepository` が Prisma を通じてドメインイベントを永続化（`DATABASE_URL` が必須）。
- **イベント**: `KafkaDomainEventPublisher` がイベントを配信。`KafkaArticleDomainEventSubscriber` がリトライ／デッドレター付きで受信し、`ArticleEventKafkaMapper` と `ArticleEventPrimitiveMapper` が境界変換を担う。
- **リードモデル**: `ArticleReadModelProjector` が Redis の状態を更新し、`ArticleReadModelQuery` が検索用データを提供。

### 4.5 補助スクリプトとドキュメント

- `scripts/subscribeDomainEvent.ts`: サブスクライバプロセスの起動。
- `rest-client/`: IDE の REST クライアント向けリクエストサンプル。
- `doc/` の資料で DDD の背景やコンテキストを把握できる。

## 5. データフローとランタイム挙動

### 5.1 書き込みフロー（コマンド）

1. Hono ルート／コントローラがリクエストを受信。
2. コントローラがユースケースを呼び出し、`CreateArticleUseCase` が値オブジェクトを使って集約を生成。
3. リポジトリが最新のドメインイベントを PostgreSQL に保存。
4. `KafkaDomainEventPublisher` が Kafka へイベントを送信。

### 5.2 投影と読み取りフロー

1. `pnpm subscribe` で起動したサブスクライバが `article-events` トピックを購読。
2. 受信メッセージを `ArticleEventKafkaMapper.deserialize` がドメインイベントに復元。
3. `ArticleReadModelProjector` が Redis のリードモデル（記事キーとステータス別インデックス）を更新。
4. `ArticleReadModelQuery` が API 応答用のデータを取得。

### 5.3 障害時の挙動

- サブスクライバは `ARTICLE_EVENT_MAX_RETRIES`（既定 3 回）まで指数的バックオフでリトライし、初期待機時間は `ARTICLE_EVENT_RETRY_DELAY_MS`（既定 500ms）。
- リトライ上限を超えたイベントは `ARTICLE_EVENT_DEAD_LETTER_TOPIC`（既定 `article-events-dead-letter`、空文字で無効化）に退避し、元トピックやグループ ID、エラー、タイムスタンプを記録。
- デッドレター送信に失敗した場合はログ出力のみ。手動対応が必要。
- `server.ts` は起動時に Redis / Kafka の疎通を最大 5 回チェックしてから API を起動。

## 6. 設定と環境変数

- `DATABASE_URL`: Prisma が利用する接続文字列（永続化／マイグレーションで必須）。
- `KAFKA_BROKERS`: カンマ区切りのブローカーリスト（デフォルト `localhost:9092`）。
- `ARTICLE_EVENT_TOPIC`: コマンド用トピック（既定 `article-events`）。
- `ARTICLE_READ_MODEL_GROUP_ID`: コンシューマグループ ID（既定 `article-read-model`）。
- `ARTICLE_EVENT_MAX_RETRIES`, `ARTICLE_EVENT_RETRY_DELAY_MS`, `ARTICLE_EVENT_DEAD_LETTER_TOPIC`: サブスクライバの信頼性調整。
- `REDIS_HOST`, `REDIS_PORT`: Redis 接続設定（既定は localhost / 6379）。
- 環境変数を変更したら関連プロセスを再起動する。API／サブスクライバは `dotenv/config` で `.env` を読み込む。

## 7. 慣習とベストプラクティス

- モジュールは `.ts` 拡張子を明示し、`allowImportingTsExtensions` を前提にする。
- DDD の境界を守り、ドメイン層をインフラ依存させない。新しいアダプタを追加する際は `application/interface` のインターフェースを実装する。
- 値オブジェクトのコンストラクタで不変条件をチェックし、ドメイン内では生のプリミティブを直接扱わない。
- イベントを追加する際は `ArticleEventKafkaMapper`, `ArticleEventFactory`, プロジェクタ／クエリなど関連箇所を更新する。
- 変更時は `apply_patch` などで差分を管理し、`pnpm lint` や `pnpm format` で整合性を取る。
- 自動テストは未整備なので、挙動拡張時には必要に応じてテストを追加検討。

## 8. セキュリティ・信頼性・制約

- リードモデル更新エラーでコマンド処理をロールバックしない（イベントual Consistency を前提）。
- 機密情報（DB URL、Kafka 認証など）は環境変数で管理し、`.env` はバージョン管理に含めない。
- Kafka / Redis クライアントはログ出力のみなので、本番運用を想定する場合は監視や構造化ログを追加検討。
- Prisma クライアントはファイル内でシングルトンとして生成しており、リクエストごとに再生成しない。
- `ArticleEventRepository.checkDuplicate` はイベント履歴を元に重複確認を行うため、イベントスキーマを変更する際は整合性に留意する。

## 9. エージェント向け推奨ワークフロー

1. `README.md` で全体像を掴み、続いて `doc/` の資料でドメイン用語を確認。
2. 取り組む課題に応じてドメイン／アプリケーション／インフラ層の該当コードを確認。必要なインターフェースは `application/interface` にある。
3. 実装前に Kafka / Redis / Postgres の起動と環境変数を確認。ローカルでは Docker Compose を利用。
4. 境界ごとの責務を尊重して実装し、新しいイベントを追加する場合はシリアライザやプロジェクタを忘れずに更新。
5. コード変更後は `pnpm lint` や `pnpm format` を実行し、動作確認が必要なら `pnpm dev` でサーバー／サブスクライバを起動してログをチェック。
6. 外部仕様に影響がある場合は README や OpenAPI の更新を検討する。

## 10. 参考資料

- `README.md`: 起動手順、コマンド一覧、運用メモ。
- `modules/article/infrastructure/event/README.md`: イベント配信フローとリトライ／デッドレター設定。
- `modules/article/infrastructure/readmodel/README.md`: Redis リードモデルの概要。
- `doc/01.DDD.md`, `doc/02.DOMAIN.ja.md`, `doc/03.BOUNDED_CONTEXT.ja.md`: DDD の概念と背景。
- `rest-client/`: API 動作確認用のリクエストサンプル。
