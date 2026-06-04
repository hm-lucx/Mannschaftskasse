import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentProvider } from './entities/payment.entity';
import { FinePaymentLink } from './entities/fine-payment-link.entity';
import { CashLedgerEntry, LedgerEntryType } from './entities/cash-ledger-entry.entity';
import { Fine, FineStatus } from '../fines/entities/fine.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(FinePaymentLink) private linkRepo: Repository<FinePaymentLink>,
    @InjectRepository(CashLedgerEntry) private ledgerRepo: Repository<CashLedgerEntry>,
    @InjectRepository(Fine) private fineRepo: Repository<Fine>,
    private dataSource: DataSource,
  ) {}

  async findAll(userId: string, userRoles: string[]): Promise<Payment[]> {
    const isPrivileged = userRoles.some((r) => ['ADMIN', 'TREASURER'].includes(r));
    const where = isPrivileged ? {} : { user_id: userId };
    return this.paymentRepo.find({
      where,
      order: { paid_at: 'DESC' },
      relations: ['user', 'fine_payment_links', 'fine_payment_links.fine'],
    });
  }

  async create(dto: CreatePaymentDto, actorId: string): Promise<Payment> {
    const allocationsTotal = dto.fine_allocations.reduce(
      (sum, a) => sum + Number(a.allocated_amount),
      0,
    );

    if (Math.abs(allocationsTotal - dto.amount) > 0.001) {
      throw new BadRequestException(
        `Allocations total (${allocationsTotal}) must equal payment amount (${dto.amount})`,
      );
    }

    const fines = await Promise.all(
      dto.fine_allocations.map((a) =>
        this.fineRepo.findOne({ where: { id: a.fine_id } }),
      ),
    );

    for (const fine of fines) {
      if (!fine) throw new NotFoundException('Fine not found');
      if (fine.status !== FineStatus.OPEN) {
        throw new ConflictException(`Fine ${fine.id} is not open`);
      }
      if (fine.user_id !== dto.user_id) {
        throw new BadRequestException('Fine does not belong to this user');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const payment = manager.create(Payment, {
        user_id: dto.user_id,
        amount: dto.amount,
        provider: dto.provider || PaymentProvider.MANUAL,
        notes: dto.notes,
        recorded_by_id: actorId,
      });
      const savedPayment = await manager.save(Payment, payment);

      for (const allocation of dto.fine_allocations) {
        const link = manager.create(FinePaymentLink, {
          fine_id: allocation.fine_id,
          payment_id: savedPayment.id,
          allocated_amount: allocation.allocated_amount,
        });
        await manager.save(FinePaymentLink, link);

        const fine = fines.find((f) => f.id === allocation.fine_id);
        if (Number(allocation.allocated_amount) >= Number(fine.amount)) {
          await manager.update(Fine, allocation.fine_id, { status: FineStatus.PAID });
        }
      }

      const ledgerEntry = manager.create(CashLedgerEntry, {
        type: LedgerEntryType.INCOME,
        category: 'Strafzahlung',
        amount: dto.amount,
        note: dto.notes || `Zahlung für Strafe`,
        recorded_by_id: actorId,
        payment_id: savedPayment.id,
      });
      await manager.save(CashLedgerEntry, ledgerEntry);

      return manager.findOne(Payment, {
        where: { id: savedPayment.id },
        relations: ['user', 'fine_payment_links', 'fine_payment_links.fine'],
      });
    });
  }

  async getLedger(userId: string, userRoles: string[]): Promise<{ entries: CashLedgerEntry[]; balance: number }> {
    const entries = await this.ledgerRepo.find({
      order: { occurred_at: 'ASC' },
      relations: ['recorded_by'],
    });

    const balance = entries.reduce((sum, e) => {
      return e.type === LedgerEntryType.INCOME ? sum + Number(e.amount) : sum - Number(e.amount);
    }, 0);

    return { entries: entries.reverse(), balance };
  }

  async createLedgerEntry(dto: CreateLedgerEntryDto, actorId: string): Promise<CashLedgerEntry> {
    const entry = this.ledgerRepo.create({ ...dto, recorded_by_id: actorId });
    return this.ledgerRepo.save(entry);
  }
}
