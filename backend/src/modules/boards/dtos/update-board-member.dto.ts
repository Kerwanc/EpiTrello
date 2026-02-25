import { IsEnum } from 'class-validator';
import { BoardRole } from '../entities/board-member.entity';

export class UpdateBoardMemberDto {
  @IsEnum(BoardRole)
  role: BoardRole;
}
