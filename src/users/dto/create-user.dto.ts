export class CreateUserDto {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone: string;
  readonly role: string;
  readonly profilePhoto?: string;
  readonly idPhoto?: string;
}
