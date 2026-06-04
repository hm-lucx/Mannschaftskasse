import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateFineDto {
  @IsUUID()
  user_id: string;

  @IsUUID()
  fine_category_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  event_id?: string;
}
