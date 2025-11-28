import { UserDto } from '../../users/dtos/user.dto';

export class AuthResponseDto {
  accessToken: string;
  user: UserDto;
}
