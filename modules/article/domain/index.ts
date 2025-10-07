// Domain Entities
export { Article } from './Article.ts';

// Domain Value Objects
export { ArticleId } from './vo/ArticleId.ts';
export { AuthorId } from './vo/AuthorId.ts';
export { Content } from './vo/Content.ts';
export { Title } from './vo/Title.ts';

// Domain Events
export type {
  ChangeContentEventData,
  ChangeTitleEventData,
  CreateEventData,
} from './ArticleEvent.ts';

// 他コンテキストからは `Article` 集約と値オブジェクト群を利用し、
// ドメインイベントはアプリケーション層のパブリッシャーを通じて扱う想定。
