import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../../users/entities/user.entity';
import { Role, RoleName } from '../../users/entities/role.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { Team } from '../../team/entities/team.entity';
import { TeamMembership } from '../../team/entities/team-membership.entity';
import { Event, EventType } from '../../events/entities/event.entity';
import { Participation, ParticipationStatus } from '../../events/entities/participation.entity';
import { FineCategory } from '../../fines/entities/fine-category.entity';
import { Fine, FineStatus } from '../../fines/entities/fine.entity';
import { Payment, PaymentProvider } from '../../payments/entities/payment.entity';
import { FinePaymentLink } from '../../payments/entities/fine-payment-link.entity';
import { CashLedgerEntry, LedgerEntryType } from '../../payments/entities/cash-ledger-entry.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(TeamMembership) private membershipRepo: Repository<TeamMembership>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Participation) private participationRepo: Repository<Participation>,
    @InjectRepository(FineCategory) private categoryRepo: Repository<FineCategory>,
    @InjectRepository(Fine) private fineRepo: Repository<Fine>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(FinePaymentLink) private linkRepo: Repository<FinePaymentLink>,
    @InjectRepository(CashLedgerEntry) private ledgerRepo: Repository<CashLedgerEntry>,
  ) {}

  async run() {
    const existingUsers = await this.userRepo.count();
    if (existingUsers > 0) {
      this.logger.log('Database already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding database...');

    const passwordHash = await argon2.hash('Test1234!');

    // --- Roles ---
    const roleEntities: Record<string, Role> = {};
    for (const name of [RoleName.ADMIN, RoleName.COACH, RoleName.PLAYER, RoleName.TREASURER]) {
      const role = this.roleRepo.create({ name, description: name });
      roleEntities[name] = await this.roleRepo.save(role);
    }

    // --- Users ---
    const userDefs = [
      { first_name: 'Admin', last_name: 'User', email: 'admin@schwand.at', roles: [RoleName.ADMIN] },
      { first_name: 'Franz', last_name: 'Huber', email: 'trainer@schwand.at', roles: [RoleName.COACH] },
      { first_name: 'Max', last_name: 'Mustermann', email: 'spieler1@schwand.at', roles: [RoleName.PLAYER] },
      { first_name: 'Peter', last_name: 'Mayer', email: 'spieler2@schwand.at', roles: [RoleName.PLAYER] },
      { first_name: 'Klaus', last_name: 'Bauer', email: 'kassenwart@schwand.at', roles: [RoleName.TREASURER] },
    ];

    const users: Record<string, User> = {};
    for (const def of userDefs) {
      const user = this.userRepo.create({
        first_name: def.first_name,
        last_name: def.last_name,
        email: def.email,
        password_hash: passwordHash,
        status: 'ACTIVE',
      });
      const saved = await this.userRepo.save(user);
      users[def.email] = saved;

      for (const roleName of def.roles) {
        const userRole = this.userRoleRepo.create({
          user_id: saved.id,
          role_id: roleEntities[roleName].id,
        });
        await this.userRoleRepo.save(userRole);
      }
    }

    // --- Team ---
    const team = await this.teamRepo.save(
      this.teamRepo.create({ name: 'Union Schwand', season: '2025/26', is_active: true }),
    );

    const playerIds = [users['spieler1@schwand.at'].id, users['spieler2@schwand.at'].id];
    const shirtNumbers: Record<string, number> = {
      [users['spieler1@schwand.at'].id]: 10,
      [users['spieler2@schwand.at'].id]: 7,
    };

    for (const userId of playerIds) {
      await this.membershipRepo.save(
        this.membershipRepo.create({ user_id: userId, team_id: team.id, shirt_number: shirtNumbers[userId] }),
      );
    }

    // --- Fine Categories ---
    const cats: Record<string, FineCategory> = {};
    const catDefs = [
      { name: 'Zu spät', default_amount: 5 },
      { name: 'Nicht erschienen', default_amount: 20 },
      { name: 'Handy in der Kabine', default_amount: 3 },
      { name: 'Falsches Trikot', default_amount: 10 },
    ];
    for (const def of catDefs) {
      cats[def.name] = await this.categoryRepo.save(this.categoryRepo.create(def));
    }

    // --- Past Events (5) ---
    const trainer = users['trainer@schwand.at'];
    const past = [
      { type: EventType.TRAINING, title: 'Dienstags-Training', location: 'Sportplatz Schwand', starts_at: new Date('2026-05-05T18:00:00') },
      { type: EventType.MATCH, title: 'Heimspiel gegen FC Traun', location: 'Sportplatz Schwand', starts_at: new Date('2026-05-08T15:00:00') },
      { type: EventType.TRAINING, title: 'Dienstags-Training', location: 'Sportplatz Schwand', starts_at: new Date('2026-05-12T18:00:00') },
      { type: EventType.TRAINING, title: 'Dienstags-Training', location: 'Sportplatz Schwand', starts_at: new Date('2026-05-19T18:00:00') },
      { type: EventType.MATCH, title: 'Auswärtsspiel bei ATSV Stadl-Paura', location: 'Sportplatz Stadl-Paura', starts_at: new Date('2026-05-26T15:00:00') },
    ];

    const s1 = users['spieler1@schwand.at'];
    const s2 = users['spieler2@schwand.at'];

    // Participation pattern for past events [s1_status, s2_status, s1_reason, s2_reason]
    const pastPattern = [
      [ParticipationStatus.ACCEPTED, ParticipationStatus.ACCEPTED, null, null],
      [ParticipationStatus.ACCEPTED, ParticipationStatus.DECLINED, null, 'Verletzung am Knie'],
      [ParticipationStatus.ACCEPTED, ParticipationStatus.ACCEPTED, null, null],
      [ParticipationStatus.DECLINED, ParticipationStatus.ACCEPTED, 'Urlaub in Italien', null],
      [ParticipationStatus.ACCEPTED, ParticipationStatus.ACCEPTED, null, null],
    ];

    for (let i = 0; i < past.length; i++) {
      const event = await this.eventRepo.save(
        this.eventRepo.create({ ...past[i], created_by_id: trainer.id }),
      );
      const [s1Status, s2Status, s1Reason, s2Reason] = pastPattern[i];
      await this.participationRepo.save([
        this.participationRepo.create({ event_id: event.id, user_id: s1.id, status: s1Status as ParticipationStatus, decline_reason: s1Reason }),
        this.participationRepo.create({ event_id: event.id, user_id: s2.id, status: s2Status as ParticipationStatus, decline_reason: s2Reason }),
      ]);
    }

    // --- Future Events (3) ---
    const future = [
      {
        type: EventType.TRAINING, title: 'Dienstags-Training', location: 'Sportplatz Schwand',
        starts_at: new Date('2026-06-09T18:00:00'), response_deadline: new Date('2026-06-08T23:59:00'),
      },
      {
        type: EventType.MATCH, title: 'Heimspiel gegen SV Garsten', location: 'Sportplatz Schwand',
        starts_at: new Date('2026-06-13T15:00:00'), response_deadline: new Date('2026-06-11T23:59:00'),
      },
      {
        type: EventType.TRAINING, title: 'Dienstags-Training', location: 'Sportplatz Schwand',
        starts_at: new Date('2026-06-16T18:00:00'), response_deadline: new Date('2026-06-15T23:59:00'),
      },
    ];

    for (const eventDef of future) {
      const event = await this.eventRepo.save(
        this.eventRepo.create({ ...eventDef, created_by_id: trainer.id }),
      );
      await this.participationRepo.save([
        this.participationRepo.create({ event_id: event.id, user_id: s1.id, status: ParticipationStatus.PENDING }),
        this.participationRepo.create({ event_id: event.id, user_id: s2.id, status: ParticipationStatus.PENDING }),
      ]);
    }

    // --- Fines ---
    const fine1 = await this.fineRepo.save(
      this.fineRepo.create({
        user_id: s1.id,
        fine_category_id: cats['Zu spät'].id,
        amount: 5,
        status: FineStatus.OPEN,
        notes: 'Training am 05.05.',
        assigned_by_id: trainer.id,
      }),
    );
    const fine2 = await this.fineRepo.save(
      this.fineRepo.create({
        user_id: s1.id,
        fine_category_id: cats['Handy in der Kabine'].id,
        amount: 3,
        status: FineStatus.OPEN,
        notes: 'Handy am 12.05.',
        assigned_by_id: trainer.id,
      }),
    );
    const fine3 = await this.fineRepo.save(
      this.fineRepo.create({
        user_id: s1.id,
        fine_category_id: cats['Falsches Trikot'].id,
        amount: 10,
        status: FineStatus.PAID,
        notes: 'Falsches Trikot im April',
        assigned_by_id: trainer.id,
      }),
    );
    await this.fineRepo.save(
      this.fineRepo.create({
        user_id: s2.id,
        fine_category_id: cats['Nicht erschienen'].id,
        amount: 20,
        status: FineStatus.OPEN,
        notes: 'Nicht erschienen am 08.05.',
        assigned_by_id: trainer.id,
      }),
    );

    // --- Payment for fine3 ---
    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        user_id: s1.id,
        amount: 10,
        provider: PaymentProvider.MANUAL,
        notes: 'Barzahlung',
        recorded_by_id: users['kassenwart@schwand.at'].id,
      }),
    );
    await this.linkRepo.save(
      this.linkRepo.create({ fine_id: fine3.id, payment_id: payment.id, allocated_amount: 10 }),
    );

    // --- Ledger entries ---
    await this.ledgerRepo.save([
      this.ledgerRepo.create({
        type: LedgerEntryType.INCOME,
        category: 'Turnier-Erlös',
        amount: 150,
        note: 'Hallenturnier Wels, April 2026',
        recorded_by_id: users['kassenwart@schwand.at'].id,
        payment_id: null,
      }),
      this.ledgerRepo.create({
        type: LedgerEntryType.INCOME,
        category: 'Strafzahlung',
        amount: 10,
        note: 'Strafzahlung Max Mustermann (Falsches Trikot)',
        recorded_by_id: users['kassenwart@schwand.at'].id,
        payment_id: payment.id,
      }),
    ]);

    this.logger.log('Seeding complete!');
    this.logger.log('--- Login credentials (password: Test1234!) ---');
    this.logger.log('  Admin:      admin@schwand.at');
    this.logger.log('  Coach:      trainer@schwand.at');
    this.logger.log('  Spieler 1:  spieler1@schwand.at');
    this.logger.log('  Spieler 2:  spieler2@schwand.at');
    this.logger.log('  Kassenwart: kassenwart@schwand.at');
  }
}
