# テスト実装ガイドライン

## 基本方針

- ADR「2025-03-17-testing-scope」に基づき、Domain / Repository / ReadModel / Mapper / Messaging / UseCase / Controller の各レイヤーで小規模テストを整備する。
- medium / large テストはイベントフローなど複数コンポーネントの統合挙動を検証するために補助的に実装する。

## テスト種類と対象

| テスト種別 | 対象レイヤー | 内容/目的 |
| ---------- | ------------ | --------- |
| Small (ユニット) | Domain, Repository, ReadModel, Mapper, Messaging, UseCase, Controller | ファイル内のロジックと分岐をモックで検証。副作用を最小化し、変更箇所のリグレッションを早期検知する。 |
| Medium (サービス単位) | UseCase, Messaging, ReadModel | 複数コンポーネントを組み合わせ、ユースケース→インフラまで一連の流れを確認。Kafka/Redis など外部依存はテストダブルに置き換える。 |
| Large (統合) | イベントフロー全体 | Article 作成からアウトボックス→ディスパッチ→購読→ReadModel 投影までのシナリオを確認。必要に応じて in-memory のテストダブルを準備する。 |

## ディレクトリ構成 / 命名

- テストファイルは対象ファイルと同一ディレクトリに `*.test.ts` として配置する。  
- `modules/article/domain/foo.ts` → `modules/article/domain/foo.test.ts` のようにペアを作る。
- 例外的に medium/large テストで複数モジュールに跨る場合は、`tests/` ディレクトリを作成しシナリオ名で配置することを検討する。

## 共通ルール

- テストは Vitest を使用し、AAA（Arrange-Act-Assert）コメントを基本とする。
- モック／スタブは `vi.fn()` を用いて手動で用意し、外部リソース（DB, Redis, Kafka 等）への直接アクセスを避ける。
- エラーメッセージはドメインで定義した定数またはクラスを参照し、文字列の重複を避ける。
- 可能な限りユビキタス言語でテストケース名（日本語）を記述する。
- フェイクタイマーや日付を固定する必要がある場合は `vi.useFakeTimers()` を利用し、`afterEach` で必ずリセットする。
- 新機能を追加する際は、対象レイヤーの small テストを先に追加し、影響範囲が広い場合は medium/large テストを増やしてカバーする。
- テストコードの一番上にテストで行っていることについて簡単な説明コメントを追加する。
- テストタイトルは`〇〇の場合、〇〇すると、〇〇を返す`または`〇〇の場合、〇〇を返す`の形式で記述する。

## 実行とCI

- 開発時: `pnpm vitest --run modules/<path>/*.test.ts` で対象ファイルのみを部分実行。  
- 全体確認: `pnpm vitest --run` を用い、CI でも同じコマンドを利用する。  
- medium/large テストは実行時間を考慮し、CI での実行優先度を調整する（タグ付けやスキップを活用）。

## 今後の拡張

- Redis/Kafka のテストダブルを共通化するヘルパーを `tests/utils` などで提供する。  
- E2E（HTTP 経由）のテスト導入時は、このガイドラインを拡張し相互運用性を明記する。
