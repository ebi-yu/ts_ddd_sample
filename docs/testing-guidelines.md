# テスト実装ガイドライン

## 基本方針

- ADR「2025-03-17-testing-scope」に基づき、Small と E2E（本番相当）の 2 段構えでテストを実装する。
- Small テストは Domain / Repository / ReadModel / Mapper / Messaging / seCase / Controller レイヤーを対象とし、ファイル単位でロジックと分岐をモックで検証する。
- UseCase / Controller を含む統合シナリオは Docker Compose 等を利用した E2E テストで検証する。

## テスト種類と対象

| テスト種別 | 対象レイヤー | 内容/目的 |
| ---------- | ------------ | --------- |
| Small (ユニット) | Domain, Repository, ReadModel, Mapper, Messaging | ファイル内のロジックと分岐をモックで検証。副作用を最小化し、変更箇所のリグレッションを早期検知する。 |
| E2E (本番相当) | アプリ全体 (UseCase/Controller含む) | Docker Compose 等で PostgreSQL / Redis / Kafka を起動し、Article 作成からアウトボックス配送／購読／投影までを本番と同じ構成で確認する。 |

## ディレクトリ構成 / 命名

- テストファイルは対象ファイルと同一ディレクトリに `*.test.ts` として配置する。  
- `modules/article/domain/foo.ts` → `modules/article/domain/foo.test.ts` のようにペアを作る。
- E2E テストは `tests/e2e/` 等にまとめ、Docker Compose などのセットアップを付属させる。

## 共通ルール

- テストは Vitest を使用し、AAA（Arrange-Act-Assert）コメントを基本とする。
- モック／スタブは `vi.fn()` を用いて手動で用意し、外部リソース（DB, Redis, Kafka 等）への直接アクセスを避ける。
- エラーメッセージはドメインで定義した定数またはクラスを参照し、文字列の重複を避ける。
- 可能な限りユビキタス言語でテストケース名（日本語）を記述する。
- `it('〇〇の場合、〇〇すると、〇〇を返す', () => { ... })` のスタイルで記述する。必要に応じて `describe` を用いる。
- フェイクタイマーや日付を固定する必要がある場合は `vi.useFakeTimers()` を利用し、`afterEach` で必ずリセットする。
- 各テストファイル冒頭に、対象のテスト概要と検証項目（箇条書き）を JSDoc コメントで記載する。
- 新機能を追加する際は、該当レイヤーの Small テストを先に追加し、幅広い振る舞いは Large テストで補う。

```ts
/**
 * ArticleOutboxDispatcher の振る舞いを検証する。
 * - PENDINGイベントが存在しないときは処理がスキップされる
 * - publish成功時に status が SENT へ更新される
 */
import { describe, expect, it, vi } from 'vitest';

describe('ArticleOutboxDispatcher', () => {
  it('PENDINGイベントが存在しないと、処理を行わない', () => {
    // Arrange

    // Act

    // Assert
  });
});
```

## 実行とCI

- 開発時: `pnpm vitest --run modules/<path>/*.test.ts` で小テストのみ部分実行。  
- 全体確認: `pnpm vitest --run` を用い、CI でも同じコマンドを利用する。  
- E2E テストは `pnpm test:e2e` を利用し、Docker Compose で依存サービスを起動した上で実行する（`scripts/run-e2e.sh` が Docker 起動・Prisma migrate・Vitest 実行を一括で行う）。
- 通常の `pnpm vitest --run` では E2E テストはスキップされる。`pnpm test:e2e` が `E2E=1` を設定して Vitest を実行し、E2E ケースを有効化する。

## 今後の拡張

- Redis/Kafka のテストダブルを共通化するヘルパーを `tests/utils` などで提供する。  
- E2E 用の Docker Compose を整備し、初期化スクリプトやテストデータ投入を自動化する。
