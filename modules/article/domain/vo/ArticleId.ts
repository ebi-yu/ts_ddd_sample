import { isUuid } from '@shared/utils/validator/isUuid.ts';
import { randomUUID } from 'crypto';

export class ArticleId {
  private readonly _value: string;

  constructor(value?: string) {
    if (value !== undefined) {
      if (!isUuid(value)) throw new Error('Invalid Article ID');
      this._value = value;
      return;
    }

    this._value = randomUUID();
  }

  equals(other: ArticleId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }
}
