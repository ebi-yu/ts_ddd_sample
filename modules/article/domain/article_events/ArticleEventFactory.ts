import { Content } from '../vo/Content.ts';
import { Title } from '../vo/Title.ts';
import { ArticleArchiveEvent } from './ArticleArchiveEvent.ts';
import {
  ArticleContentChangeEvent,
  type ArticleContentChangeEventInit,
} from './ArticleContentChangeEvent.ts';
import { ArticleCreateEvent, type ArticleCreateEventInit } from './ArticleCreateEvent.ts';
import { type ArticleStatusEventInit } from './ArticleEventBase.ts';
import { ArticlePublishEvent } from './ArticlePublishEvent.ts';
import { ArticleReDraftEvent } from './ArticleReDraftEvent.ts';
import {
  ArticleTitleChangeEvent,
  type ArticleTitleChangeEventInit,
} from './ArticleTitleChangeEvent.ts';

export type ArticleEvent =
  | ArticleCreateEvent
  | ArticleTitleChangeEvent
  | ArticleContentChangeEvent
  | ArticlePublishEvent
  | ArticleArchiveEvent
  | ArticleReDraftEvent;

export type PersistedArticleEvent = {
  articleId: string;
  authorId: string;
  eventType: string;
  eventData: string;
  version: number;
  eventDate: Date;
};

export const ArticleEventFactory = {
  create: (params: ArticleCreateEventInit): ArticleCreateEvent => new ArticleCreateEvent(params),

  changeTitle: (params: ArticleTitleChangeEventInit): ArticleTitleChangeEvent =>
    new ArticleTitleChangeEvent(params),

  changeContent: (params: ArticleContentChangeEventInit): ArticleContentChangeEvent =>
    new ArticleContentChangeEvent(params),

  publish: (params: ArticleStatusEventInit): ArticlePublishEvent => new ArticlePublishEvent(params),

  archive: (params: ArticleStatusEventInit): ArticleArchiveEvent => new ArticleArchiveEvent(params),

  reDraft: (params: ArticleStatusEventInit): ArticleReDraftEvent => new ArticleReDraftEvent(params),
};

const toTitle = (raw: unknown): Title => {
  if (raw instanceof Title) {
    return raw;
  }

  if (typeof raw === 'string') {
    return new Title(raw);
  }

  if (raw && typeof raw === 'object' && '_value' in (raw as Record<string, unknown>)) {
    const value = (raw as { _value?: unknown })._value;
    if (typeof value === 'string') {
      return new Title(value);
    }
  }

  throw new Error('Invalid title payload in event data');
};

const toNullableTitle = (raw: unknown): Title | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  return toTitle(raw);
};

const toContent = (raw: unknown): Content => {
  if (raw instanceof Content) {
    return raw;
  }

  if (typeof raw === 'string') {
    return new Content(raw);
  }

  if (raw && typeof raw === 'object' && '_value' in (raw as Record<string, unknown>)) {
    const value = (raw as { _value?: unknown })._value;
    if (typeof value === 'string') {
      return new Content(value);
    }
  }

  throw new Error('Invalid content payload in event data');
};

const toNullableContent = (raw: unknown): Content | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  return toContent(raw);
};
