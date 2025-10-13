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
  it('値が指定されないと、自動でUUIDが生成され、UUID形式の値が返る', () => {
    // Act
    const articleId = new ArticleId();

    // Assert
    expect(articleId.value).toMatch(uuidRegex);
  });

  it('任意の文字列が与えられると、そのまま保持され、同じ値が返る', () => {
    // Arrange
    const rawId = 'custom-article-id';

    // Act
    const articleId = new ArticleId(rawId);

    // Assert
    expect(articleId.value).toBe(rawId);
  });
});

describe('値比較', () => {
  it('同じ内容が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const left = new ArticleId('article-id');
    const right = new ArticleId('article-id');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('異なる内容が与えられると、equalsで不一致判定が返る', () => {
    // Arrange
    const left = new ArticleId('article-id-1');
    const right = new ArticleId('article-id-2');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
