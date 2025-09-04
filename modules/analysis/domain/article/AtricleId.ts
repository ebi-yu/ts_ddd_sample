import { randomUUID } from "crypto";

export class ArticleId {
  public readonly _value: string;

  constructor() {
    this._value = randomUUID();
  }

  equals(other: ArticleId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }
}
