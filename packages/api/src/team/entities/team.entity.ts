import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TeamMembership } from './team-membership.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  season: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => TeamMembership, (m) => m.team)
  memberships: TeamMembership[];
}
