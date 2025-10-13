/**
 * AuthorId 値オブジェクトの生成と比較を検証する。
 * - UUID形式のバリデーション
 * - equals による値比較
 */
import { describe, expect, it } from 'vitest';
import { AuthorId } from './AuthorId.ts';

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('生成', () => {
  it('UUID形式の文字列が与えられると、正しく生成され、同じ値が返る', () => {
    // Arrange
    const rawId = '123e4567-e89b-12d3-a456-426614174000';

    // Act
    const authorId = new AuthorId(rawId);

    // Assert
    expect(authorId.value).toBe(rawId);
  });

  it('大文字を含むUUIDが与えられると、正しくバリデーションされ、同じ値が返る', () => {
    // Arrange
    const rawId = '123E4567-E89B-12D3-A456-426614174000';

    // Act
    const authorId = new AuthorId(rawId);

    // Assert
    expect(authorId.value).toMatch(uuidRegex);
  });

  it('不正な文字列が与えられると、生成時にバリデーションされ、例外が返る', () => {
    // Arrange
    const rawId = 'invalid-author-id';

    // Act
    const act = () => new AuthorId(rawId);

    // Assert
    expect(act).toThrowError('Invalid Author ID');
  });
});

describe('値比較', () => {
  it('同じ内容が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const left = new AuthorId('123e4567-e89b-12d3-a456-426614174000');
    const right = new AuthorId('123e4567-e89b-12d3-a456-426614174000');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('異なる内容が与えられると、equalsで不一致判定が返る', () => {
    // Arrange
    const left = new AuthorId('123e4567-e89b-12d3-a456-426614174000');
    const right = new AuthorId('223e4567-e89b-12d3-a456-426614174000');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
