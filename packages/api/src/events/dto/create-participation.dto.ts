import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ParticipationStatus } from '../entities/participation.entity';

export class CreateParticipationDto {
  @IsEnum(ParticipationStatus)
  status: ParticipationStatus;

  @IsOptional()
  @IsString()
  decline_reason?: string;
}
