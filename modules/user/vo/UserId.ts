export class UserId {
  constructor(private _value: string) {
    if (this.isValid(_value)) {
      this._value = _value;
    }
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      throw new Error("UserId is empty");
    }
    // 16文字以上30文字以下
    if (value.length < 8 || value.length > 30) {
      throw new Error("UserId must be between 8 and 30 characters");
    }
    // 英数字と特定の記号のみ
    if (!value.match(/^[a-zA-Z0-9!@#$%^&*]{8,30}$/)) {
      throw new Error(
        "UserId must contain only alphanumeric characters and special characters(!@#$%^&*)"
      );
    }

    return true;
  }
}
