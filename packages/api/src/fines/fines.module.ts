import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinesService } from './fines.service';
import { FinesController } from './fines.controller';
import { Fine } from './entities/fine.entity';
import { FineCategory } from './entities/fine-category.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Fine, FineCategory]), AuditModule],
  controllers: [FinesController],
  providers: [FinesService],
  exports: [FinesService, TypeOrmModule],
})
export class FinesModule {}
