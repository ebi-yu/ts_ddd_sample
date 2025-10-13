import type { Email } from '@shared/utils/vo/Email.ts';
import type { Name } from './vo/Name.ts';
import type { Password } from './vo/Password.ts';
import type { UserId } from './vo/UserId.ts';

export class User {
  constructor(
    private _id: UserId,
    private _firstName: Name,
    private _lastName: Name,
    private _email: Email,
    private _password: Password,
  ) {}
}
