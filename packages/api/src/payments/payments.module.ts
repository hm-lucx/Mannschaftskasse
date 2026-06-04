import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { FinePaymentLink } from './entities/fine-payment-link.entity';
import { CashLedgerEntry } from './entities/cash-ledger-entry.entity';
import { Fine } from '../fines/entities/fine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, FinePaymentLink, CashLedgerEntry, Fine])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}
