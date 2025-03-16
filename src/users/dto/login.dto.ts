import { UserRoles } from '../schemas/user.schema';

export class LoginDto {
  readonly email: string;
  readonly password: string;
  readonly role: UserRoles;
}
