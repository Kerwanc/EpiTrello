import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
  content: string;
}
