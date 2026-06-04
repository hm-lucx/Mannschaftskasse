import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';

export enum RoleName {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  TREASURER = 'TREASURER',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: RoleName;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}
