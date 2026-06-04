import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FinePaymentLink } from './fine-payment-link.entity';

export enum PaymentProvider {
  MANUAL = 'MANUAL',
  PAYPAL_LINK = 'PAYPAL_LINK',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: PaymentProvider.MANUAL })
  provider: PaymentProvider;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  recorded_by_id: string;

  @CreateDateColumn()
  paid_at: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => FinePaymentLink, (link) => link.payment, { eager: true })
  fine_payment_links: FinePaymentLink[];
}
