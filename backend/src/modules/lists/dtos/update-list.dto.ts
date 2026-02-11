import { IsString, IsInt, IsOptional, MaxLength, Min } from 'class-validator';

export class UpdateListDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
