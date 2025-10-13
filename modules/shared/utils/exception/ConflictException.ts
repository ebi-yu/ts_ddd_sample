import { BaseException } from './BaseException.ts';

export class ConflictException extends BaseException {
  constructor(message: string, meta?: Record<string, any>) {
    super(409, { message, meta });
    this.name = 'ConflictException';
  }
}
