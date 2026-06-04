import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Participation } from './participation.entity';
import { User } from '../../users/entities/user.entity';

export enum EventType {
  TRAINING = 'TRAINING',
  MATCH = 'MATCH',
  OTHER = 'OTHER',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: EventType;

  @Column()
  title: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'timestamp' })
  starts_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  response_deadline: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  is_cancelled: boolean;

  @Column({ nullable: true })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Participation, (p) => p.event)
  participations: Participation[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;
}
