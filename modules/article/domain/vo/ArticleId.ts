import { randomUUID } from 'crypto';

export class ArticleId {
  public readonly _value: string;

  constructor(value?: string) {
    this._value = value ?? randomUUID();
  }

  equals(other: ArticleId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
