import { email } from "zod";

export class Email {
  constructor(private _value: string) {
    if (!this.isValid(_value)) {
    }
    this._value = _value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    try {
      email().parse(value);
      return true;
    } catch {
      throw new Error(`Invalid email format: ${value}`);
    }
  }
}
