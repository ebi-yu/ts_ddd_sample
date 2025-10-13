/**
 * Title 値オブジェクトの生成ルールとバリデーションを検証する。
 * - 前後空白の除去
 * - 空文字列および最大長超過時の例外
 * - equals による値比較
 */
import { describe, expect, it } from 'vitest';
import { Title } from './Title.ts';

describe('生成', () => {
  it('空白を含む文字列が与えられると、前後の空白が削除され、整形済みの値が返る', () => {
    // Arrange
    const rawTitle = '  Domain-Driven Design  ';

    // Act
    const title = new Title(rawTitle);

    // Assert
    expect(title.value).toBe('Domain-Driven Design');
  });

  it('空文字列が与えられると、生成時にバリデーションされ、例外が返る', () => {
    // Arrange
    const rawTitle = '  ';

    // Act
    const act = () => new Title(rawTitle);

    // Assert
    expect(act).toThrowError('Title cannot be empty');
  });

  it('最大長を超える文字列が与えられると、生成時にバリデーションされ、例外が返る', () => {
    // Arrange
    const rawTitle = 'a'.repeat(257);

    // Act
    const act = () => new Title(rawTitle);

    // Assert
    expect(act).toThrowError('Title cannot be longer than 256 characters');
  });
});

describe('値比較', () => {
  it('同じ内容が与えられると、equalsで一致判定が返る', () => {
    // Arrange
    const left = new Title('Hexagonal Architecture');
    const right = new Title('Hexagonal Architecture');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(true);
  });

  it('異なる内容が与えられると、equalsで不一致判定が返る', () => {
    // Arrange
    const left = new Title('Hexagonal Architecture');
    const right = new Title('Layered Architecture');

    // Act
    const result = left.equals(right);

    // Assert
    expect(result).toBe(false);
  });
});
