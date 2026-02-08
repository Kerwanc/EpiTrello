export class BoardResponseDto {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
