import { BoardRole } from '../entities/board-member.entity';

export class BoardWithRoleDto {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  ownerId: string;
  userRole: BoardRole | 'owner';
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}
