export class NotificationResponseDto {
  id: string;
  userId: string;
  type: 'board_invitation' | 'card_assignment' | 'role_change';
  message: string;
  relatedBoardId: string | null;
  relatedCardId: string | null;
  isRead: boolean;
  createdAt: Date;
}
