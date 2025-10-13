import { email } from 'zod';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this.assertValid(value);
    this._value = value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  private assertValid(value: string): void {
    try {
      email().parse(value);
    } catch {
      throw new Error(`Invalid email format: ${value}`);
    }
  }
}
