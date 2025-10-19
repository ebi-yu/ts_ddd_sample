/**
 * KafkaArticleDomainEventSubscriber のリトライおよびデッドレター処理を検証する。
 * - ハンドラ成功時に再試行が発生しないこと
 * - 一時的な失敗で最大リトライまで再試行すること
 * - 最大試行後はデッドレターに送信されること
 * - メッセージ解析失敗時もリトライされること
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { KafkaArticleDomainEventSubscriber } from './KafkaArticleDomainEventSubscriber.ts';
import { parseArticleEventMessage } from '../mapper/ArticleEventKafkaMapper.ts';

vi.mock('../mapper/ArticleEventKafkaMapper.ts', () => ({
  parseArticleEventMessage: vi.fn(),
}));

const dummyEvent = {
  getArticleId: () => ({ value: 'article-1' }),
  getType: () => 'CREATE',
  getVersion: () => 1,
  getEventDate: () => new Date(),
  getData: () => ({}),
} as any;

describe('KafkaArticleDomainEventSubscriber.processWithRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createSubscriber = (options?: { maxRetries?: number; retryDelayMs?: number }) =>
    new KafkaArticleDomainEventSubscriber(
      ['localhost:9092'],
      'article-events',
      'group-id',
      options,
    );

  it('ハンドラが成功した場合、processWithRetryを実行すると、リトライやデッドレター処理なしが返る', async () => {
    // Arrange
    const parseMock = vi.mocked(parseArticleEventMessage);
    parseMock.mockReturnValue(dummyEvent);
    const subscriber = createSubscriber();
    const delaySpy = vi.spyOn(subscriber as any, 'delay').mockResolvedValue(undefined);
    const handler = vi.fn().mockResolvedValue(undefined);

    // Act
    await (subscriber as any).processWithRetry(handler, '{"payload":"ok"}', 'key');

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    expect(delaySpy).not.toHaveBeenCalled();
  });

  it('ハンドラが失敗した場合、processWithRetryを実行すると、最大リトライ回数まで再試行が返る', async () => {
    // Arrange
    const parseMock = vi.mocked(parseArticleEventMessage);
    parseMock.mockReturnValue(dummyEvent);
    const subscriber = createSubscriber({ maxRetries: 3, retryDelayMs: 100 });
    const delaySpy = vi.spyOn(subscriber as any, 'delay').mockResolvedValue(undefined);
    const handler = vi
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(undefined);

    // Act
    await (subscriber as any).processWithRetry(handler, '{"payload":"retry"}', 'key');

    // Assert
    expect(handler).toHaveBeenCalledTimes(2);
    expect(delaySpy).toHaveBeenCalledTimes(1);
  });

  it('最大試行回数を超えた場合、processWithRetryを実行すると、デッドレター送信が返る', async () => {
    // Arrange
    const parseMock = vi.mocked(parseArticleEventMessage);
    parseMock.mockReturnValue(dummyEvent);
    const subscriber = createSubscriber({ maxRetries: 2, retryDelayMs: 50 });
    const delaySpy = vi.spyOn(subscriber as any, 'delay').mockResolvedValue(undefined);
    const handler = vi.fn().mockRejectedValue(new Error('permanent'));
    const deadLetterSend = vi.fn().mockResolvedValue(undefined);

    // deadLetterProducer と deadLetterTopic を直接設定
    Object.assign(subscriber as any, {
      deadLetterProducer: { send: deadLetterSend },
      deadLetterTopic: 'article-events-dead-letter',
    });

    // Act
    await (subscriber as any).processWithRetry(handler, '{"payload":"fail"}', 'key');

    // Assert
    expect(handler).toHaveBeenCalledTimes(2);
    expect(delaySpy).toHaveBeenCalledTimes(1);
    expect(deadLetterSend).toHaveBeenCalledTimes(1);
    const message = deadLetterSend.mock.calls[0][0]?.messages?.[0];
    expect(message).toMatchObject({
      key: 'key',
    });
  });

  it('parseArticleEventMessageが失敗した場合、processWithRetryを実行すると、リトライ対象が返る', async () => {
    // Arrange
    const parseMock = vi.mocked(parseArticleEventMessage);
    parseMock
      .mockImplementationOnce(() => {
        throw new Error('parse error');
      })
      .mockReturnValue(dummyEvent);
    const subscriber = createSubscriber({ maxRetries: 2, retryDelayMs: 10 });
    const delaySpy = vi.spyOn(subscriber as any, 'delay').mockResolvedValue(undefined);
    const handler = vi.fn().mockResolvedValue(undefined);

    // Act
    await (subscriber as any).processWithRetry(handler, '{"payload":"parse"}', null);

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    expect(delaySpy).toHaveBeenCalledTimes(1);
  });
});
