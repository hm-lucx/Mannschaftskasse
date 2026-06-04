import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.paymentsService.findAll(user.id, user.roles || []);
  }

  @Post()
  @Roles('ADMIN', 'TREASURER')
  create(@Body() dto: CreatePaymentDto, @CurrentUser('id') userId: string) {
    return this.paymentsService.create(dto, userId);
  }

  @Get('ledger')
  @Roles('ADMIN', 'TREASURER')
  getLedger(@CurrentUser() user: any) {
    return this.paymentsService.getLedger(user.id, user.roles || []);
  }

  @Post('ledger')
  @Roles('ADMIN', 'TREASURER')
  createLedgerEntry(@Body() dto: CreateLedgerEntryDto, @CurrentUser('id') userId: string) {
    return this.paymentsService.createLedgerEntry(dto, userId);
  }
}
