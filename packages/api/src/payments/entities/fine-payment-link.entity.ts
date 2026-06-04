import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { Fine } from '../../fines/entities/fine.entity';

@Entity('fine_payment_links')
export class FinePaymentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fine_id: string;

  @Column()
  payment_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  allocated_amount: number;

  @ManyToOne(() => Payment, (p) => p.fine_payment_links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => Fine, { eager: true })
  @JoinColumn({ name: 'fine_id' })
  fine: Fine;
}
