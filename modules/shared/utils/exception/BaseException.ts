type Status = 400 | 401 | 403 | 404 | 409 | 422 | 500 | undefined;

export class BaseException extends Error {
  readonly status: Status;
  readonly meta?: Record<string, any>;

  constructor(status: Status, { message, meta }: { message: string; meta?: Record<string, any> }) {
    super(message);
    this.name = 'BaseException';
    this.status = status;
    this.meta = meta;
  }
}
