# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2025-10-26

### 追加

- 記事削除ユースケースを実装し、削除イベントをアウトボックス経由で配信できるようにした  
  (`modules/article/application/DeleteArticleUseCase.ts`, `modules/article/domain/events/ArticleDeleteEvent.ts` ほか)。
- 読み取りモデルの同期クラスを `ArticleReadModelSynchronizer` に改名し、DELETE イベント対応や定期再同期バッチを追加  
  (`modules/article/infrastructure/readmodel/ArticleReadModelSynchronizer.ts`, `scripts/resynchronizeArticleReadModel.ts`)。
- `resync:readmodel` などの起動スクリプト、ストップ用 `tests/e2e/teardown.sh`、REST クライアント削除用リクエスト等を追加。

### 変更

- Outbox から Kafka への配信、サブスクライバ起動コマンド `start:all` の構成を整理し、README に起動シーケンス・記事登録フローの Mermaid 図を追加。
- 記事イベントマッパーやリポジトリを DELETE イベント対応にリファクタリングし、Redis との整合性を強化。
- E2E テストを Redis 反映完了まで待機する方式に変更し、安定性を向上させた。

### 削除

- 古い命名のテスト／ユースケースファイル (`CreateArtucle*`) や未使用 DTO (`GetArticlesQueryDto`) などを整理。
- 廃止した run-e2e スクリプトを削除。

## [1.0.0] - 2025-10-01

### 概要

- 記事投稿ドメインを題材にした DDD 参照実装を初公開。イベントソーシング採用の `Article` 集約、値オブジェクト、ドメインイベントファクトリを実装。
- Prisma を利用したイベントストア＋Redis投影による CQRS 構成、Kafka を使ったドメインイベント発行・購読インフラを整備。
- Hono + `hono-simple-di` を用いた API 層を実装し、記事作成／検索ユースケースを HTTP で提供。Zod DTO や共通エラー基盤を整備。
- `pnpm test` を想定したテストスイートを用意し、イベント・値オブジェクト・リポジトリの主要ロジックを検証。

### 初期機能ハイライト

- Article 集約: `create`, `changeTitle`, `changeContent`, `publish`, `archive`, `reDraft` などのドメイン操作とイベント履歴管理 (`modules/article/domain/Article.ts`)。
- 値オブジェクト: ID／タイトル／コンテンツなどの不変条件とテスト (`modules/article/domain/vo/*.ts`, `*.test.ts`)。
- ドメインイベント: `ArticleEventBase`, `ArticleEventFactory`, 各種イベントクラスとテスト。
- アプリケーション層: ユースケース／アダプター、HTTP コントローラ、共通エラー (`modules/article/application`, `modules/shared/error`)。
- インフラ層: Prisma リポジトリ、Redis リードモデル、Kafka パブリッシャ・サブスクライバ、各種マッパー／テスト。
