import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { TeamMembership } from '../team/entities/team-membership.entity';
import { Fine } from '../fines/entities/fine.entity';
import { Event } from '../events/entities/event.entity';
import { Participation } from '../events/entities/participation.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserRole, TeamMembership, Fine, Event, Participation, Payment])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
