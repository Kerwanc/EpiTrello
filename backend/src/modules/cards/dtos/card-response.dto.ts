export class CardResponseDto {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  tags: string[] | null;
  position: number;
  listId: string;
  createdAt: Date;
  updatedAt: Date;
}
