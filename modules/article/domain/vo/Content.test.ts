/**
 * Content 値オブジェクトの生成ルールとバリデーションを検証する。
 * - 前後空白の除去
 * - 空文字列および最大長超過時の例外
 * - equals による値比較
 */
import { describe, expect, it } from 'vitest';
import { Content } from './Content.ts';

describe('生成', () => {
  it('空白を含む文字列を与えた場合、Contentを生成すると、前後の空白を除いた値が返る', () => {
    // Arrange
    const rawContent = '  DDD empowers teams.  ';

    // Act
    const content = new Content(rawContent);

    // Assert
    expect(content.value).toBe('DDD empowers teams.');
  });

  it('空文字列を与えた場合、Contentを生成すると、例外が返る', () => {
    // Arrange
    const rawContent = ' ';

    // Act
    const act = () => new Content(rawContent);

    // Assert
    expect(act).toThrowError('Content cannot be empty');
  });

  it('最大長を超える文字列を与えた場合、Contentを生成すると、例外が返る', () => {
    // Arrange
    const rawContent = 'a'.repeat(5001);

    // Act
    const act = () => new Content(rawContent);

    // Assert
    expect(act).toThrowError(
      'Content cannot be longer than 5000 characters',
    );
  });

  it('最大長ちょうどの文字列を与えた場合、Contentを生成すると、同じ長さの値が返る', () => {
    // Arrange
    const rawContent = 'a'.repeat(5000);

    // Act
    const content = new Content(rawContent);

    // Assert
    expect(content.value.length).toBe(5000);
  });
});

describe('値比較', () => {
  it('同じ内容を与えた場合、equalsを呼び出すと、一致判定が返る', () => {
    // Arrange
    const left = new Content('Knowledge crunching');
    const right = new Content('Knowledge crunching');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('異なる内容を与えた場合、equalsを呼び出すと、不一致判定が返る', () => {
    // Arrange
    const left = new Content('Tactical design');
    const right = new Content('Strategic design');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
