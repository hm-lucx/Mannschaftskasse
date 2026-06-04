import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participation, ParticipationStatus } from '../events/entities/participation.entity';
import { Fine, FineStatus } from '../fines/entities/fine.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Participation) private participationRepo: Repository<Participation>,
    @InjectRepository(Fine) private fineRepo: Repository<Fine>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getAttendanceReport(from?: string, to?: string) {
    const qb = this.participationRepo
      .createQueryBuilder('p')
      .leftJoin('p.event', 'e')
      .leftJoin('p.user', 'u')
      .select([
        'u.id as user_id',
        'u.first_name as first_name',
        'u.last_name as last_name',
        `COUNT(*) as total`,
        `SUM(CASE WHEN p.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted`,
        `SUM(CASE WHEN p.status = 'DECLINED' THEN 1 ELSE 0 END) as declined`,
        `SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END) as pending`,
      ])
      .groupBy('u.id, u.first_name, u.last_name');

    if (from) qb.andWhere('e.starts_at >= :from', { from });
    if (to) qb.andWhere('e.starts_at <= :to', { to });

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      user_id: r.user_id,
      name: `${r.first_name} ${r.last_name}`,
      total: Number(r.total),
      accepted: Number(r.accepted),
      declined: Number(r.declined),
      pending: Number(r.pending),
      acceptance_rate: r.total > 0 ? Math.round((r.accepted / r.total) * 100) : 0,
    }));
  }

  async getFinesReport(from?: string, to?: string, categoryId?: string) {
    const qb = this.fineRepo
      .createQueryBuilder('f')
      .leftJoin('f.user', 'u')
      .leftJoin('f.fine_category', 'fc')
      .select([
        'u.id as user_id',
        'u.first_name as first_name',
        'u.last_name as last_name',
        `SUM(f.amount) as total_amount`,
        `SUM(CASE WHEN f.status = 'OPEN' THEN f.amount ELSE 0 END) as open_amount`,
        `SUM(CASE WHEN f.status = 'PAID' THEN f.amount ELSE 0 END) as paid_amount`,
        `COUNT(*) as count`,
      ])
      .groupBy('u.id, u.first_name, u.last_name')
      .andWhere('f.status != :cancelled', { cancelled: FineStatus.CANCELLED });

    if (from) qb.andWhere('f.assigned_at >= :from', { from });
    if (to) qb.andWhere('f.assigned_at <= :to', { to });
    if (categoryId) qb.andWhere('f.fine_category_id = :categoryId', { categoryId });

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      user_id: r.user_id,
      name: `${r.first_name} ${r.last_name}`,
      count: Number(r.count),
      total_amount: Number(r.total_amount),
      open_amount: Number(r.open_amount),
      paid_amount: Number(r.paid_amount),
    }));
  }

  async exportCsv(from?: string, to?: string): Promise<string> {
    const finesData = await this.getFinesReport(from, to);
    const header = 'Name,Strafen gesamt,Offener Betrag,Bezahlter Betrag';
    const rows = finesData.map(
      (r) => `"${r.name}",${r.total_amount},${r.open_amount},${r.paid_amount}`,
    );
    return [header, ...rows].join('\n');
  }
}
