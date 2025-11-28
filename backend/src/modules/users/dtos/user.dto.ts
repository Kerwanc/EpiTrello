export class UserDto {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
