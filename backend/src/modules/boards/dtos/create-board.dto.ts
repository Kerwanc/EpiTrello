import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnail?: string;
}
