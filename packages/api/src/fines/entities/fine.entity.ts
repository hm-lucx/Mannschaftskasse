import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FineCategory } from './fine-category.entity';

export enum FineStatus {
  OPEN = 'OPEN',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  fine_category_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: FineStatus.OPEN })
  status: FineStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  event_id: string;

  @Column({ nullable: true })
  assigned_by_id: string;

  @CreateDateColumn()
  assigned_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => FineCategory, (fc) => fc.fines, { eager: true })
  @JoinColumn({ name: 'fine_category_id' })
  fine_category: FineCategory;
}
