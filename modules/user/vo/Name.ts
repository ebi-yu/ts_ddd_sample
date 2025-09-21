export class Name {
  constructor(private _value: string) {
    if (this.isValid(_value)) {
      this._value = _value;
    }
  }

  equals(other: Name): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error("Name is empty");
    }
    // 2文字以上100文字以下
    if (value.length < 2 || value.length > 100) {
      throw new Error("Name must be between 2 and 100 characters");
    }
    // 英字、空白、ハイフン、アポストロフィのみ
    if (!value.match(/^[a-zA-Z\s'-]{2,50}$/)) {
      throw new Error(
        "Name must contain only alphabetic characters, spaces, hyphens, and apostrophes"
      );
    }
    return true;
  }
}
