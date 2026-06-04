import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from './team.entity';

@Entity('team_memberships')
export class TeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  team_id: string;

  @Column({ nullable: true })
  shirt_number: number;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  left_at: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Team, (team) => team.memberships)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
