import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

export enum ParticipationStatus {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
}

@Entity('participations')
@Unique(['event_id', 'user_id'])
export class Participation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  event_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'varchar', default: ParticipationStatus.PENDING })
  status: ParticipationStatus;

  @Column({ nullable: true })
  decline_reason: string;

  @UpdateDateColumn()
  responded_at: Date;

  @ManyToOne(() => Event, (e) => e.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
