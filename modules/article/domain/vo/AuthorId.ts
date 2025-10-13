export class AuthorId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValidAuthorId(value)) throw new Error('Invalid Author ID');
    this._value = value;
  }

  equals(other: AuthorId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  private isValidAuthorId(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
