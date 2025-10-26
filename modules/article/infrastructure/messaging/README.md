# Kafka Event Infrastructure

## Kafkaとは

[Apache Kafka](https://kafka.apache.org/) は、高スループットな分散メッセージング基盤です。トピックと呼ばれるログにイベントを順次追記し、複数のコンシューマが独立して購読できるため、疎結合なイベント駆動アーキテクチャを構築できます。

## このリポジトリでの実装

- **プロデューサ**: `KafkaDomainEventPublisher`
  - ドメインイベント (`ArticleEvent`) を Kafka トピックへ送信します。
  - 送信前に `serializeArticleEvent` で値オブジェクトをプレーンな JSON に変換します。
- **シリアライザ**: `ArticleEventKafkaMapper`
  - `serializeArticleEvent` / `deserializeArticleEvent` を提供し、Kafka メッセージとドメインイベントの相互変換を担います。
- **コンシューマ**: `KafkaArticleDomainEventSubscriber`
  - 指定トピックを購読し、受信したメッセージをドメインイベントに復元した上でハンドラへ引き渡します。
- **投影バッチ**: `ArticleReadModelKafkaConsumer`
  - 上記コンシューマを組み立て、`ArticleReadModelSynchronizer` に渡すことで Redis のリードモデルを更新します。
- **障害対応**: `KafkaArticleDomainEventSubscriber` はハンドラ実行に失敗した場合、リトライとデッドレタートピックへの退避を行います。

## なぜそれぞれが必要か

- **非同期化と疎結合化**: コマンド処理（書き込み側）とリードモデル投影（読み取り側）を Kafka で分離し、処理の独立性とスケール性を確保します。
- **シリアライザの導入**: 値オブジェクトや `Date` などのリッチな型をシンプルな JSON に落とし込むことで、外部システム間で安全にやり取りできます。
- **コンシューマと投影処理の分割**: メッセージ取得とリードモデル更新を分けることで、他の用途（通知・分析など）に同じイベントストリームを流用しやすくします。

## 障害時の挙動

- ハンドラ（例: `ArticleReadModelSynchronizer`）が例外を投げた場合は既定で最大 3 回まで指数的に遅延を伸ばしながらリトライします。
- 既定回数を超えても失敗した場合、メッセージは `article-events-dead-letter` トピックへ退避され、エラー内容と共に保管されます。
- デッドレターへの送信にも失敗した場合はログ出力のみ行われます。

環境変数で挙動をカスタマイズできます。

| 変数名                              | 説明                                                                 | 既定値                       |
| ----------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| `ARTICLE_EVENT_MAX_RETRIES`         | リトライ回数。0 の場合は即座にデッドレターへ送信                    | `3`                          |
| `ARTICLE_EVENT_RETRY_DELAY_MS`      | 1 回目のリトライまでの遅延ミリ秒。回数に応じて指数的に遅延が増加します | `500`                        |
| `ARTICLE_EVENT_DEAD_LETTER_TOPIC`   | 退避先トピック名。空文字を指定するとデッドレター送信を無効化         | `article-events-dead-letter` |
