import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LedgerEntryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity('cash_ledger_entries')
export class CashLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: LedgerEntryType;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  recorded_by_id: string;

  @Column({ nullable: true })
  payment_id: string;

  @CreateDateColumn()
  occurred_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recorded_by: User;
}
