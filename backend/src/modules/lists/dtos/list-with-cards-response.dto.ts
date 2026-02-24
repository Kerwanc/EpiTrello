import { CardAssignmentResponseDto } from '../../cards/dtos/card-assignment-response.dto';

export class ListWithCardsResponseDto {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: CardAssignmentResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
