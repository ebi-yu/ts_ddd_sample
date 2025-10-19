/**
 * ArticleId 値オブジェクトの生成と比較を検証する。
 * - 値未指定時のUUID生成
 * - 値指定時の値保持
 * - equals による値比較
 */
import { describe, expect, it } from 'vitest';
import { ArticleId } from './ArticleId.ts';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('生成', () => {
  it('値を指定しない場合、ArticleIdを生成すると、UUID形式の値が返る', () => {
    // Act
    const articleId = new ArticleId();

    // Assert
    expect(articleId.value).toMatch(uuidRegex);
  });

  it('UUID形式の文字列を与えた場合、ArticleIdを生成すると、同じ値が返る', () => {
    // Arrange
    const rawId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const authorId = new ArticleId(rawId);

    // Assert
    expect(authorId.value).toBe(rawId);
  });

  it('大文字を含むUUIDを与えた場合、ArticleIdを生成すると、同じ値が返る', () => {
    // Arrange
    const rawId = '123E4567-E89B-12D3-A456-426614174000';

    // Act
    const authorId = new ArticleId(rawId);

    // Assert
    expect(authorId.value).toMatch(uuidRegex);
  });

  it('不正な文字列を与えた場合、ArticleIdを生成すると、例外が返る', () => {
    // Arrange
    const rawId = 'invalid-author-id';

    // Act
    const act = () => new ArticleId(rawId);

    // Assert
    expect(act).toThrowError('Invalid Article ID');
  });
});

describe('値比較', () => {
  it('同じ内容を与えた場合、equalsを呼び出すと、一致判定が返る', () => {
    // Arrange
    const rawId = '123e4567-e89b-12d3-a456-426614174000';
    const left = new ArticleId(rawId);
    const right = new ArticleId(rawId);

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('異なる内容を与えた場合、equalsを呼び出すと、不一致判定が返る', () => {
    // Arrange
    const left = new ArticleId('123e4567-e89b-12d3-a456-426614174000');
    const right = new ArticleId('223e4567-e89b-12d3-a456-426614174000');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
