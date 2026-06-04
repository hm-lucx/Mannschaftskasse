import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Participation } from '../events/entities/participation.entity';
import { Fine } from '../fines/entities/fine.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Participation, Fine, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
