import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from './seed.service';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { Team } from '../../team/entities/team.entity';
import { TeamMembership } from '../../team/entities/team-membership.entity';
import { Event } from '../../events/entities/event.entity';
import { Participation } from '../../events/entities/participation.entity';
import { FineCategory } from '../../fines/entities/fine-category.entity';
import { Fine } from '../../fines/entities/fine.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { FinePaymentLink } from '../../payments/entities/fine-payment-link.entity';
import { CashLedgerEntry } from '../../payments/entities/cash-ledger-entry.entity';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TypeOrmModule.forFeature([
      User, Role, UserRole, Team, TeamMembership,
      Event, Participation, FineCategory, Fine,
      Payment, FinePaymentLink, CashLedgerEntry,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
