import * as argon2 from 'argon2';

export class Password {
  private constructor(private readonly _hash: string) {}

  // 新規作成（平文をバリデーション & ハッシュ化）
  static async create(plain: string): Promise<Password> {
    this.validate(plain);

    const hash = await argon2.hash(plain, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 1 << 16, // 64 MiB
      parallelism: 1,
    });

    return new Password(hash);
  }

  // DBから復元（ハッシュをそのままラップする）
  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  // 照合（平文と比較）
  async matches(plain: string): Promise<boolean> {
    return argon2.verify(this._hash, plain);
  }

  // DB保存用
  get value(): string {
    return this._hash;
  }

  // VOの等価性（同じハッシュなら同じ）
  equals(other: Password): boolean {
    return this._hash === other._hash;
  }

  // バリデーション（強度チェック）
  private static validate(value: string): void {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/)) {
      throw new Error('Password must contain lowercase, uppercase, number, and special character');
    }
  }
}
