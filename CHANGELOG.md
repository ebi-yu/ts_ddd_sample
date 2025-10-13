# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-03-17

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
