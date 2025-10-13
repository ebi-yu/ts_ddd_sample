# DDDドメインモデル テスト生成プロンプト

以下のルールに厳密に従い、Vitest を用いた TypeScript テストコードを生成してください。

### テスト生成ステップ

1. 対象モジュールを読み、守るべき不変条件・振る舞いを洗い出す。
2. `describe` ブロックを目的別（生成、値比較、イベント発行など）に設計する。
3. 各 `it` について「入力 → バリデーション → 出力」を言語化し、日本語のテスト名を決める。
4. AAA コメントを挿入しつつ、期待する振る舞いをドメインオブジェクトで検証するコードを書く。
5. 追加の境界値や冪等パスを忘れないか見直し、必要ならテストを追加する。

```ts
/**
 * Title 値オブジェクトの仕様を検証する。
 * - 生成時の整形と長さバリデーション
 * - equals による値比較
 */
import { describe, expect, it } from 'vitest';
import { Title } from './Title.ts';

describe('生成', () => {
  it('空白を含む文字列が与えられると、前後の空白が削除され、整形済みの値が返る', () => {
    // Arrange
    const rawTitle = '  Domain-Driven Design  ';

    // Act
    const title = new Title(rawTitle);

    // Assert
    expect(title.value).toBe('Domain-Driven Design');
  });
});

describe('値比較', () => {
  it('同じ内容が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const left = new Title('Hexagonal Architecture');
    const right = new Title('Hexagonal Architecture');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });
});
```

## ファイル配置

- テストファイルは対象モジュールと同じディレクトリに `*.test.ts` として置く想定で出力する。

## ファイル冒頭

- JSDoc 形式のコメントで対象クラス／値オブジェクトと検証項目を箇条書きで記述する。

## 構造

- 目的別にトップレベルの `describe` を分ける（例：`describe('生成', ...)`, `describe('値比較', ...)`, `describe('イベント発行', ...)`）。
- `it` 名は日本語で「〇〇が与えられると、〇〇され、〇〇が返る」の形式に揃える。
- テスト内部では AAA コメントを使う：`// Arrange`、`// Act`、`// Assert`。Act と Assert を同時に行う場合は `// Act / Assert`。

## アサーション

- 可能な限りドメインオブジェクトを直接検証する（例：`expect(event.getData()).toMatchObject({ ... })`）。
- 境界値（長さ制限、equals の挙動、冪等性など）を明示的にテストする。

## 出力形式

- 有効な TypeScript のテストコードのみを出力する。追加説明が必要な場合はコード末尾にコメントで補足する。
- 補助関数を定義する場合は、対象が分かりやすいようテスト付近に配置する。

## TypeScript テストのベストプラクティス補足

- テスト対象ファイルのパブリック API にフォーカスし、内部実装 details へ過度に依存しない。
- 副作用を持つ処理はセットアップ／クリーンアップを明確にする。
- テストデータは可読性と再利用性を意識して命名し、マジックナンバーや文字列は極力避ける。
- エラーケースでは例外メッセージやステータスコードを具体的に検証する（REST API の場合）。
- 並列実行を考慮し、グローバル状態を持たない／リセットする。
- テストは 1 ファイルずつ進め、簡単なケースから Blue-Green-Red（成功 → 改良 → 失敗の検証）に従い、各ステップで必ずテストを実行すること。
- 指示されていない推測や未知の仕様は仮定しない。必要があれば必ずユーザーに確認する。
