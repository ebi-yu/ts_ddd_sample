import {
  ArticleContentChangeEvent,
  ArticleCreateEvent,
  ArticleEventFactory,
  ArticleTitleChangeEvent,
  type ArticleEvent,
} from './ArticleEvent.ts';
import { ArticleId } from './vo/ArticleId.ts';
import type { AuthorId } from './vo/AuthorId.ts';
import type { Content } from './vo/Content.ts';
import type { Title } from './vo/Title.ts';

export class Article {
  private constructor(
    private _events: ArticleEvent[] = [],
    private _id: ArticleId = new ArticleId(),
  ) {}

  // 記事作成
  static create(article: {
    id: ArticleId;
    title: Title;
    content: Content;
    authorId: AuthorId;
  }): Article {
    const _article = new Article([], article.id);

    // イベント発行
    const createEvent = ArticleEventFactory.create(
      article.id,
      {
        title: article.title,
        content: article.content,
        authorId: article.authorId,
      },
      1,
    );
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
      throw new Error('新しいタイトルは現在のタイトルと同じです');
    }

    // イベント発行
    const changeTitleEvent = ArticleEventFactory.changeTitle(
      this._id,
      {
        oldTitle: currentTitle,
        newTitle,
      },
      this.getVersion() + 1,
    );
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
      throw new Error('新しいコンテンツは現在のコンテンツと同じです');
    }

    // イベント発行
    const changeContentEvent = ArticleEventFactory.changeContent(
      this._id,
      {
        oldContent: currentContent,
        newContent,
      },
      this.getVersion() + 1,
    );
    // イベントの履歴を保存
    this.apply(changeContentEvent);

    return this;
  }

  // 公開イベント
  publish(): Article {
    // 内部ビジネスルール検証（ReadModel経由ではなく）
    if (!this.canPublishInternal()) {
      throw new Error('記事を公開できません。タイトルとコンテンツが必要です。');
    }

    // 公開イベントを発行
    const publishEvent = ArticleEventFactory.publish(this._id, this.getVersion() + 1);
    // イベントの履歴を保存
    this.apply(publishEvent);

    return this;
  }

  // アーカイブイベント
  archive(): Article {
    // イベント発行
    const archiveEvent = ArticleEventFactory.archive(this._id, this.getVersion() + 1);
    // イベントの履歴を保存
    this.apply(archiveEvent);

    return this;
  }

  // ドラフトに戻すイベント
  reDraft(): Article {
    // イベント発行
    const reDraftEvent = ArticleEventFactory.reDraft(this._id, this.getVersion() + 1);
    // イベントの履歴を保存
    this.apply(reDraftEvent);

    return this;
  }

  private apply(event: ArticleEvent): void {
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
  public getId(): ArticleId {
    return this._id;
  }

  // バージョン取得
  public getVersion(): number {
    return this._events.length;
  }

  getCurrentEvent(): ArticleEvent {
    return this._events[this._events.length - 1];
  }

  /* --- ビジネスルール --- */

  // 公開可能かどうかの内部判定（ビジネスルール）
  private canPublishInternal(): boolean {
    const currentTitle = this.getCurrentTitle();
    const currentContent = this.getCurrentContent();

    return currentTitle !== null && currentContent !== null;
  }
}
