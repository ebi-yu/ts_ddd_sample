# 概要

このディレクトリではPrismaを用いたデータベースのセットアップとマイグレーションを実装しています。

## Prismaとは

[Prisma](https://www.prisma.io/)は、TypeScriptとNode.jsのための次世代ORM（Object-Relational Mapping）ツールです。Prismaを使用することで、データベース操作をより直感的かつ効率的に行うことができます。

PrismaではORMとは異なり、オブジェクトとテーブルのマッピングを自動的に行うのではなく、スキーマファイルを使用してデータモデルを定義します。
Prismaはこのスキーマファイルを基に、型安全なクエリビルダーを生成します。

### 型安全なクエリビルダー

Prismaのクエリビルダーは、TypeScriptの型システムと統合されており、コンパイル時に型チェックが行われます。
例えば、存在しないフィールドにアクセスしようとすると、コンパイルエラーが発生します。

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const user = await prisma.user.findUnique({
  where: { id: 1 },
});
console.log(user.nonExistentField); // コンパイルエラー
```

### コマンド

```sh
npx prisma init          # Prismaの初期化
npx prisma migrate dev   # マイグレーションの実行 : データベースのスキーマを最新の状態に更新します。
```
