import { isUuid } from '@shared/domain/validator/Uuid.ts';

export class AuthorId {
  private readonly _value: string;

  constructor(value: string) {
    if (!isUuid(value)) throw new Error('Invalid Author ID');
    this._value = value;
  }

  equals(other: AuthorId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }
}
