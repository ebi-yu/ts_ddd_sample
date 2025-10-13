# 概要

DDEを学習するためのリポジトリ。
記事投稿サービスを題材にしている。

記事ドメインではイベントソーシングとCQRSを用いて実装している。
※実際には記事ドメインをイベントソーシングで実装することは、過剰設計であることが多いので注意

## TODO

- 記事一覧取得APIの実装
  - TDDで実装する
- ユーザーコンテキストの実装
  - TDDで実装する
- new Errorをカスタムエラーに置き換える

## ディレクトリ構成

```md
- modules : 境界づけられたコンテキストごとのモジュール
  - article : 記事コンテキスト
    - application : ユースケース層
      - dto : ユースケースの関数の引数・戻り値の型定義。Zodでバリデーションも行う
        - input : ユースケースの入力Data Transfer Object
        - output : ユースケースの出力Data Transfer Object
      - adapter : ユースケースのアダプター
        - inbound : APIコントローラーからの呼び出しを受けるアダプター(interface)
        - outbound : ドメインサービスやリポジトリを呼び出すアダプター(interface)
    - domain : ドメイン層
      - events : 記事イベントの定義
      - vo : 値オブジェクトの定義
        - Article.ts : 記事の集約。記事イベントを集約して記事オブジェクトを生成する  
    - infrastructure : インフラ層
      - http
        - controllers : APIコントローラー
        - schemas : OpenAPIスキーマ定義
      - mapper : ドメインイベントをKafkaやDBのスキーマに変換するマッパー
      - messaging : ドメインイベントをやり取りするKafkaのプロデューサー・コンシューマー
      - persistence : 永続化層の実装
        - ArticleEventRepository.ts : 記事イベントのリポジトリ実装。Prismaを利用してPostgreSQLに保存する　 
      - readmodel : 読み取り用モデルの定義。Redisに保存する
        - ArticleReadModel.ts : 記事の読み取り用モデル。Redisに保存する
        - ArticleReadModelQuery.ts : 記事の読み取り用モデルのクエリインターフェース
        - ArticleReadModelProjector.ts : 記事の読み取り用モデルのプロジェクター。記事イベントを受けて読み取り用モデルを更新する
    - dependencies.ts : 依存関係の注入設定
    - index.ts : hono.jsのルーター定義  
  - user : ユーザコンテキスト(未実装)
  - shared : 複数コンテキストで共有するモジュール
    - domain : ドメイン層
    - infrastructure : インフラ層
      - OpenAPI.ts : OpenAPIのメソッド定義
      - Kafka.ts : Kafkaのメソッド定義
    - Redis.ts : Redisのメソッド定義
  - index.ts : Honoのルーターをまとめる
- scripts
  - generateOpenAPI.ts : OpenAPIのスキーマを生成するスクリプト
  - subscribeDomainEvents.ts : Kafkaに接続してドメインイベントの購読を開始するスクリプト
- rest-client : ローカルでAPIを試すためのRESTクライアント
- prisma : Prismaのスキーマ定義
- server.ts : APIサーバーのエントリーポイント
```

## 使用技術

- Hono.js : APIサーバフレームワーク
  - @hono/zod-openapi : ZodのスキーマからOpenAPIのスキーマを生成するためのパッケージ
  - @hono/node-server : Node.jsでHonoを動かすためのパッケージ
  - hono-simple-di : Honoで依存性注入を行うためのパッケージ
  - @scalar/hono-api-reference : HonoのAPIリファレンスを生成するためのパッケージ
- Apache Kafka : ドメインイベントの発行・購読
- PostgreSQL : コマンドクエリ分離におけるクエリ用(書き込み用)DB
- Redis : コマンドクエリ分離におけるコマンド用(読み取り用)DB
- Prisma : 型安全なORM
- Zod : スキーマベースのバリデーションライブラリ
- Vitest : テストフレームワーク
- oxlint : 静的解析ツール
- Prettier : コードフォーマッタ

## 処理の流れ

### 用語

- 記事イベント : 記事の登録・更新・削除などの記事に関する操作を表すイベント。PostgreSQLに保存される.実際の記事情報を生成するには、記事イベントを集約して記事オブジェクトを生成する必要がある.
- 読み取り用モデル : Redisに保存される記事の読み取り用データ.記事イベントを集約して生成される.
- ドメインイベント : 記事登録完了などのドメインに関する重要な出来事を表すイベント.**記事イベントとは別物であり**、他のコンテキストやシステムに通知するために使用される.

### サーバーの起動

1. (起動時一回のみ) Kafkaに接続して記事登録完了イベントの購読者を起動する。これはAPIサーバーとは別プロセスで起動する必要がある。
2. Hono.jsのAPIサーバーを起動する

### 記事の登録

1. Hono.jsのAPIサーバーで記事登録APIを受け付ける
2. 記事登録用のユースケースを呼び出す
3. ユースケース内で記事登録用のドメインサービスを呼び出す
4. ドメインサービス内で**記事イベント**を生成する
5. Prismaを利用してPostgreSQLに**記事イベント**を登録する
6. Kafkaを利用して記事登録完了の**ドメインイベント**を発行する
7. APIサーバーからのレスポンスを返す
8. Kafkaの記事登録完了イベントを購読している購読者がイベントを受け取る
9. Redisを利用して記事の読み取り用モデルを更新する

### 読み取りモデル更新の障害時

- Kafka 購読プロセスはイベント処理に失敗した場合、既定で最大 3 回まで指数的に遅延させつつリトライします。
- それでも失敗したイベントは `article-events-dead-letter` トピックに退避され、後続の手動リカバリやバッチ再処理の材料になります。

### 記事の取得

1. Hono.jsのAPIサーバーで記事取得APIを受け付ける
2. 記事取得用のユースケースを呼び出す
3. ユースケース内でRedisから記事の読み取り用モデルを取得する
4. APIサーバーからのレスポンスを返す

## 開発コマンド

APIサーバーを起動する前に、docker-composeでKafkaとRedis、PostgreSQLを起動してください。

```sh
docker-compose up -d
```

```sh
docker-compose down --volumes --remove-orphans
```

| コマンド            | 説明                                                 |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | `pnpm dev:api`と`pnpm subscribe`を同時に実行します |
| `pnpm dev:api`      | APIサーバーを起動します                             |
| `pnpm subscribe`    | Kafkaに接続をして、ドメインイベントの購読を開始します                 |
| `pnpm test`         | Vitestでユニットテストを実行します                         |
| `pnpm lint`         | oxlintで静的解析を実行し、警告を検知すると失敗します |
| `pnpm lint:fix`     | 可能な範囲でoxlintの自動修正を適用します             |
| `pnpm format`       | Prettierでリポジトリ全体を整形します               |
| `pnpm format:check` | Prettierによるフォーマット差分を検出します           |
