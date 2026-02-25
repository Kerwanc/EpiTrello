export class CommentAuthorDto {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export class CommentResponseDto {
  id: string;
  content: string;
  cardId: string;
  authorId: string;
  author: CommentAuthorDto;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}
