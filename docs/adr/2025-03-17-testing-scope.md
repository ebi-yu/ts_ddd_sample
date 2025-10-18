# ADR: テスト対象レイヤーの統一方針

## 状況

- ドメイン層（値オブジェクト、イベント、集約）と永続化リポジトリのテストは整備済み。
- ReadModel／Mapper／メッセージング／アプリケーション層のテスト有無にばらつきがあり、変更の影響範囲が把握しづらい。
- アウトボックス導入などでインフラ層の責務が増え、疎結合を保つための回帰テストが必要になっている。

## 決定

- 以下のレイヤーについては small テストを基本とし、責務の変化を素早く検知できるようにする。  
  - **Domain**: 値オブジェクト、ドメインイベント、集約。  
  - **Persistence / Repository**: Prisma をモックし、イベント履歴・アウトボックスの書き込みを確認。  
  - **ReadModel**: Redis クライアントをスタブ化し、Projector／Query の投影ロジックを検証。  
  - **Mapper**: Kafka／Primitive マッパーの相互変換をテスト。  
  - **Messaging**: Publisher／Subscriber／OutboxDispatcher のリトライ分岐をテスト。  

- UseCase／Controller 等のアプリケーション層は small テストも行うが、HTTP まで含む medium テストでの統合検証を併用する。

- medium / large テストは個々のレイヤーの small テストを補完し、イベントフロー全体の統合動作を確認するために導入する（UseCase→Repository→Outbox→Dispatcher など）。

## 影響

- 新たに ReadModel／Mapper／Messaging／UseCase のテストを整備し、レイヤー間の変更があってもリグレッションに早期気付きが期待できる。  
- テストフォルダ構成と命名規則をレイヤー別に統一する必要がある（`modules/<layer>/**/*.test.ts`）。  
- テスト全体の実行時間は増えるが、重大な回帰の早期発見と設計方針の明文化による開発効率向上が見込まれる。
