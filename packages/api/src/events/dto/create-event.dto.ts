import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
  @IsEnum(EventType)
  type: EventType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  starts_at: string;

  @IsOptional()
  @IsDateString()
  response_deadline?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
