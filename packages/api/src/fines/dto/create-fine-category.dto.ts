import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateFineCategoryDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.01)
  default_amount: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
