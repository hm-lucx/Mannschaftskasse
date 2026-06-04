import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Fine, FineStatus } from './entities/fine.entity';
import { FineCategory } from './entities/fine-category.entity';
import { AuditService } from '../audit/audit.service';
import { CreateFineDto } from './dto/create-fine.dto';
import { CreateFineCategoryDto } from './dto/create-fine-category.dto';

@Injectable()
export class FinesService {
  constructor(
    @InjectRepository(Fine) private fineRepo: Repository<Fine>,
    @InjectRepository(FineCategory) private categoryRepo: Repository<FineCategory>,
    private auditService: AuditService,
  ) {}

  async findAllCategories(): Promise<FineCategory[]> {
    return this.categoryRepo.find({ where: { is_active: true }, order: { name: 'ASC' } });
  }

  async createCategory(dto: CreateFineCategoryDto, actorId: string): Promise<FineCategory> {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: Partial<CreateFineCategoryDto>, actorId: string): Promise<FineCategory> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Fine category not found');
    await this.categoryRepo.update(id, dto);
    return this.categoryRepo.findOne({ where: { id } });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepo.update(id, { is_active: false });
  }

  async findAll(userId: string, userRoles: string[], status?: FineStatus): Promise<Fine[]> {
    const isPrivileged = userRoles.some((r) => ['ADMIN', 'COACH', 'TREASURER'].includes(r));
    const where: FindOptionsWhere<Fine> = {};

    if (!isPrivileged) {
      where.user_id = userId;
    }

    if (status) {
      where.status = status;
    }

    return this.fineRepo.find({
      where,
      order: { assigned_at: 'DESC' },
      relations: ['user', 'fine_category'],
    });
  }

  async create(dto: CreateFineDto, actorId: string): Promise<Fine> {
    const fine = this.fineRepo.create({ ...dto, assigned_by_id: actorId });
    const saved = await this.fineRepo.save(fine);
    await this.auditService.log(actorId, 'CREATE_FINE', 'Fine', saved.id, null, dto);
    return this.fineRepo.findOne({ where: { id: saved.id }, relations: ['user', 'fine_category'] });
  }

  async update(id: string, dto: Partial<CreateFineDto>, actorId: string): Promise<Fine> {
    const fine = await this.fineRepo.findOne({ where: { id } });
    if (!fine) throw new NotFoundException('Fine not found');
    await this.auditService.log(actorId, 'UPDATE_FINE', 'Fine', id, fine, dto);
    await this.fineRepo.update(id, dto as any);
    return this.fineRepo.findOne({ where: { id }, relations: ['user', 'fine_category'] });
  }

  async cancel(id: string, actorId: string): Promise<void> {
    const fine = await this.fineRepo.findOne({ where: { id } });
    if (!fine) throw new NotFoundException('Fine not found');
    await this.auditService.log(actorId, 'CANCEL_FINE', 'Fine', id, fine, { status: FineStatus.CANCELLED });
    await this.fineRepo.update(id, { status: FineStatus.CANCELLED });
  }
}
