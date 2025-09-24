// Domain Entities
export { Article } from "./Article.ts";

// Domain Value Objects
export { ArticleId } from "./vo/ArticleId.ts";
export { AuthorUserId } from "./vo/AuthorUserId.ts";
export { Content } from "./vo/Content.ts";
export { Title } from "./vo/Title.ts";

// Domain Events
export type {
  ContentEventData,
  CreateEventData,
  TitleEventData,
} from "./ArticleEvent.ts";

// 使用例（Complete CQRS Separation）:
//
// 1. 新しい記事の作成（Command Side）
// const article = Article.create({
//   id: new ArticleId(),
//   title: new Title("新しい記事のタイトル"),
//   content: new Content("記事の内容です..."),
//   authorId: new AuthorUserId("user-123")
// });
//
// 2. 記事の更新（Command Side）
// const updatedArticle = article
//   .changeTitle(new Title("更新されたタイトル"))
//   .changeContent(new Content("更新された内容"));
//
// 3. ビジネスルール検証と公開（Command Side）
// try {
//   article.publish(); // 内部でビジネスルール検証
// } catch (error) {
//   console.error("公開できません:", error.message);
// }
//
// 4. ReadModel構築（Query Side - 完全分離）
// const events = article.getUncommittedEvents();
// const readModel = ArticleReadModel.fromEvents(events);
//
// 5. UI用データ取得（Query Side）
// const plainObject = readModel.toPlainObject();
// const canPublish = readModel.canPublish();
//
// 6. CQRS分離の利点:
// - Command側: ビジネスロジックとイベント発火に集中
// - Query側: 読み取りパフォーマンスとUI要件に最適化
// - 完全な責任分離でスケーラブルな設計
