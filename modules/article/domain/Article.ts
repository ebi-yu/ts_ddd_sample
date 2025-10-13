/**
 * Article 集約はイベントソーシングで状態を管理する。
 * - create/change/publishなどの操作でドメインイベントを発行し、内部履歴へ蓄積
 * - 値オブジェクト(Title/Content)による不変条件を尊重
 * - 同一値の変更は冪等に扱い、イベントを追加しない
 */
import {
  ArticleContentChangeEvent,
  ArticleCreateEvent,
  ArticleEventFactory,
  ArticleTitleChangeEvent,
  type ArticleEvent,
} from './events/index.ts';
import { ArticleId } from './vo/ArticleId.ts';
import { AuthorId } from './vo/AuthorId.ts';
import type { Content } from './vo/Content.ts';
import type { Title } from './vo/Title.ts';

export class Article {
  private constructor(
    private _events: ArticleEvent[] = [],
    private _id: ArticleId = new ArticleId(),
    private _authorId: AuthorId,
  ) {}

  // 記事作成
  static create(article: {
    id: ArticleId;
    title: Title;
    content: Content;
    authorId: AuthorId;
  }): Article {
    const _article = new Article([], article.id, article.authorId);

    // イベント発行
    const createEvent = ArticleEventFactory.create({
      articleId: article.id,
      authorId: article.authorId,
      data: {
        title: article.title,
        content: article.content,
      },
      version: 1,
    });
    // イベントの履歴を保存
    _article.apply(createEvent);

    return _article;
  }

  /* --- イベント発行 --- */

  // タイトル変更イベント
  changeTitle(newTitle: Title): Article {
    // 内部状態から現在のタイトルを取得（ReadModel経由ではなく）
    const currentTitle = this.getCurrentTitle();

    // バリデーション
    if (currentTitle?.equals(newTitle)) {
      return this;
    }

    // イベント発行
    const changeTitleEvent = ArticleEventFactory.changeTitle({
      articleId: this._id,
      authorId: this._authorId,
      data: {
        oldTitle: currentTitle,
        newTitle,
      },
      version: this.getVersion() + 1,
    });
    // イベントの履歴を保存
    this.apply(changeTitleEvent);

    return this;
  }

  // コンテンツ変更イベント
  changeContent(newContent: Content): Article {
    // 内部状態から現在のコンテンツを取得（ReadModel経由ではなく）
    const currentContent = this.getCurrentContent();

    // バリデーション
    if (currentContent?.equals(newContent)) {
      return this;
    }

    // イベント発行
    const changeContentEvent = ArticleEventFactory.changeContent({
      articleId: this._id,
      authorId: this._authorId,
      data: {
        oldContent: currentContent,
        newContent,
      },
      version: this.getVersion() + 1,
    });
    // イベントの履歴を保存
    this.apply(changeContentEvent);

    return this;
  }

  // 公開イベント
  publish(): Article {
    // 内部ビジネスルール検証（ReadModel経由ではなく）
    if (!this.canPublishInternal()) {
      throw new Error('Cannot publish Article: title or content is missing');
    }

    // 公開イベントを発行
    const publishEvent = ArticleEventFactory.publish({
      articleId: this._id,
      authorId: this._authorId,
      version: this.getVersion() + 1,
    });
    // イベントの履歴を保存
    this.apply(publishEvent);

    return this;
  }

  // アーカイブイベント
  archive(): Article {
    // イベント発行
    const archiveEvent = ArticleEventFactory.archive({
      articleId: this._id,
      authorId: this._authorId,
      version: this.getVersion() + 1,
    });
    // イベントの履歴を保存
    this.apply(archiveEvent);

    return this;
  }

  // ドラフトに戻すイベント
  reDraft(): Article {
    // イベント発行
    const reDraftEvent = ArticleEventFactory.reDraft({
      articleId: this._id,
      authorId: this._authorId,
      version: this.getVersion() + 1,
    });
    // イベントの履歴を保存
    this.apply(reDraftEvent);

    return this;
  }

  static rehydrate(events: ArticleEvent[]): Article {
    if (events.length === 0) {
      throw new Error('Cannot rehydrate Article without events');
    }

    const orderedEvents = [...events].sort((left, right) => left.getVersion() - right.getVersion());
    const firstEvent = orderedEvents[0];
    const articleId = firstEvent.getArticleId();
    const authorId = firstEvent.getAuthorId();

    const article = new Article([], articleId, authorId);

    for (const event of orderedEvents) {
      if (!event.getArticleId().equals(articleId)) {
        throw new Error('Inconsistent Article ID in event stream');
      }
      if (!event.getAuthorId().equals(authorId)) {
        throw new Error('Inconsistent Author ID in event stream');
      }

      article.apply(event);
    }

    return article;
  }

  private apply(event: ArticleEvent): void {
    const expectedVersion = this._events.length + 1;
    if (event.getVersion() !== expectedVersion) {
      throw new Error(
        `Invalid event version: expected ${expectedVersion}, received ${event.getVersion()}`,
      );
    }

    this._events.push(event);
  }

  /* --- 取得メソッド --- */

  // タイトル取得
  getCurrentTitle(): Title | null {
    const titleEvents = this._events.filter(
      (event): event is ArticleTitleChangeEvent | ArticleCreateEvent =>
        event instanceof ArticleTitleChangeEvent || event instanceof ArticleCreateEvent,
    );

    if (titleEvents.length === 0) {
      return null;
    }

    const latestEvent = titleEvents[titleEvents.length - 1];

    if (latestEvent instanceof ArticleCreateEvent) {
      return latestEvent.getData().title;
    }

    return latestEvent.getData().newTitle;
  }

  // コンテンツ取得
  getCurrentContent(): Content | null {
    const contentEvents = this._events.filter(
      (event): event is ArticleContentChangeEvent | ArticleCreateEvent =>
        event instanceof ArticleContentChangeEvent || event instanceof ArticleCreateEvent,
    );

    if (contentEvents.length === 0) {
      return null;
    }

    const latestEvent = contentEvents[contentEvents.length - 1];

    if (latestEvent instanceof ArticleCreateEvent) {
      return latestEvent.getData().content;
    }

    return latestEvent.getData().newContent;
  }

  // 記事IDを取得
  getId(): ArticleId {
    return this._id;
  }

  // バージョン取得
  getVersion(): number {
    return this._events.length;
  }

  getCurrentEvent(): ArticleEvent {
    return this._events[this._events.length - 1];
  }

  getAuthorId(): AuthorId {
    return this._authorId;
  }

  /* --- ビジネスルール --- */

  // 公開可能かどうかの内部判定（ビジネスルール）
  private canPublishInternal(): boolean {
    const currentTitle = this.getCurrentTitle();
    const currentContent = this.getCurrentContent();

    return currentTitle !== null && currentContent !== null;
  }
}
