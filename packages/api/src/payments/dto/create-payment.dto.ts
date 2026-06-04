import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '../entities/payment.entity';

export class FineAllocationDto {
  @IsUUID()
  fine_id: string;

  @IsNumber()
  @Min(0.01)
  allocated_amount: number;
}

export class CreatePaymentDto {
  @IsUUID()
  user_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FineAllocationDto)
  fine_allocations: FineAllocationDto[];
}
