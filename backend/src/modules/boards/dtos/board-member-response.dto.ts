import { BoardRole } from '../entities/board-member.entity';

export class BoardMemberResponseDto {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}
