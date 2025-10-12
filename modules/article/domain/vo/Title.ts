export class Title {
  private readonly _value: string;
  private readonly MAX_LENGTH = 256;

  constructor(value: string) {
    value = value.trim();
    if (value.length === 0) throw new Error('Title cannot be empty');
    if (value.length > this.MAX_LENGTH)
      throw new Error(`Title cannot be longer than ${this.MAX_LENGTH} characters`);
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Title): boolean {
    return this._value === other._value;
  }
}
