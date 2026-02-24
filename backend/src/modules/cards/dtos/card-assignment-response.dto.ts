export class UserSummaryDto {
  id: string;
  username: string;
  email: string;
}

export class CardAssignmentResponseDto {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  tags: string[] | null;
  position: number;
  listId: string;
  assignedUsers: UserSummaryDto[];
  createdAt: Date;
  updatedAt: Date;
}
