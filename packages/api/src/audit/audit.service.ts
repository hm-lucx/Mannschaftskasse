import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>) {}

  async log(
    actorId: string,
    action: string,
    entityName: string,
    entityId: string,
    before: any,
    after: any,
  ): Promise<void> {
    const entry = this.auditRepo.create({
      actor_user_id: actorId,
      action,
      entity_name: entityName,
      entity_id: entityId,
      before_json: before,
      after_json: after,
    });
    await this.auditRepo.save(entry);
  }
}
