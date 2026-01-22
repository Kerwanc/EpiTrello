export class CreateUserDto {
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
}
