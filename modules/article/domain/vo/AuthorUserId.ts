export class AuthorUserId {
  public readonly _value: string;

  constructor(value: string) {
    if (!this.isUUID(value)) {
      throw new Error("Invalid user ID");
    }
    this._value = value;
  }

  equals(other: AuthorUserId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  private isUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
}
