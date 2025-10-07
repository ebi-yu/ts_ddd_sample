# Kafka Event Infrastructure

## Kafkaとは

[Apache Kafka](https://kafka.apache.org/) は、高スループットな分散メッセージング基盤です。トピックと呼ばれるログにイベントを順次追記し、複数のコンシューマが独立して購読できるため、疎結合なイベント駆動アーキテクチャを構築できます。

## このリポジトリでの実装

- **プロデューサ**: `KafkaDomainEventPublisher`
  - ドメインイベント (`ArticleEvent`) を Kafka トピックへ送信します。
  - 送信前に `serializeArticleEvent` で値オブジェクトをプレーンな JSON に変換します。
- **シリアライザ**: `ArticleEventKafkaMapper`
  - `serializeArticleEvent` / `deserializeArticleEvent` を提供し、Kafka メッセージとドメインイベントの相互変換を担います。
- **コンシューマ**: `KafkaArticleEventSubscriber`
  - 指定トピックを購読し、受信したメッセージをドメインイベントに復元した上でハンドラへ引き渡します。
- **投影バッチ**: `ArticleReadModelKafkaConsumer`
  - 上記コンシューマを組み立て、`ArticleReadModelProjector` に渡すことで Redis のリードモデルを更新します。

## なぜそれぞれが必要か

- **非同期化と疎結合化**: コマンド処理（書き込み側）とリードモデル投影（読み取り側）を Kafka で分離し、処理の独立性とスケール性を確保します。
- **シリアライザの導入**: 値オブジェクトや `Date` などのリッチな型をシンプルな JSON に落とし込むことで、外部システム間で安全にやり取りできます。
- **コンシューマと投影処理の分割**: メッセージ取得とリードモデル更新を分けることで、他の用途（通知・分析など）に同じイベントストリームを流用しやすくします。
