import {
  ArticleEventFactory,
  EVENT_TYPE,
  type ArticleEvent,
  type ChangeContentEventData,
  type ChangeTitleEventData,
  type CreateEventData,
  type EventType,
} from 'modules/article/domain/ArticleEvent.ts';
import { ArticleId } from 'modules/article/domain/vo/ArticleId.ts';
import { AuthorId } from 'modules/article/domain/vo/AuthorId.ts';
import { Content } from 'modules/article/domain/vo/Content.ts';
import { Title } from 'modules/article/domain/vo/Title.ts';

export type SerializedArticleEvent = {
  articleId: string;
  type: EventType;
  version: number;
  occurredAt: string;
  data: Record<string, unknown>;
};

export function serializeArticleEvent(event: ArticleEvent): SerializedArticleEvent {
  const base = {
    articleId: event.getArticleId().value,
    type: event.getType(),
    version: event.getVersion(),
    occurredAt: event.getEventDate().toISOString(),
  };

  switch (event.getType()) {
    case EVENT_TYPE.CREATE: {
      const { title, content, authorId } = event.getData() as CreateEventData;
      return {
        ...base,
        data: {
          title: title.value,
          content: content.value,
          authorId: authorId.value,
        },
      };
    }
    case EVENT_TYPE.CHANGE_TITLE: {
      const { oldTitle, newTitle } = event.getData() as ChangeTitleEventData;
      return {
        ...base,
        data: {
          oldTitle: oldTitle ? oldTitle.value : null,
          newTitle: newTitle.value,
        },
      };
    }
    case EVENT_TYPE.CHANGE_CONTENT: {
      const { oldContent, newContent } = event.getData() as ChangeContentEventData;
      return {
        ...base,
        data: {
          oldContent: oldContent ? oldContent.value : null,
          newContent: newContent.value,
        },
      };
    }
    case EVENT_TYPE.PUBLISH:
    case EVENT_TYPE.ARCHIVE:
    case EVENT_TYPE.RE_DRAFT: {
      return { ...base, data: {} };
    }
    default:
      throw new Error(`Unsupported event type for serialization: ${event.getType()}`);
  }
}

export function deserializeArticleEvent(serialized: SerializedArticleEvent): ArticleEvent {
  const articleId = new ArticleId(serialized.articleId);
  const occurredAt = new Date(serialized.occurredAt);

  switch (serialized.type) {
    case EVENT_TYPE.CREATE: {
      const data = serialized.data as {
        title: string;
        content: string;
        authorId: string;
      };
      return ArticleEventFactory.create(
        articleId,
        {
          title: new Title(data.title),
          content: new Content(data.content),
          authorId: new AuthorId(data.authorId),
        },
        serialized.version,
        occurredAt,
      );
    }
    case EVENT_TYPE.CHANGE_TITLE: {
      const data = serialized.data as {
        oldTitle: string | null;
        newTitle: string;
      };
      return ArticleEventFactory.changeTitle(
        articleId,
        {
          oldTitle: data.oldTitle ? new Title(data.oldTitle) : null,
          newTitle: new Title(data.newTitle),
        },
        serialized.version,
        occurredAt,
      );
    }
    case EVENT_TYPE.CHANGE_CONTENT: {
      const data = serialized.data as {
        oldContent: string | null;
        newContent: string;
      };
      return ArticleEventFactory.changeContent(
        articleId,
        {
          oldContent: data.oldContent ? new Content(data.oldContent) : null,
          newContent: new Content(data.newContent),
        },
        serialized.version,
        occurredAt,
      );
    }
    case EVENT_TYPE.PUBLISH:
      return ArticleEventFactory.publish(articleId, serialized.version, occurredAt);
    case EVENT_TYPE.ARCHIVE:
      return ArticleEventFactory.archive(articleId, serialized.version, occurredAt);
    case EVENT_TYPE.RE_DRAFT:
      return ArticleEventFactory.reDraft(articleId, serialized.version, occurredAt);
    default:
      throw new Error(`Unsupported event type for deserialization: ${serialized.type}`);
  }
}

export function parseArticleEventMessage(message: string): ArticleEvent {
  const payload = JSON.parse(message) as SerializedArticleEvent;
  return deserializeArticleEvent(payload);
}
