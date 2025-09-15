import {
  ArticleEvent,
  EventType,
  type ContentEventData,
  type CreateEventData,
  type TitleEventData,
} from "./ArticleEvent.ts";
import { ArticleId } from "./vo/ArticleId.ts";
import type { AuthorUserId } from "./vo/AuthorUserId.ts";
import type { Content } from "./vo/Content.ts";
import type { Title } from "./vo/Title.ts";

export class Article {
  private constructor(
    private _events: ArticleEvent<
      TitleEventData | CreateEventData | ContentEventData | undefined
    >[] = [],
    private _id: ArticleId = new ArticleId()
  ) {}

  static create(article: {
    id: ArticleId;
    title: Title;
    content: Content;
    authorId: AuthorUserId;
  }): Article {
    const _article = new Article();
    const createEvent = ArticleEvent.create(article.id, {
      title: article.title,
      content: article.content,
      authorId: article.authorId,
    });
    _article.apply(createEvent);

    return _article;
  }

  public changeTitle(newTitle: Title): Article {
    const currentTitle = this.getCurrentTitle();

    // タイトル変更のバリデーション
    if (currentTitle?.equals(newTitle)) {
      throw new Error("新しいタイトルは現在のタイトルと同じです");
    }

    const changeTitleEvent = ArticleEvent.changeTitle(this._id, {
      oldTitle: currentTitle,
      newTitle,
    });
    this.apply(changeTitleEvent);

    return this;
  }

  public changeContent(newContent: Content): Article {
    const currentContent = this.getCurrentContent();

    // コンテンツ変更のバリデーション
    if (currentContent?.equals(newContent)) {
      throw new Error("新しいコンテンツは現在のコンテンツと同じです");
    }

    const changeContentEvent = ArticleEvent.changeContent(this._id, {
      oldContent: currentContent,
      newContent,
    });
    this.apply(changeContentEvent);

    return this;
  }

  public archive(): Article {
    const archiveEvent = ArticleEvent.archive(this._id);
    this.apply(archiveEvent);
    return this;
  }

  public draft(): Article {
    const draftEvent = ArticleEvent.draft(this._id);
    this.apply(draftEvent);
    return this;
  }

  private apply(
    event: ArticleEvent<
      TitleEventData | CreateEventData | ContentEventData | undefined
    >
  ): void {
    this._events.push(event);
  }

  public getCurrentTitle(): Title | null {
    const titleEvents = this._events.filter(
      (event) => event.eventType === EventType.ChangeTitle
    );

    if (titleEvents.length === 0) {
      return null;
    }

    const latestTitleEvent = titleEvents[titleEvents.length - 1];
    return (latestTitleEvent.eventData as TitleEventData).newTitle;
  }

  public getCurrentContent(): Content | null {
    const contentEvents = this._events.filter(
      (event) => event.eventType === EventType.ChangeContent
    );

    if (contentEvents.length === 0) {
      return null;
    }

    const latestContentEvent = contentEvents[contentEvents.length - 1];
    return (latestContentEvent.eventData as ContentEventData).newContent;
  }

  public getCurrentState(): ArticleEvent<
    TitleEventData | CreateEventData | ContentEventData | undefined
  > {
    const currentEvent = this._events[this._events.length - 1];
    return currentEvent;
  }
}
