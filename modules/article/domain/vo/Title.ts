/**
 * Title値オブジェクトは記事タイトルの整形と長さ制約を担う。
 * - 前後空白の除去
 * - 空文字と256文字超過の禁止
 * - equalsで値比較を提供
 */
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
