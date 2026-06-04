import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LedgerEntryType } from '../entities/cash-ledger-entry.entity';

export class CreateLedgerEntryDto {
  @IsEnum(LedgerEntryType)
  type: LedgerEntryType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
