export const ARTICLE_OUTBOX_CONTEXT = {
  CREATE: 'article-create',
  UPDATE: 'article-update',
  DELETE: 'article-delete',
};
export const DEFAULT_OUTBOX_TOPIC = process.env.ARTICLE_EVENT_TOPIC ?? 'article-events';
