import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { TeamMembership } from '../team/entities/team-membership.entity';
import { Fine, FineStatus } from '../fines/entities/fine.entity';
import { Event } from '../events/entities/event.entity';
import { Participation } from '../events/entities/participation.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private userRoleRepo: Repository<UserRole>,
    @InjectRepository(TeamMembership) private membershipRepo: Repository<TeamMembership>,
    @InjectRepository(Fine) private fineRepo: Repository<Fine>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Participation) private participationRepo: Repository<Participation>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find({ where: { status: 'ACTIVE' } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(data: Partial<User>, roleNames: string[] = ['PLAYER']): Promise<User> {
    const passwordHash = await argon2.hash(data.password_hash || 'Test1234!');
    const user = this.userRepo.create({ ...data, password_hash: passwordHash });
    const saved = await this.userRepo.save(user);

    for (const roleName of roleNames) {
      const role = await this.roleRepo.findOne({ where: { name: roleName as any } });
      if (role) {
        const userRole = this.userRoleRepo.create({ user_id: saved.id, role_id: role.id });
        await this.userRoleRepo.save(userRole);
      }
    }

    return this.findById(saved.id);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.userRepo.update(id, { status: 'INACTIVE' });
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await argon2.hash(refreshToken);
    await this.userRepo.update(userId, { refresh_token_hash: hash });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refresh_token_hash: null });
  }

  async validateRefreshToken(userId: string, refreshToken: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user.refresh_token_hash) throw new UnauthorizedException('Token invalid');
    const valid = await argon2.verify(user.refresh_token_hash, refreshToken);
    if (!valid) throw new UnauthorizedException('Token invalid');
    return user;
  }

  async getDashboard(userId: string) {
    const user = await this.findById(userId);

    const openFines = await this.fineRepo.find({ where: { user_id: userId, status: FineStatus.OPEN } });
    const totalOpenAmount = openFines.reduce((sum, f) => sum + Number(f.amount), 0);

    const now = new Date();
    const upcomingParticipations = await this.participationRepo.find({
      where: { user_id: userId },
      relations: ['event'],
      order: { event: { starts_at: 'ASC' } } as any,
    });
    const nextEvents = upcomingParticipations
      .filter((p) => p.event && new Date(p.event.starts_at) > now && !p.event.is_cancelled)
      .slice(0, 3)
      .map((p) => ({ ...p.event, my_participation: p }));

    const recentPayments = await this.paymentRepo.find({
      where: { user_id: userId },
      order: { paid_at: 'DESC' },
      take: 3,
      relations: ['fine_payment_links', 'fine_payment_links.fine'],
    });

    return {
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email },
      open_fines: { count: openFines.length, total_amount: totalOpenAmount, items: openFines },
      next_events: nextEvents,
      recent_payments: recentPayments,
    };
  }

  async getTeamMembers(teamId?: string) {
    const query = this.membershipRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'user')
      .where('user.status = :status', { status: 'ACTIVE' })
      .andWhere('m.left_at IS NULL');
    return query.getMany();
  }
}
