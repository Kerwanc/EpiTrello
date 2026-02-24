import { IsEnum, IsString } from 'class-validator';
import { BoardRole } from '../entities/board-member.entity';

export class InviteBoardMemberDto {
  @IsString()
  username: string;

  @IsEnum(BoardRole)
  role: BoardRole;
}
